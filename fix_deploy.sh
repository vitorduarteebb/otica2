#!/bin/bash

echo "🔧 Corrigindo deploy na VPS..."

cd /opt/otica

# Atualizar requirements.txt
cat > requirements.txt << 'EOF'
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
djangorestframework-simplejwt==5.3.0
python-decouple==3.8
Pillow==10.4.0
psycopg2-binary==2.9.9
gunicorn==21.2.0
EOF

# Ativar ambiente virtual e instalar dependências
source venv/bin/activate
pip install --timeout 300 -r requirements.txt

# Continuar deploy
python manage.py migrate
python manage.py collectstatic --noinput

# Build do React
npm install
npm run build

# Reiniciar serviços
systemctl restart otica-gunicorn
systemctl reload nginx

echo "✅ Deploy corrigido! Acesse: http://oticahospitaldosoculos.com.br/otica2/" 