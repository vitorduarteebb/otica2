from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'store-products', views.StoreProductViewSet, basename='store-product')
router.register(r'cash-till-sessions', views.CashTillSessionViewSet, basename='cashtillsession')
router.register(r'orders', views.OrderViewSet, basename='order')

urlpatterns = [
    # Auth
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.me_view, name='me'),

    # Users
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),

    # Stores
    path('stores/', views.StoreListCreateView.as_view(), name='store-list-create'),
    path('stores/<int:pk>/', views.StoreRetrieveUpdateDestroyView.as_view(), name='store-detail'),

    # Products
    path('products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', views.ProductRetrieveUpdateDestroyView.as_view(), name='product-detail'),

    # Sales
    path('sales/', views.SaleListCreateView.as_view(), name='sale-list-create'),
    path('sales/<int:pk>/', views.SaleRetrieveUpdateDestroyView.as_view(), name='sale-detail'),

    # Sellers
    path('sellers/', views.SellerListCreateView.as_view(), name='seller-list-create'),
    path('sellers/<int:pk>/', views.SellerRetrieveUpdateDestroyView.as_view(), name='seller-detail'),

    # Reports
    path('reports/sales/', views.SalesReportView.as_view(), name='sales-report'),
    path('reports/products/', views.ProductsReportView.as_view(), name='products-report'),
    path('reports/dashboard-stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Include router URLs
    path('', include(router.urls)),
] 