from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from otica_app.models import User, Store, Product, StoreProduct


class Command(BaseCommand):
    help = 'Setup initial data for the optical store system'

    def handle(self, *args, **options):
        self.stdout.write('Setting up initial data...')

        # Create stores
        store1, created = Store.objects.get_or_create(
            name='Ótica Central',
            defaults={
                'address': 'Rua das Flores, 123 - Centro',
                'phone': '(11) 9999-9999',
                'email': 'central@otica.com'
            }
        )
        if created:
            self.stdout.write(f'Created store: {store1.name}')

        store2, created = Store.objects.get_or_create(
            name='Ótica Norte',
            defaults={
                'address': 'Av. Norte, 456 - Zona Norte',
                'phone': '(11) 8888-8888',
                'email': 'norte@otica.com'
            }
        )
        if created:
            self.stdout.write(f'Created store: {store2.name}')

        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@otica.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'password': make_password('admin123'),
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            self.stdout.write(f'Created admin user: {admin_user.username}')

        # Create store manager users
        manager1, created = User.objects.get_or_create(
            username='gerente1',
            defaults={
                'email': 'gerente1@otica.com',
                'first_name': 'João',
                'last_name': 'Silva',
                'role': 'gerente',
                'password': make_password('gerente123'),
                'store': store1
            }
        )
        if created:
            self.stdout.write(f'Created manager: {manager1.username}')

        manager2, created = User.objects.get_or_create(
            username='gerente2',
            defaults={
                'email': 'gerente2@otica.com',
                'first_name': 'Maria',
                'last_name': 'Santos',
                'role': 'gerente',
                'password': make_password('gerente123'),
                'store': store2
            }
        )
        if created:
            self.stdout.write(f'Created manager: {manager2.username}')

        # Create products
        products_data = [
            {
                'name': 'Lente Progressiva Essilor',
                'description': 'Lente progressiva de alta qualidade',
                'price': 800.00,
                'cost': 400.00,
                'category': 'lentes'
            },
            {
                'name': 'Lente Monofocal Anti-reflexo',
                'description': 'Lente monofocal com tratamento anti-reflexo',
                'price': 300.00,
                'cost': 150.00,
                'category': 'lentes'
            },
            {
                'name': 'Armação Ray-Ban Aviador',
                'description': 'Armação clássica aviador',
                'price': 500.00,
                'cost': 250.00,
                'category': 'armacoes'
            },
            {
                'name': 'Armação Oakley Sport',
                'description': 'Armação esportiva resistente',
                'price': 400.00,
                'cost': 200.00,
                'category': 'armacoes'
            }
        ]

        for product_data in products_data:
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                defaults=product_data
            )
            if created:
                self.stdout.write(f'Created product: {product.name}')

            # Create StoreProduct entries for each store
            for store in [store1, store2]:
                store_product, created = StoreProduct.objects.get_or_create(
                    store=store,
                    product=product,
                    defaults={'quantity': 10}  # Initial stock of 10 for each store
                )
                if created:
                    self.stdout.write(f'Created store product: {product.name} for {store.name}')

        self.stdout.write(self.style.SUCCESS('Initial data setup completed successfully!')) 