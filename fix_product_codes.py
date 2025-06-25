import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'otica_backend.settings')
django.setup()

from otica_app.models import Product

def fix_product_codes():
    products = Product.objects.all().order_by('id')
    for idx, product in enumerate(products, start=1):
        new_code = f"{idx:02d}"
        if product.code != new_code:
            product.code = new_code
            product.save()
            print(f"Produto {product.name} atualizado para código {new_code}")
    print("Todos os produtos agora possuem códigos únicos e sequenciais.")

if __name__ == '__main__':
    fix_product_codes() 