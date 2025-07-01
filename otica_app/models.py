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


class Category(models.Model):
    name = models.CharField('Nome', max_length=100, unique=True)
    description = models.TextField('Descrição', blank=True)
    active = models.BooleanField('Ativo', default=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField('Nome', max_length=100)
    brand = models.CharField('Marca', max_length=100, blank=True)
    model = models.CharField('Modelo', max_length=100, blank=True)
    code = models.CharField('Código', max_length=50, blank=True, unique=True, editable=False)
    description = models.TextField('Descrição')
    price = models.DecimalField('Preço', max_digits=10, decimal_places=2)
    cost = models.DecimalField('Preço de Custo', max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, verbose_name='Categoria')
    image = models.ImageField(upload_to='products/', null=True, blank=True, verbose_name='Foto')
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Produto'
        verbose_name_plural = 'Produtos'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.code:
            # Busca o maior código já existente (considerando formato 01, 02, 03...)
            last_product = Product.objects.order_by('-id').first()
            if last_product and last_product.code and last_product.code.isdigit():
                next_code = int(last_product.code) + 1
            else:
                next_code = 1
            self.code = f"{next_code:02d}"
        super().save(*args, **kwargs)


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
    cliente = models.ForeignKey('Cliente', on_delete=models.SET_NULL, null=True, blank=True, related_name='vendas', verbose_name='Cliente')
    
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


class Cliente(models.Model):
    SEXO_CHOICES = [
        ("M", "Masculino"),
        ("F", "Feminino"),
        ("O", "Outro"),
    ]
    nome = models.CharField('Nome', max_length=200)
    email = models.EmailField('E-mail', blank=True)
    telefone = models.CharField('Telefone', max_length=20, blank=True)
    cpf = models.CharField('CPF', max_length=14, blank=True, unique=True)
    data_nascimento = models.DateField('Data de Nascimento', null=True, blank=True)
    sexo = models.CharField('Sexo', max_length=1, choices=SEXO_CHOICES, blank=True)
    endereco = models.CharField('Endereço', max_length=255, blank=True)
    numero = models.CharField('Número', max_length=10, blank=True)
    bairro = models.CharField('Bairro', max_length=100, blank=True)
    cidade = models.CharField('Cidade', max_length=100, blank=True)
    estado = models.CharField('Estado', max_length=2, blank=True)
    cep = models.CharField('CEP', max_length=10, blank=True)
    observacoes = models.TextField('Observações', blank=True)
    grau_od = models.CharField('Grau OD', max_length=50, blank=True, null=True)
    grau_oe = models.CharField('Grau OE', max_length=50, blank=True, null=True)
    dnp_od = models.CharField('DNP OD', max_length=20, blank=True, null=True)
    dnp_oe = models.CharField('DNP OE', max_length=20, blank=True, null=True)
    adicao = models.CharField('Adição', max_length=20, blank=True, null=True)
    observacoes_opticas = models.TextField('Observações Ópticas', blank=True, null=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['nome']

    def __str__(self):
        return f"{self.nome} ({self.cpf})" if self.cpf else self.nome


class Fornecedor(models.Model):
    """Modelo para cadastro de fornecedores"""
    nome = models.CharField('Nome/Razão Social', max_length=200)
    cnpj = models.CharField('CNPJ', max_length=18, blank=True)
    cpf = models.CharField('CPF', max_length=14, blank=True)
    email = models.EmailField('E-mail', blank=True)
    telefone = models.CharField('Telefone', max_length=20, blank=True)
    endereco = models.CharField('Endereço', max_length=255, blank=True)
    cidade = models.CharField('Cidade', max_length=100, blank=True)
    estado = models.CharField('Estado', max_length=2, blank=True)
    cep = models.CharField('CEP', max_length=10, blank=True)
    observacoes = models.TextField('Observações', blank=True)
    ativo = models.BooleanField('Ativo', default=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Fornecedor'
        verbose_name_plural = 'Fornecedores'
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class Funcionario(models.Model):
    """Modelo para cadastro de funcionários"""
    CARGO_CHOICES = [
        ('vendedor', 'Vendedor'),
        ('gerente', 'Gerente'),
        ('optico', 'Óptico'),
        ('auxiliar', 'Auxiliar'),
        ('administrativo', 'Administrativo'),
        ('limpeza', 'Limpeza'),
        ('seguranca', 'Segurança'),
        ('outro', 'Outro'),
    ]
    
    nome = models.CharField('Nome Completo', max_length=200)
    cpf = models.CharField('CPF', max_length=14, unique=True)
    rg = models.CharField('RG', max_length=20, blank=True)
    data_nascimento = models.DateField('Data de Nascimento', null=True, blank=True)
    email = models.EmailField('E-mail', blank=True)
    telefone = models.CharField('Telefone', max_length=20, blank=True)
    endereco = models.CharField('Endereço', max_length=255, blank=True)
    cidade = models.CharField('Cidade', max_length=100, blank=True)
    estado = models.CharField('Estado', max_length=2, blank=True)
    cep = models.CharField('CEP', max_length=10, blank=True)
    
    cargo = models.CharField('Cargo', max_length=20, choices=CARGO_CHOICES)
    data_admissao = models.DateField('Data de Admissão')
    data_demissao = models.DateField('Data de Demissão', null=True, blank=True)
    salario_base = models.DecimalField('Salário Base', max_digits=10, decimal_places=2)
    comissao_percentual = models.DecimalField('Comissão (%)', max_digits=5, decimal_places=2, default=0)
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='funcionarios', verbose_name='Loja')
    ativo = models.BooleanField('Ativo', default=True)
    observacoes = models.TextField('Observações', blank=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Funcionário'
        verbose_name_plural = 'Funcionários'
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} - {self.get_cargo_display()}"


class ContaPagar(models.Model):
    """Modelo para contas a pagar"""
    TIPO_CHOICES = [
        ('fornecedor', 'Fornecedor'),
        ('funcionario', 'Funcionário'),
        ('imposto', 'Imposto'),
        ('servico', 'Serviço'),
        ('aluguel', 'Aluguel'),
        ('energia', 'Energia'),
        ('agua', 'Água'),
        ('internet', 'Internet'),
        ('telefone', 'Telefone'),
        ('manutencao', 'Manutenção'),
        ('marketing', 'Marketing'),
        ('outro', 'Outro'),
    ]
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('pago', 'Pago'),
        ('vencido', 'Vencido'),
        ('cancelado', 'Cancelado'),
    ]
    
    descricao = models.CharField('Descrição', max_length=200)
    tipo = models.CharField('Tipo', max_length=20, choices=TIPO_CHOICES)
    fornecedor = models.ForeignKey(Fornecedor, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Fornecedor')
    funcionario = models.ForeignKey(Funcionario, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Funcionário')
    
    valor = models.DecimalField('Valor', max_digits=10, decimal_places=2)
    valor_pago = models.DecimalField('Valor Pago', max_digits=10, decimal_places=2, default=0)
    data_vencimento = models.DateField('Data de Vencimento')
    data_pagamento = models.DateField('Data de Pagamento', null=True, blank=True)
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='contas_pagar', verbose_name='Loja')
    status = models.CharField('Status', max_length=20, choices=STATUS_CHOICES, default='pendente')
    observacoes = models.TextField('Observações', blank=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Conta a Pagar'
        verbose_name_plural = 'Contas a Pagar'
        ordering = ['data_vencimento']
    
    def __str__(self):
        return f"{self.descricao} - R$ {self.valor} (Venc: {self.data_vencimento})"
    
    @property
    def valor_restante(self):
        return self.valor - self.valor_pago
    
    @property
    def dias_vencimento(self):
        from django.utils import timezone
        hoje = timezone.now().date()
        return (self.data_vencimento - hoje).days


class ContaReceber(models.Model):
    """Modelo para contas a receber"""
    TIPO_CHOICES = [
        ('venda', 'Venda'),
        ('servico', 'Serviço'),
        ('comissao', 'Comissão'),
        ('outro', 'Outro'),
    ]
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('recebido', 'Recebido'),
        ('vencido', 'Vencido'),
        ('cancelado', 'Cancelado'),
    ]
    
    descricao = models.CharField('Descrição', max_length=200)
    tipo = models.CharField('Tipo', max_length=20, choices=TIPO_CHOICES)
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Cliente')
    venda = models.ForeignKey(Sale, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Venda')
    
    valor = models.DecimalField('Valor', max_digits=10, decimal_places=2)
    valor_recebido = models.DecimalField('Valor Recebido', max_digits=10, decimal_places=2, default=0)
    data_vencimento = models.DateField('Data de Vencimento')
    data_recebimento = models.DateField('Data de Recebimento', null=True, blank=True)
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='contas_receber', verbose_name='Loja')
    status = models.CharField('Status', max_length=20, choices=STATUS_CHOICES, default='pendente')
    observacoes = models.TextField('Observações', blank=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Conta a Receber'
        verbose_name_plural = 'Contas a Receber'
        ordering = ['data_vencimento']
    
    def __str__(self):
        return f"{self.descricao} - R$ {self.valor} (Venc: {self.data_vencimento})"
    
    @property
    def valor_restante(self):
        return self.valor - self.valor_recebido
    
    @property
    def dias_vencimento(self):
        from django.utils import timezone
        hoje = timezone.now().date()
        return (self.data_vencimento - hoje).days


class FolhaPagamento(models.Model):
    """Modelo para folha de pagamento"""
    MES_CHOICES = [
        (1, 'Janeiro'), (2, 'Fevereiro'), (3, 'Março'), (4, 'Abril'),
        (5, 'Maio'), (6, 'Junho'), (7, 'Julho'), (8, 'Agosto'),
        (9, 'Setembro'), (10, 'Outubro'), (11, 'Novembro'), (12, 'Dezembro'),
    ]
    
    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='folhas_pagamento', verbose_name='Funcionário')
    ano = models.IntegerField('Ano')
    mes = models.IntegerField('Mês', choices=MES_CHOICES)
    
    salario_base = models.DecimalField('Salário Base', max_digits=10, decimal_places=2)
    comissao = models.DecimalField('Comissão', max_digits=10, decimal_places=2, default=0)
    bonus = models.DecimalField('Bônus', max_digits=10, decimal_places=2, default=0)
    descontos = models.DecimalField('Descontos', max_digits=10, decimal_places=2, default=0)
    salario_liquido = models.DecimalField('Salário Líquido', max_digits=10, decimal_places=2)
    
    data_pagamento = models.DateField('Data de Pagamento', null=True, blank=True)
    pago = models.BooleanField('Pago', default=False)
    observacoes = models.TextField('Observações', blank=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Folha de Pagamento'
        verbose_name_plural = 'Folhas de Pagamento'
        unique_together = ['funcionario', 'ano', 'mes']
        ordering = ['-ano', '-mes']
    
    def __str__(self):
        return f"{self.funcionario.nome} - {self.get_mes_display()}/{self.ano}"
    
    def save(self, *args, **kwargs):
        # Calcula o salário líquido automaticamente
        self.salario_liquido = self.salario_base + self.comissao + self.bonus - self.descontos
        super().save(*args, **kwargs)


class RelatorioFinanceiro(models.Model):
    """Modelo para relatórios financeiros"""
    TIPO_CHOICES = [
        ('diario', 'Diário'),
        ('semanal', 'Semanal'),
        ('mensal', 'Mensal'),
        ('trimestral', 'Trimestral'),
        ('anual', 'Anual'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='relatorios_financeiros', verbose_name='Loja')
    tipo = models.CharField('Tipo', max_length=20, choices=TIPO_CHOICES)
    data_inicio = models.DateField('Data de Início')
    data_fim = models.DateField('Data de Fim')
    
    # Receitas
    receita_vendas = models.DecimalField('Receita de Vendas', max_digits=12, decimal_places=2, default=0)
    receita_servicos = models.DecimalField('Receita de Serviços', max_digits=12, decimal_places=2, default=0)
    receita_outras = models.DecimalField('Outras Receitas', max_digits=12, decimal_places=2, default=0)
    receita_total = models.DecimalField('Receita Total', max_digits=12, decimal_places=2, default=0)
    
    # Despesas
    despesa_fornecedores = models.DecimalField('Despesa com Fornecedores', max_digits=12, decimal_places=2, default=0)
    despesa_funcionarios = models.DecimalField('Despesa com Funcionários', max_digits=12, decimal_places=2, default=0)
    despesa_impostos = models.DecimalField('Despesa com Impostos', max_digits=12, decimal_places=2, default=0)
    despesa_servicos = models.DecimalField('Despesa com Serviços', max_digits=12, decimal_places=2, default=0)
    despesa_outras = models.DecimalField('Outras Despesas', max_digits=12, decimal_places=2, default=0)
    despesa_total = models.DecimalField('Despesa Total', max_digits=12, decimal_places=2, default=0)
    
    # Resultado
    lucro_bruto = models.DecimalField('Lucro Bruto', max_digits=12, decimal_places=2, default=0)
    margem_lucro = models.DecimalField('Margem de Lucro (%)', max_digits=5, decimal_places=2, default=0)
    
    observacoes = models.TextField('Observações', blank=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Relatório Financeiro'
        verbose_name_plural = 'Relatórios Financeiros'
        ordering = ['-data_fim']
    
    def __str__(self):
        return f"Relatório {self.get_tipo_display()} - {self.store.name} ({self.data_inicio} a {self.data_fim})"
    
    def save(self, *args, **kwargs):
        # Calcula valores automaticamente
        self.receita_total = self.receita_vendas + self.receita_servicos + self.receita_outras
        self.despesa_total = self.despesa_fornecedores + self.despesa_funcionarios + self.despesa_impostos + self.despesa_servicos + self.despesa_outras
        self.lucro_bruto = self.receita_total - self.despesa_total
        
        if self.receita_total > 0:
            self.margem_lucro = (self.lucro_bruto / self.receita_total) * 100
        else:
            self.margem_lucro = 0
            
        super().save(*args, **kwargs) 