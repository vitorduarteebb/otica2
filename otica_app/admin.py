from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Store, Product, StoreProduct, Seller, Sale, SaleItem, StockMovement, CashFlow, Category, Cliente, Fornecedor, Funcionario, ContaPagar, ContaReceber, FolhaPagamento, RelatorioFinanceiro

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

# Admin para Gestão Financeira
@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cnpj', 'cpf', 'email', 'telefone', 'cidade', 'estado', 'ativo')
    list_filter = ('ativo', 'estado', 'cidade')
    search_fields = ('nome', 'cnpj', 'cpf', 'email')
    ordering = ('nome',)

@admin.register(Funcionario)
class FuncionarioAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cargo', 'store', 'data_admissao', 'salario_base', 'comissao_percentual', 'ativo')
    list_filter = ('cargo', 'store', 'ativo', 'data_admissao')
    search_fields = ('nome', 'cpf', 'email')
    ordering = ('nome',)
    date_hierarchy = 'data_admissao'

@admin.register(ContaPagar)
class ContaPagarAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'tipo', 'fornecedor', 'funcionario', 'valor', 'data_vencimento', 'status', 'store')
    list_filter = ('tipo', 'status', 'store', 'data_vencimento')
    search_fields = ('descricao', 'fornecedor__nome', 'funcionario__nome')
    ordering = ('data_vencimento',)
    date_hierarchy = 'data_vencimento'
    readonly_fields = ('valor_restante', 'dias_vencimento')

@admin.register(ContaReceber)
class ContaReceberAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'tipo', 'cliente', 'valor', 'data_vencimento', 'status', 'store')
    list_filter = ('tipo', 'status', 'store', 'data_vencimento')
    search_fields = ('descricao', 'cliente__nome')
    ordering = ('data_vencimento',)
    date_hierarchy = 'data_vencimento'
    readonly_fields = ('valor_restante', 'dias_vencimento')

@admin.register(FolhaPagamento)
class FolhaPagamentoAdmin(admin.ModelAdmin):
    list_display = ('funcionario', 'ano', 'mes', 'salario_base', 'comissao', 'bonus', 'descontos', 'salario_liquido', 'pago')
    list_filter = ('ano', 'mes', 'pago', 'funcionario__store')
    search_fields = ('funcionario__nome',)
    ordering = ('-ano', '-mes')
    readonly_fields = ('salario_liquido',)

@admin.register(RelatorioFinanceiro)
class RelatorioFinanceiroAdmin(admin.ModelAdmin):
    list_display = ('store', 'tipo', 'data_inicio', 'data_fim', 'receita_total', 'despesa_total', 'lucro_bruto', 'margem_lucro')
    list_filter = ('tipo', 'store', 'data_inicio', 'data_fim')
    search_fields = ('store__name',)
    ordering = ('-data_fim',)
    readonly_fields = ('receita_total', 'despesa_total', 'lucro_bruto', 'margem_lucro')

admin.site.register(User, CustomUserAdmin)
admin.site.register(Store, StoreAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(Sale, SaleAdmin)
admin.site.register(SaleItem)
admin.site.register(StockMovement)
admin.site.register(CashFlow)
admin.site.register(Category, CategoryAdmin) 