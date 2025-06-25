from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Store, Product, StoreProduct, Seller, Sale, SaleItem, StockMovement, CashFlow, Category, Cliente

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'store')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'store')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informações Pessoais', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissões', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Datas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'store'),
        }),
    )
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'active', 'created_at')
    list_filter = ('active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)

class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1
    readonly_fields = ('unit_price', 'total_price')

class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'seller', 'total_amount', 'payment_method', 'sale_date')
    list_filter = ('payment_method', 'sale_date', 'seller')
    search_fields = ('customer_name', 'customer_email', 'customer_phone')
    readonly_fields = ('total_amount', 'sale_date')
    inlines = [SaleItemInline]
    date_hierarchy = 'sale_date'

class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'manager', 'phone', 'address', 'email')
    list_filter = ('manager',)
    search_fields = ('name', 'address', 'phone')

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'model', 'code', 'category', 'price', 'cost', 'image_tag')
    list_filter = ('category', 'brand')
    search_fields = ('name', 'brand', 'model', 'code', 'description')
    readonly_fields = ('image_tag',)
    
    def image_tag(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" style="height: 50px;" />'
        return '-'
    image_tag.short_description = 'Foto'
    image_tag.allow_tags = True

@admin.register(StoreProduct)
class StoreProductAdmin(admin.ModelAdmin):
    list_display = ['product', 'store', 'quantity']
    list_filter = ['store', 'product__category']
    search_fields = ['product__name', 'store__name']

@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'store']
    list_filter = ['store']
    search_fields = ['name', 'email']

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'email', 'telefone', 'cpf', 'grau_od', 'grau_oe', 'dnp_od', 'dnp_oe', 'adicao')
    search_fields = ('nome', 'email', 'cpf')

admin.site.register(User, CustomUserAdmin)
admin.site.register(Store, StoreAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(Sale, SaleAdmin)
admin.site.register(SaleItem)
admin.site.register(StockMovement)
admin.site.register(CashFlow)
admin.site.register(Category, CategoryAdmin) 