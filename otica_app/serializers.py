from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from .models import User, Store, Product, Seller, Sale, SaleItem, StockMovement, CashFlow, StoreProduct, CashTillSession, Order
from django.db.models import Sum


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'store', 'password']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data.get('password'))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data.get('password'))
        return super().update(instance, validated_data)


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciais inválidas.')
            if not user.is_active:
                raise serializers.ValidationError('Usuário desativado.')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Username e senha são obrigatórios.')
        
        return attrs


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name', 'address', 'phone', 'email', 'manager']


class ProductSerializer(serializers.ModelSerializer):
    store_quantity = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'cost', 'category', 'store_quantity', 'image']
    
    def get_store_quantity(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0

        user = request.user
        if user.role == 'admin':
            # For admins, return the total quantity across all stores
            return obj.store_products.aggregate(Sum('quantity'))['quantity__sum'] or 0
        
        if user.store:
            # For managers, return quantity for their specific store
            try:
                store_product = obj.store_products.get(store=user.store)
                return store_product.quantity
            except StoreProduct.DoesNotExist:
                return 0
        
        return 0


class StoreProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_category = serializers.CharField(source='product.category', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    
    class Meta:
        model = StoreProduct
        fields = ['id', 'store', 'product', 'quantity', 'product_name', 'product_price', 'product_category', 'store_name']


class SellerSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    
    class Meta:
        model = Seller
        fields = ['id', 'name', 'email', 'phone', 'store', 'store_name', 'created_at']


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['unit_price', 'total_price']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'store', 'store_name', 'seller', 'seller_name', 'customer_name',
            'customer_email', 'customer_phone', 'total_amount', 'payment_method', 
            'sale_date', 'items'
        ]


class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    seller = serializers.PrimaryKeyRelatedField(queryset=Seller.objects.all())
    
    class Meta:
        model = Sale
        fields = ['customer_name', 'customer_email', 'customer_phone', 'payment_method', 'seller', 'items']
    
    def create(self, validated_data):
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Contexto da requisição não encontrado.")

        user = request.user
        session = None

        try:
            if user.role == 'admin':
                # For admin, we need to find a session associated with them.
                # This logic might need refinement based on business rules,
                # e.g., an admin might need to select a store/session to sell for.
                session = CashTillSession.objects.filter(opened_by=user, status='aberto').first()
            elif user.store:
                session = CashTillSession.objects.filter(store=user.store, status='aberto').first()
            
            if not session:
                 raise serializers.ValidationError("Não há um caixa aberto para esta loja. Abra um caixa para registrar vendas.")

        except CashTillSession.DoesNotExist:
            raise serializers.ValidationError("Não há um caixa aberto. Abra um caixa para registrar vendas.")

        validated_data['cash_till_session'] = session
        validated_data['store'] = session.store
        
        items_data = validated_data.pop('items')
        sale = Sale.objects.create(**validated_data)
        
        total_amount = 0
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            unit_price = product.price
            total_price = unit_price * quantity
            
            try:
                store_product = StoreProduct.objects.get(product=product, store=session.store)
                if store_product.quantity < quantity:
                    raise serializers.ValidationError(f"Produto {product.name} não tem estoque suficiente na loja {session.store.name}.")
                
                store_product.quantity -= quantity
                store_product.save()
            except StoreProduct.DoesNotExist:
                 raise serializers.ValidationError(f"Produto {product.name} não encontrado no estoque da loja {session.store.name}.")

            
            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price
            )
            
            total_amount += total_price
            
            StockMovement.objects.create(
                product=product,
                quantity=quantity,
                movement_type='saida',
                reason=f'Venda #{sale.id}'
            )
        
        sale.total_amount = total_amount
        sale.save()
        
        if sale.payment_method in ['dinheiro', 'pix', 'cartao_debito', 'cartao_credito']:
            CashFlow.objects.create(
                store=sale.store,
                amount=total_amount,
                flow_type='entrada',
                description=f'Venda #{sale.id} ({sale.get_payment_method_display()})',
                cash_till_session=session
            )
        
        return sale


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    store_name = serializers.CharField(source='product.store.name', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'
    
    def create(self, validated_data):
        movement = StockMovement.objects.create(**validated_data)
        
        # Update product quantity
        product = movement.product
        if movement.movement_type == 'entrada':
            product.quantity += movement.quantity
        else:
            product.quantity -= movement.quantity
        product.save()
        
        return movement


class CashFlowSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    
    class Meta:
        model = CashFlow
        fields = '__all__'


class CashTillSessionSerializer(serializers.ModelSerializer):
    opened_by_name = serializers.CharField(source='opened_by.get_full_name', read_only=True)
    closed_by_name = serializers.CharField(source='closed_by.get_full_name', read_only=True, allow_null=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    store = serializers.PrimaryKeyRelatedField(queryset=Store.objects.all(), required=False)

    class Meta:
        model = CashTillSession
        fields = [
            'id', 'store', 'store_name', 'opened_by', 'opened_by_name', 
            'closed_by', 'closed_by_name', 'opened_at', 'closed_at', 
            'initial_amount', 'final_amount_reported', 'final_amount_calculated', 
            'difference', 'status', 'notes'
        ]
        read_only_fields = [
            'opened_by', 'closed_by', 'opened_at', 'closed_at', 
            'final_amount_calculated', 'difference', 'status'
        ]

    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        store = None
        if user.role == 'admin':
            store = validated_data.get('store')
            if not store:
                raise serializers.ValidationError({'store': 'Selecione a loja para abrir o caixa.'})
        else:
            store = user.store
            if not store:
                raise serializers.ValidationError('O usuário precisa estar associado a uma loja.')

        # Universal check: The user opening the session cannot have another one already open.
        if CashTillSession.objects.filter(opened_by=user, status='aberto').exists():
            raise serializers.ValidationError(f'Você já possui um caixa aberto. Feche-o antes de abrir um novo.')

        # Check if the specific store already has an open session by another user
        if CashTillSession.objects.filter(store=store, status='aberto').exists():
            raise serializers.ValidationError(f'A loja {store.name} já possui um caixa aberto por outro usuário.')

        validated_data['store'] = store
        validated_data['opened_by'] = user
        return super().create(validated_data)


class OrderSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    seller_name = serializers.CharField(source='seller.name', read_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['store'] 