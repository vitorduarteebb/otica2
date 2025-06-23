from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('gerente', 'Gerente'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='gerente')
    store = models.ForeignKey('Store', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'

    def __str__(self):
        return self.get_full_name() or self.username


class Store(models.Model):
    name = models.CharField('Nome', max_length=200)
    address = models.TextField('Endereço')
    phone = models.CharField('Telefone', max_length=20, blank=True)
    email = models.EmailField('Email', blank=True)
    manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='managed_stores',
        verbose_name='Gerente'
    )
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Loja'
        verbose_name_plural = 'Lojas'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    CATEGORY_CHOICES = (
        ('lentes', 'Lentes'),
        ('armacoes', 'Armações'),
    )
    name = models.CharField('Nome', max_length=100)
    description = models.TextField('Descrição')
    price = models.DecimalField('Preço', max_digits=10, decimal_places=2)
    cost = models.DecimalField('Preço de Custo', max_digits=10, decimal_places=2)
    category = models.CharField('Categoria', max_length=10, choices=CATEGORY_CHOICES)
    image = models.ImageField(upload_to='products/', null=True, blank=True, verbose_name='Foto')
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Produto'
        verbose_name_plural = 'Produtos'
        ordering = ['name']

    def __str__(self):
        return self.name


class StoreProduct(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='store_products', verbose_name='Loja')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='store_products', verbose_name='Produto')
    quantity = models.IntegerField('Quantidade em Estoque', default=0)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Produto da Loja'
        verbose_name_plural = 'Produtos das Lojas'
        unique_together = ['store', 'product']
        ordering = ['product__name']

    def __str__(self):
        return f"{self.product.name} - {self.store.name} ({self.quantity})"


class Seller(models.Model):
    name = models.CharField(max_length=200, verbose_name='Nome')
    email = models.EmailField(verbose_name='E-mail', blank=True)
    phone = models.CharField(max_length=20, verbose_name='Telefone', blank=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='sellers', verbose_name='Loja')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')
    
    class Meta:
        verbose_name = 'Vendedor'
        verbose_name_plural = 'Vendedores'
    
    def __str__(self):
        return f"{self.name} - {self.store.name}"


class CashTillSession(models.Model):
    STATUS_CHOICES = (
        ('aberto', 'Aberto'),
        ('fechado', 'Fechado'),
    )

    store = models.ForeignKey(Store, on_delete=models.PROTECT, related_name='cash_till_sessions', verbose_name='Loja')
    opened_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='opened_sessions', verbose_name='Aberto por')
    closed_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='closed_sessions', null=True, blank=True, verbose_name='Fechado por')
    
    opened_at = models.DateTimeField('Data de Abertura', auto_now_add=True)
    closed_at = models.DateTimeField('Data de Fechamento', null=True, blank=True)
    
    initial_amount = models.DecimalField('Valor Inicial', max_digits=10, decimal_places=2)
    final_amount_reported = models.DecimalField('Valor Final Informado', max_digits=10, decimal_places=2, null=True, blank=True)
    final_amount_calculated = models.DecimalField('Valor Final Calculado', max_digits=10, decimal_places=2, null=True, blank=True)
    difference = models.DecimalField('Diferença', max_digits=10, decimal_places=2, null=True, blank=True)
    
    status = models.CharField('Status', max_length=10, choices=STATUS_CHOICES, default='aberto')
    notes = models.TextField('Observações', blank=True, null=True)

    class Meta:
        verbose_name = 'Sessão de Caixa'
        verbose_name_plural = 'Sessões de Caixa'
        ordering = ['-opened_at']

    def __str__(self):
        return f"Caixa de {self.store.name} - {self.opened_at.strftime('%d/%m/%Y %H:%M')}"


class Sale(models.Model):
    PAYMENT_CHOICES = (
        ('dinheiro', 'Dinheiro'),
        ('cartao_credito', 'Cartão de Crédito'),
        ('cartao_debito', 'Cartão de Débito'),
        ('pix', 'PIX'),
    )
    cash_till_session = models.ForeignKey(
        CashTillSession, 
        on_delete=models.PROTECT, 
        related_name='sales', 
        verbose_name='Sessão de Caixa',
        null=True,
        blank=True
    )
    customer_name = models.CharField('Nome do Cliente', max_length=100)
    customer_email = models.EmailField('Email do Cliente')
    customer_phone = models.CharField('Telefone do Cliente', max_length=20)
    seller = models.ForeignKey(
        Seller,
        on_delete=models.PROTECT,
        related_name='sales',
        verbose_name='Vendedor'
    )
    total_amount = models.DecimalField('Total', max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(
        'Forma de Pagamento',
        max_length=15,
        choices=PAYMENT_CHOICES,
        default='dinheiro'
    )
    sale_date = models.DateTimeField('Data da Venda', auto_now_add=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='sales', verbose_name='Loja')
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Venda'
        verbose_name_plural = 'Vendas'
        ordering = ['-sale_date']

    def __str__(self):
        return f'Venda {self.id} - {self.customer_name}'


class SaleItem(models.Model):
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Venda'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='sale_items',
        verbose_name='Produto'
    )
    quantity = models.IntegerField('Quantidade')
    unit_price = models.DecimalField('Preço Unitário', max_digits=10, decimal_places=2)
    total_price = models.DecimalField('Preço Total', max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name = 'Item da Venda'
        verbose_name_plural = 'Itens da Venda'

    def __str__(self):
        return f'{self.quantity}x {self.product.name}'


class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements', verbose_name='Produto')
    quantity = models.IntegerField(validators=[MinValueValidator(1)], verbose_name='Quantidade')
    movement_type = models.CharField(max_length=10, choices=MOVEMENT_TYPES, verbose_name='Tipo de Movimentação')
    reason = models.CharField(max_length=200, verbose_name='Motivo', blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Data da Movimentação')
    
    class Meta:
        verbose_name = 'Movimentação de Estoque'
        verbose_name_plural = 'Movimentações de Estoque'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.product.name} - {self.get_movement_type_display()} - {self.quantity}"


class CashFlow(models.Model):
    FLOW_TYPES = [
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='cash_flows', verbose_name='Loja')
    cash_till_session = models.ForeignKey(CashTillSession, on_delete=models.SET_NULL, null=True, blank=True, related_name='cash_flows', verbose_name='Sessão de Caixa')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name='Valor')
    flow_type = models.CharField(max_length=10, choices=FLOW_TYPES, verbose_name='Tipo')
    description = models.CharField(max_length=200, verbose_name='Descrição', blank=True)
    date = models.DateTimeField(auto_now_add=True, verbose_name='Data')
    
    class Meta:
        verbose_name = 'Fluxo de Caixa'
        verbose_name_plural = 'Fluxos de Caixa'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.store.name} - {self.get_flow_type_display()} - R$ {self.amount}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('realizando', 'Realizando'),
        ('pronto', 'Pronto'),
        ('entregue', 'Entregue'),
    ]

    customer_name = models.CharField(max_length=200, verbose_name="Nome do Cliente")
    customer_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone do Cliente")
    seller = models.ForeignKey(Seller, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Vendedor")
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='orders', verbose_name='Loja')

    # Medidas - Olho Direito
    sphere_right = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Esférico (OD)")
    cylinder_right = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Cilíndrico (OD)")
    axis_right = models.IntegerField(null=True, blank=True, verbose_name="Eixo (OD)")
    addition_right = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Adição (OD)")
    dnp_right = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="DNP (OD)")
    height_right = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Altura (OD)")

    # Medidas - Olho Esquerdo
    sphere_left = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Esférico (OE)")
    cylinder_left = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Cilíndrico (OE)")
    axis_left = models.IntegerField(null=True, blank=True, verbose_name="Eixo (OE)")
    addition_left = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Adição (OE)")
    dnp_left = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="DNP (OE)")
    height_left = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Altura (OE)")

    # Detalhes do Pedido
    lens_description = models.TextField(blank=True, verbose_name="Descrição das Lentes")
    frame_description = models.TextField(blank=True, verbose_name="Descrição da Armação")
    notes = models.TextField(blank=True, verbose_name="Observações")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço Total")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='realizando', verbose_name="Status")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ['-created_at']

    def __str__(self):
        return f"Pedido #{self.id} - {self.customer_name}" 