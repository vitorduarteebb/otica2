from rest_framework import status, permissions, generics, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, F, DecimalField, ExpressionWrapper
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Store, Product, Seller, Sale, SaleItem, StoreProduct, CashTillSession, Order, Category, Cliente, Fornecedor, ContaPagar, ContaReceber, Funcionario, FolhaPagamento, RelatorioFinanceiro
from .serializers import (
    UserSerializer, StoreSerializer, ProductSerializer, SellerSerializer,
    SaleSerializer, SaleCreateSerializer, StoreProductSerializer, CashTillSessionSerializer,
    OrderSerializer, CategorySerializer, ClienteSerializer, FornecedorSerializer, FuncionarioSerializer, ContaPagarSerializer, ContaReceberSerializer, FolhaPagamentoSerializer, RelatorioFinanceiroSerializer
)
from rest_framework.serializers import ValidationError
from django.utils import timezone
from decimal import Decimal
from rest_framework.decorators import action

# --- Permissions ---

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsStoreManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'gerente'

# --- Auth Views ---

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    return Response({'error': 'Credenciais inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

# --- User Views ---

class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

# --- Store Views ---

class StoreListCreateView(generics.ListCreateAPIView):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Store.objects.all()
        elif user.store:
            return Store.objects.filter(id=user.store.id)
        return Store.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Apenas administradores podem criar lojas.")
        serializer.save()

class StoreRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Store.objects.all()
        elif user.store:
            return Store.objects.filter(id=user.store.id)
        return Store.objects.none()

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Apenas administradores podem editar lojas.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Apenas administradores podem excluir lojas.")
        instance.delete()

# --- Category Views ---

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(active=True).order_by('name')

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Apenas administradores podem criar categorias.")
        serializer.save()

class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Apenas administradores podem editar categorias.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Apenas administradores podem excluir categorias.")
        # Verificar se há produtos usando esta categoria
        if Product.objects.filter(category=instance).exists():
            raise ValidationError("Não é possível excluir uma categoria que possui produtos associados.")
        instance.delete()

# --- Product Views ---

class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.all()

        if user.role != 'admin':
            if user.store:
                store_product_ids = StoreProduct.objects.filter(store=user.store).values_list('product_id', flat=True)
                queryset = queryset.filter(id__in=store_product_ids)
            else:
                return Product.objects.none()
        
        category = self.request.query_params.get('category')
        product_name = self.request.query_params.get('product_name')

        if category:
            queryset = queryset.filter(category=category)
        if product_name:
            queryset = queryset.filter(name__icontains=product_name)
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        product = serializer.save()
        if user.role != 'admin' and user.store:
            StoreProduct.objects.create(store=user.store, product=product, quantity=0)

class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# --- StoreProduct Views ---

class StoreProductViewSet(viewsets.ModelViewSet):
    serializer_class = StoreProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            queryset = StoreProduct.objects.all()
        elif user.store:
            queryset = StoreProduct.objects.filter(store=user.store)
        else:
            queryset = StoreProduct.objects.none()

        store_id = self.request.query_params.get('store')
        stock_level = self.request.query_params.get('stock_level')

        if store_id:
            queryset = queryset.filter(store_id=store_id)
        if stock_level:
            if stock_level == 'low':
                queryset = queryset.filter(quantity__gt=0, quantity__lt=5)
            elif stock_level == 'out':
                queryset = queryset.filter(quantity=0)
            elif stock_level == 'normal':
                queryset = queryset.filter(quantity__gte=5)
        
        return queryset.select_related('product', 'store')

# --- Sale Views ---

class SaleListCreateView(generics.ListCreateAPIView):
    queryset = Sale.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SaleCreateSerializer
        return SaleSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            queryset = Sale.objects.all()
        elif user.store:
            queryset = Sale.objects.filter(store=user.store)
        else:
            return Sale.objects.none()

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        payment_method = self.request.query_params.get('payment_method')
        seller_id = self.request.query_params.get('seller')

        if start_date:
            queryset = queryset.filter(sale_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(sale_date__lte=end_date)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        if seller_id:
            queryset = queryset.filter(seller_id=seller_id)

        return queryset.select_related('seller', 'store').prefetch_related('items__product')

    def perform_create(self, serializer):
        user = self.request.user
        store = user.store
        if user.role == 'admin':
            store_id = self.request.data.get('store')
            if not store_id:
                raise ValidationError({'store': 'Este campo é obrigatório para administradores.'})
            try:
                store = Store.objects.get(pk=store_id)
            except Store.DoesNotExist:
                raise ValidationError({'store': 'Loja inválida.'})
        
        serializer.save(store=store)


class SaleRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Sale.objects.all()
        if user.store:
            return Sale.objects.filter(store=user.store)
        return Sale.objects.none()

# --- Seller Views ---

class SellerListCreateView(generics.ListCreateAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            queryset = Seller.objects.all()
        elif user.store:
            queryset = Seller.objects.filter(store=user.store)
        else:
            return Seller.objects.none()
        
        name = self.request.query_params.get('name')
        if name:
            queryset = queryset.filter(name__icontains=name)
            
        return queryset.order_by('name')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'admin':
            serializer.save(store=user.store)
        else:
            serializer.save()

class SellerRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Seller.objects.all()
        if user.store:
            return Seller.objects.filter(store=user.store)
        return Seller.objects.none()

# --- Report Views ---

class SalesReportView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Sale.objects.none()

    def list(self, request, *args, **kwargs):
        user = request.user
        queryset = Sale.objects.all()

        store_id = self.request.query_params.get('store')
        if user.role == 'admin':
            if store_id:
                queryset = queryset.filter(store_id=store_id)
        elif user.store:
            queryset = queryset.filter(store=user.store)
        else:
            queryset = Sale.objects.none()

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(sale_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(sale_date__date__lte=end_date)
            
        if user.role == 'admin' and not store_id:
            data = queryset.values('store__name').annotate(
                total_sales=Count('id'),
                total_revenue=Sum('total_amount')
            ).order_by('-total_revenue')
        else:
            data = queryset.aggregate(
                total_sales=Count('id'),
                total_revenue=Sum('total_amount')
            )
            data = [data] if data.get('total_sales') else []
            
        return Response(data)

class ProductsReportView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = SaleItem.objects.select_related('product', 'sale')
        
        if user.role == 'admin':
            store_id = self.request.query_params.get('store')
            if store_id:
                queryset = queryset.filter(sale__store_id=store_id)
        elif user.store:
            queryset = queryset.filter(sale__store=user.store)
        else:
            queryset = SaleItem.objects.none()
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Group by product and calculate totals
        product_stats = {}
        for item in queryset:
            product_name = item.product.name
            if product_name not in product_stats:
                product_stats[product_name] = {
                    'product__name': product_name,
                    'quantity': 0,
                    'total': 0
                }
            product_stats[product_name]['quantity'] += item.quantity
            product_stats[product_name]['total'] += float(item.quantity * item.unit_price)
        
        # Convert to list and sort
        products_list = list(product_stats.values())
        top_products = sorted(products_list, key=lambda x: x['quantity'], reverse=True)[:5]
        less_sold_products = sorted(products_list, key=lambda x: x['quantity'])[:5]

        data = {
            'top_products': top_products,
            'less_sold_products': less_sold_products
        }

        return Response(data)

class DashboardStatsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        store_id = request.query_params.get('store')
        
        sales_qs = Sale.objects.all()
        products_qs = StoreProduct.objects.all()
        
        if user.role == 'admin':
            if store_id:
                sales_qs = sales_qs.filter(store_id=store_id)
                products_qs = products_qs.filter(store_id=store_id)
        elif user.store:
            sales_qs = sales_qs.filter(store=user.store)
            products_qs = products_qs.filter(store=user.store)
        else:
            sales_qs = sales_qs.none()
            products_qs = products_qs.none()

        total_revenue = sales_qs.aggregate(total=Sum('total_amount'))['total'] or 0
        
        stats = {
            'total_sales': sales_qs.count(),
            'total_revenue': total_revenue,
            'low_stock_products': products_qs.filter(quantity__lt=5, quantity__gt=0).count(),
            'out_of_stock_products': products_qs.filter(quantity=0).count()
        }
        
        if user.role == 'admin' and not store_id:
             stats['total_stores'] = Store.objects.count()

        return Response(stats)

# --- Cash Till Views ---

class CashTillSessionViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return CashTillSession.objects.all()
        if user.store:
            return CashTillSession.objects.filter(store=user.store)
        return CashTillSession.objects.none()

    @action(detail=False, methods=['get'], url_path='status')
    def get_status(self, request):
        user = request.user
        session = None

        try:
            if user.role == 'admin':
                # For admin, find any session opened by them that is currently active.
                # This assumes an admin can only have one open session at a time across all stores.
                session = CashTillSession.objects.get(opened_by=user, status='aberto')
            elif user.store:
                # For managers, find the open session for their specific store.
                session = CashTillSession.objects.get(store=user.store, status='aberto')
            else:
                # No store associated, so no session can be active.
                return Response({'status': 'fechado'})
        except CashTillSession.DoesNotExist:
            return Response({'status': 'fechado'})
        except CashTillSession.MultipleObjectsReturned:
            # Handle case where admin might have multiple open sessions (should not happen with proper logic)
            # We'll take the most recent one.
            session = CashTillSession.objects.filter(opened_by=user, status='aberto').latest('opened_at')

        if session:
            serializer = CashTillSessionSerializer(session)
            return Response(serializer.data)
        
        return Response({'status': 'fechado'})

    @action(detail=False, methods=['post'], url_path='open')
    def open_session(self, request):
        serializer = CashTillSessionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='close')
    def close_session(self, request, pk=None):
        session = self.get_queryset().get(pk=pk)
        
        if session.status == 'fechado':
            return Response({'error': 'Este caixa já está fechado.'}, status=status.HTTP_400_BAD_REQUEST)

        final_amount_reported_str = request.data.get('final_amount_reported')
        if not final_amount_reported_str:
             return Response({'error': 'O valor final informado é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            final_amount_reported = Decimal(final_amount_reported_str)
        except:
            return Response({'error': 'Valor final inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculation
        total_sales_in_cash = session.sales.filter(payment_method='dinheiro').aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
        final_amount_calculated = session.initial_amount + total_sales_in_cash
        difference = final_amount_reported - final_amount_calculated

        session.closed_by = request.user
        session.closed_at = timezone.now()
        session.final_amount_reported = final_amount_reported
        session.final_amount_calculated = final_amount_calculated
        session.difference = difference
        session.notes = request.data.get('notes', '')
        session.status = 'fechado'
        session.save()

        serializer = CashTillSessionSerializer(session)
        return Response(serializer.data)
    
    def list(self, request):
        queryset = self.get_queryset().order_by('-opened_at')
        serializer = CashTillSessionSerializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        session = self.get_queryset().get(pk=pk)
        serializer = CashTillSessionSerializer(session)
        return Response(serializer.data)

# --- Order Views ---

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            queryset = Order.objects.all()
        elif user.store:
            queryset = Order.objects.filter(store=user.store)
        else:
            queryset = Order.objects.none()

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset.select_related('seller', 'store')

    def perform_create(self, serializer):
        user = self.request.user
        store = user.store
        if user.role == 'admin':
            store_id = self.request.data.get('store')
            if not store_id:
                raise ValidationError({'store': 'Este campo é obrigatório para administradores.'})
            try:
                store = Store.objects.get(pk=store_id)
            except Store.DoesNotExist:
                raise ValidationError({'store': 'Loja inválida.'})

        serializer.save(store=store)

# --- Cliente Views ---

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('-criado_em')
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- Views para Gestão Financeira ---

class FornecedorViewSet(viewsets.ModelViewSet):
    queryset = Fornecedor.objects.filter(ativo=True).order_by('nome')
    serializer_class = FornecedorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Fornecedor.objects.filter(ativo=True).order_by('nome')
        elif user.store:
            # Filtrar fornecedores que têm contas relacionadas à loja do usuário
            fornecedores_ids = ContaPagar.objects.filter(
                store=user.store, 
                fornecedor__isnull=False
            ).values_list('fornecedor_id', flat=True).distinct()
            return Fornecedor.objects.filter(id__in=fornecedores_ids, ativo=True).order_by('nome')
        return Fornecedor.objects.none()

class FuncionarioViewSet(viewsets.ModelViewSet):
    serializer_class = FuncionarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Funcionario.objects.filter(ativo=True).order_by('nome')
        elif user.store:
            return Funcionario.objects.filter(store=user.store, ativo=True).order_by('nome')
        return Funcionario.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'admin' and user.store:
            serializer.save(store=user.store)
        else:
            serializer.save()

class ContaPagarViewSet(viewsets.ModelViewSet):
    serializer_class = ContaPagarSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ContaPagar.objects.all()
        
        if user.role != 'admin' and user.store:
            queryset = queryset.filter(store=user.store)
        
        # Filtros
        status = self.request.query_params.get('status')
        tipo = self.request.query_params.get('tipo')
        fornecedor = self.request.query_params.get('fornecedor')
        data_vencimento_inicio = self.request.query_params.get('data_vencimento_inicio')
        data_vencimento_fim = self.request.query_params.get('data_vencimento_fim')
        
        if status:
            queryset = queryset.filter(status=status)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if fornecedor:
            queryset = queryset.filter(fornecedor_id=fornecedor)
        if data_vencimento_inicio:
            queryset = queryset.filter(data_vencimento__gte=data_vencimento_inicio)
        if data_vencimento_fim:
            queryset = queryset.filter(data_vencimento__lte=data_vencimento_fim)
        
        return queryset.order_by('data_vencimento')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'admin' and user.store:
            serializer.save(store=user.store)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def marcar_pago(self, request, pk=None):
        conta = self.get_object()
        valor_pago = request.data.get('valor_pago', conta.valor)
        data_pagamento = request.data.get('data_pagamento', timezone.now().date())
        
        conta.valor_pago = valor_pago
        conta.data_pagamento = data_pagamento
        conta.status = 'pago'
        conta.save()
        
        serializer = self.get_serializer(conta)
        return Response(serializer.data)

class ContaReceberViewSet(viewsets.ModelViewSet):
    serializer_class = ContaReceberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ContaReceber.objects.all()
        
        if user.role != 'admin' and user.store:
            queryset = queryset.filter(store=user.store)
        
        # Filtros
        status = self.request.query_params.get('status')
        tipo = self.request.query_params.get('tipo')
        cliente = self.request.query_params.get('cliente')
        data_vencimento_inicio = self.request.query_params.get('data_vencimento_inicio')
        data_vencimento_fim = self.request.query_params.get('data_vencimento_fim')
        
        if status:
            queryset = queryset.filter(status=status)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if cliente:
            queryset = queryset.filter(cliente_id=cliente)
        if data_vencimento_inicio:
            queryset = queryset.filter(data_vencimento__gte=data_vencimento_inicio)
        if data_vencimento_fim:
            queryset = queryset.filter(data_vencimento__lte=data_vencimento_fim)
        
        return queryset.order_by('data_vencimento')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'admin' and user.store:
            serializer.save(store=user.store)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def marcar_recebido(self, request, pk=None):
        conta = self.get_object()
        valor_recebido = request.data.get('valor_recebido', conta.valor)
        data_recebimento = request.data.get('data_recebimento', timezone.now().date())
        
        conta.valor_recebido = valor_recebido
        conta.data_recebimento = data_recebimento
        conta.status = 'recebido'
        conta.save()
        
        serializer = self.get_serializer(conta)
        return Response(serializer.data)

class FolhaPagamentoViewSet(viewsets.ModelViewSet):
    serializer_class = FolhaPagamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = FolhaPagamento.objects.all()
        
        if user.role != 'admin' and user.store:
            queryset = queryset.filter(funcionario__store=user.store)
        
        # Filtros
        funcionario = self.request.query_params.get('funcionario')
        ano = self.request.query_params.get('ano')
        mes = self.request.query_params.get('mes')
        pago = self.request.query_params.get('pago')
        
        if funcionario:
            queryset = queryset.filter(funcionario_id=funcionario)
        if ano:
            queryset = queryset.filter(ano=ano)
        if mes:
            queryset = queryset.filter(mes=mes)
        if pago is not None:
            queryset = queryset.filter(pago=pago.lower() == 'true')
        
        return queryset.order_by('-ano', '-mes')

    @action(detail=True, methods=['post'])
    def marcar_pago(self, request, pk=None):
        folha = self.get_object()
        data_pagamento = request.data.get('data_pagamento', timezone.now().date())
        
        folha.data_pagamento = data_pagamento
        folha.pago = True
        folha.save()
        
        serializer = self.get_serializer(folha)
        return Response(serializer.data)

class RelatorioFinanceiroViewSet(viewsets.ModelViewSet):
    serializer_class = RelatorioFinanceiroSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = RelatorioFinanceiro.objects.all()
        
        if user.role != 'admin' and user.store:
            queryset = queryset.filter(store=user.store)
        
        return queryset.order_by('-data_fim')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'admin' and user.store:
            serializer.save(store=user.store)
        else:
            serializer.save()

# --- Views para Dashboards e Relatórios ---

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_financeiro(request):
    """Dashboard com resumo financeiro"""
    user = request.user
    hoje = timezone.now().date()
    
    # Filtro por loja
    if user.role != 'admin' and user.store:
        store_filter = {'store': user.store}
    else:
        store_filter = {}
    
    # Período (mês atual)
    mes_atual = hoje.month
    ano_atual = hoje.year
    
    # Receitas do mês
    receitas_vendas = Sale.objects.filter(
        sale_date__month=mes_atual,
        sale_date__year=ano_atual,
        **store_filter
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    receitas_servicos = ContaReceber.objects.filter(
        tipo='servico',
        data_recebimento__month=mes_atual,
        data_recebimento__year=ano_atual,
        status='recebido',
        **store_filter
    ).aggregate(total=Sum('valor_recebido'))['total'] or 0
    
    receita_total = receitas_vendas + receitas_servicos
    
    # Despesas do mês
    despesas_fornecedores = ContaPagar.objects.filter(
        tipo='fornecedor',
        data_pagamento__month=mes_atual,
        data_pagamento__year=ano_atual,
        status='pago',
        **store_filter
    ).aggregate(total=Sum('valor_pago'))['total'] or 0
    
    despesas_funcionarios = FolhaPagamento.objects.filter(
        ano=ano_atual,
        mes=mes_atual,
        pago=True,
        funcionario__store__in=Store.objects.filter(**store_filter) if store_filter else Store.objects.all()
    ).aggregate(total=Sum('salario_liquido'))['total'] or 0
    
    despesa_total = despesas_fornecedores + despesas_funcionarios
    
    # Contas vencidas
    contas_pagar_vencidas = ContaPagar.objects.filter(
        data_vencimento__lt=hoje,
        status='pendente',
        **store_filter
    ).count()
    
    contas_receber_vencidas = ContaReceber.objects.filter(
        data_vencimento__lt=hoje,
        status='pendente',
        **store_filter
    ).count()
    
    # Funcionários
    total_funcionarios = Funcionario.objects.filter(
        ativo=True,
        **store_filter
    ).count()
    
    # Folha do mês
    folha_pagamento_mes = FolhaPagamento.objects.filter(
        ano=ano_atual,
        mes=mes_atual,
        funcionario__store__in=Store.objects.filter(**store_filter) if store_filter else Store.objects.all()
    ).aggregate(total=Sum('salario_liquido'))['total'] or 0
    
    # Fornecedores ativos
    fornecedores_ativos = Fornecedor.objects.filter(ativo=True).count()
    
    # Cálculos
    lucro_bruto = receita_total - despesa_total
    margem_lucro = (lucro_bruto / receita_total * 100) if receita_total > 0 else 0
    
    data = {
        'total_receitas': receita_total,
        'total_despesas': despesa_total,
        'lucro_bruto': lucro_bruto,
        'margem_lucro': round(margem_lucro, 2),
        'contas_pagar_vencidas': contas_pagar_vencidas,
        'contas_receber_vencidas': contas_receber_vencidas,
        'total_funcionarios': total_funcionarios,
        'folha_pagamento_mes': folha_pagamento_mes,
        'fornecedores_ativos': fornecedores_ativos,
    }
    
    return Response(data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def resumo_contas(request):
    """Resumo de contas a pagar e receber"""
    user = request.user
    hoje = timezone.now().date()
    
    # Filtro por loja
    if user.role != 'admin' and user.store:
        store_filter = {'store': user.store}
    else:
        store_filter = {}
    
    # Contas a pagar
    contas_pagar_pendentes = ContaPagar.objects.filter(
        status='pendente',
        data_vencimento__gte=hoje,
        **store_filter
    ).aggregate(total=Sum('valor'))['total'] or 0
    
    contas_pagar_vencidas = ContaPagar.objects.filter(
        status='pendente',
        data_vencimento__lt=hoje,
        **store_filter
    ).aggregate(total=Sum('valor'))['total'] or 0
    
    # Contas a receber
    contas_receber_pendentes = ContaReceber.objects.filter(
        status='pendente',
        data_vencimento__gte=hoje,
        **store_filter
    ).aggregate(total=Sum('valor'))['total'] or 0
    
    contas_receber_vencidas = ContaReceber.objects.filter(
        status='pendente',
        data_vencimento__lt=hoje,
        **store_filter
    ).aggregate(total=Sum('valor'))['total'] or 0
    
    data = {
        'contas_pagar_pendentes': contas_pagar_pendentes,
        'contas_pagar_vencidas': contas_pagar_vencidas,
        'contas_receber_pendentes': contas_receber_pendentes,
        'contas_receber_vencidas': contas_receber_vencidas,
        'total_pagar': contas_pagar_pendentes + contas_pagar_vencidas,
        'total_receber': contas_receber_pendentes + contas_receber_vencidas,
    }
    
    return Response(data) 