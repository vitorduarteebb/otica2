#!/usr/bin/env python
"""
Script para configurar dados de demonstração para apresentação na ótica.
Execute este script após fazer as migrações para criar dados de exemplo.
"""

import os
import sys
import django
from django.contrib.auth import get_user_model
from django.core.management import execute_from_command_line

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'otica_backend.settings')
django.setup()

from otica_app.models import Store, Product, Seller, Sale, CashTillSession, CashFlow, Category
from django.utils import timezone
from datetime import datetime, timedelta
import random

User = get_user_model()

def create_demo_data():
    print("🚀 Configurando dados de demonstração para apresentação...")
    
    # Criar usuário admin se não existir
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@otica.com',
            password='admin123',
            role='admin',
            first_name='Administrador',
            last_name='Sistema'
        )
        print("✅ Usuário admin criado: admin / admin123")
    
    # Criar usuário gerente se não existir
    if not User.objects.filter(username='gerente').exists():
        gerente_user = User.objects.create_user(
            username='gerente',
            email='gerente@otica.com',
            password='gerente123',
            role='gerente',
            first_name='João',
            last_name='Silva'
        )
        print("✅ Usuário gerente criado: gerente / gerente123")
    
    # Criar lojas de exemplo
    stores_data = [
        {'name': 'Ótica Central', 'email': 'central@otica.com', 'phone': '(11) 99999-9999'},
        {'name': 'Ótica Express', 'email': 'express@otica.com', 'phone': '(11) 88888-8888'},
    ]
    
    stores = []
    for store_data in stores_data:
        store, created = Store.objects.get_or_create(
            name=store_data['name'],
            defaults=store_data
        )
        stores.append(store)
        if created:
            print(f"✅ Loja criada: {store.name}")
    
    # Criar vendedores
    sellers_data = [
        {'name': 'Maria Santos', 'phone': '(11) 77777-7777', 'store': stores[0]},
        {'name': 'Pedro Costa', 'phone': '(11) 66666-6666', 'store': stores[0]},
        {'name': 'Ana Oliveira', 'phone': '(11) 55555-5555', 'store': stores[1]},
    ]
    
    sellers = []
    for seller_data in sellers_data:
        seller, created = Seller.objects.get_or_create(
            name=seller_data['name'],
            defaults=seller_data
        )
        sellers.append(seller)
        if created:
            print(f"✅ Vendedor criado: {seller.name}")
    
    # Criar categorias de exemplo
    categories_data = [
        {'name': 'Lentes', 'description': 'Lentes oftálmicas e de contato'},
        {'name': 'Armações', 'description': 'Armações de óculos'},
        {'name': 'Acessórios', 'description': 'Acessórios para óculos'},
        {'name': 'Lentes de Contato', 'description': 'Lentes de contato descartáveis e permanentes'},
    ]
    
    categories = []
    for category_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=category_data['name'],
            defaults=category_data
        )
        categories.append(category)
        if created:
            print(f"✅ Categoria criada: {category.name}")
    
    # Criar produtos de exemplo
    products_data = [
        {'name': 'Armação Ray-Ban Aviador', 'brand': 'Ray-Ban', 'model': 'RB3025', 'code': 'RB3025-001', 'category': categories[1], 'price': 450.00, 'stock': 15},
        {'name': 'Armação Oakley Sport', 'brand': 'Oakley', 'model': 'OX8046', 'code': 'OX8046-002', 'category': categories[1], 'price': 380.00, 'stock': 8},
        {'name': 'Lente Transitions', 'brand': 'Transitions', 'model': 'XTRActive', 'code': 'TRANS-XT-001', 'category': categories[0], 'price': 280.00, 'stock': 25},
        {'name': 'Lente Anti-Reflexo', 'brand': 'Essilor', 'model': 'Crizal', 'code': 'CRIZAL-001', 'category': categories[0], 'price': 150.00, 'stock': 30},
        {'name': 'Armação Gucci Premium', 'brand': 'Gucci', 'model': 'GG0060S', 'code': 'GUCCI-GG0060S', 'category': categories[1], 'price': 1200.00, 'stock': 3},
        {'name': 'Lente Progressiva', 'brand': 'Varilux', 'model': 'Comfort Max', 'code': 'VARILUX-CM', 'category': categories[0], 'price': 450.00, 'stock': 12},
        {'name': 'Frasco para Lentes', 'brand': 'Genérico', 'model': 'GL-001', 'code': 'FRASCO-001', 'category': categories[2], 'price': 15.00, 'stock': 50},
        {'name': 'Lente de Contato Mensal', 'brand': 'Acuvue', 'model': 'Oasys', 'code': 'ACUVUE-OASYS', 'category': categories[3], 'price': 120.00, 'stock': 100},
    ]
    
    products = []
    for product_data in products_data:
        # Extrair dados do produto
        stock = product_data.pop('stock', 0)
        
        product, created = Product.objects.get_or_create(
            name=product_data['name'],
            defaults=product_data
        )
        products.append(product)
        if created:
            print(f"✅ Produto criado: {product.name}")
            
            # Adicionar estoque para cada loja
            for store in stores:
                from otica_app.models import StoreProduct
                StoreProduct.objects.create(
                    store=store,
                    product=product,
                    quantity=stock
                )
    
    # Criar vendas de exemplo (últimos 30 dias)
    payment_methods = ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix']
    
    for i in range(20):  # Criar 20 vendas de exemplo
        # Data aleatória nos últimos 30 dias
        days_ago = random.randint(0, 30)
        sale_date = timezone.now() - timedelta(days=days_ago)
        
        # Selecionar produtos aleatórios
        num_products = random.randint(1, 3)
        selected_products = random.sample(products, num_products)
        
        # Calcular total
        total = sum(product.price for product in selected_products)
        
        # Criar venda
        sale = Sale.objects.create(
            date=sale_date,
            total=total,
            payment_method=random.choice(payment_methods),
            seller=random.choice(sellers),
            notes=f"Venda de demonstração #{i+1}"
        )
        
        # Adicionar produtos à venda
        for product in selected_products:
            sale.products.add(product)
        
        print(f"✅ Venda criada: R$ {total:.2f} - {sale.seller.name}")
    
    # Criar sessões de caixa
    for store in stores:
        session = CashTillSession.objects.create(
            store=store,
            start_time=timezone.now() - timedelta(hours=8),
            end_time=timezone.now(),
            initial_amount=1000.00,
            final_amount=random.uniform(1500, 3000),
            is_active=False
        )
        print(f"✅ Sessão de caixa criada para {store.name}")
    
    print("\n🎉 Dados de demonstração criados com sucesso!")
    print("\n📋 Credenciais de acesso:")
    print("   Admin: admin / admin123")
    print("   Gerente: gerente / gerente123")
    print("\n💡 Dicas para apresentação:")
    print("   - Use o usuário admin para acessar todas as funcionalidades")
    print("   - Use o usuário gerente para mostrar restrições de acesso")
    print("   - Demonstre o cadastro de produtos, vendas e relatórios")
    print("   - Mostre os filtros e busca de dados")
    print("   - Apresente o sistema de caixa e fluxo de caixa")

if __name__ == '__main__':
    try:
        create_demo_data()
    except Exception as e:
        print(f"❌ Erro ao criar dados de demonstração: {e}")
        sys.exit(1) 