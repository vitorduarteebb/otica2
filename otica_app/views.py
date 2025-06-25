from rest_framework import status, permissions, generics, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, F, DecimalField, ExpressionWrapper
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Store, Product, Seller, Sale, SaleItem, StoreProduct, CashTillSession, Order, Category, Cliente
from .serializers import (
    UserSerializer, StoreSerializer, ProductSerializer, SellerSerializer,
    SaleSerializer, SaleCreateSerializer, StoreProductSerializer, CashTillSessionSerializer,
    OrderSerializer, CategorySerializer, ClienteSerializer
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