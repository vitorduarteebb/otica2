#!/bin/bash

echo "========================================"
echo "    CONFIGURACAO DO BANCO DE DADOS"
echo "========================================"
echo

# Verificar se o PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não está instalado"
    echo "Execute: sudo apt update && sudo apt install postgresql postgresql-contrib"
    exit 1
fi

echo "✅ PostgreSQL encontrado"
echo

# Verificar se o psycopg2 está instalado
if ! python -c "import psycopg2" &> /dev/null; then
    echo "❌ psycopg2 não está instalado"
    echo "Execute: pip install psycopg2-binary"
    exit 1
fi

echo "✅ psycopg2 encontrado"
echo

# Criar usuário e banco de dados
echo "Criando usuário e banco de dados..."
sudo -u postgres psql << EOF
CREATE USER otica_user WITH PASSWORD 'otica_password_2024';
CREATE DATABASE otica_db OWNER otica_user;
GRANT ALL PRIVILEGES ON DATABASE otica_db TO otica_user;
\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Usuário e banco de dados criados"
else
    echo "❌ Erro ao criar usuário e banco de dados"
    exit 1
fi

echo

# Criar diretórios necessários
echo "Criando diretórios..."
sudo mkdir -p /opt/otica/logs
sudo mkdir -p /opt/otica/staticfiles
sudo mkdir -p /opt/otica/media

sudo chown -R www-data:www-data /opt/otica/logs
sudo chown -R www-data:www-data /opt/otica/staticfiles
sudo chown -R www-data:www-data /opt/otica/media

sudo chmod -R 755 /opt/otica/logs
sudo chmod -R 755 /opt/otica/staticfiles
sudo chmod -R 755 /opt/otica/media

echo "✅ Diretórios criados"
echo

# Aplicar migrações
echo "Aplicando migrações..."
cd /opt/otica
source venv/bin/activate

python manage.py migrate --settings=otica_backend.settings_production

if [ $? -eq 0 ]; then
    echo "✅ Migrações aplicadas"
else
    echo "❌ Erro ao aplicar migrações"
    exit 1
fi

echo

# Coletar arquivos estáticos
echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput --settings=otica_backend.settings_production

if [ $? -eq 0 ]; then
    echo "✅ Arquivos estáticos coletados"
else
    echo "❌ Erro ao coletar arquivos estáticos"
    exit 1
fi

echo

# Criar superusuário
echo "Criando superusuário..."
echo "Digite as informações do superusuário:"
python manage.py createsuperuser --settings=otica_backend.settings_production

if [ $? -eq 0 ]; then
    echo "✅ Superusuário criado"
else
    echo "❌ Erro ao criar superusuário"
fi

echo

# Reiniciar serviços
echo "Reiniciando serviços..."
sudo systemctl restart gunicorn
sudo systemctl restart nginx

echo "✅ Serviços reiniciados"
echo

echo "========================================"
echo "    CONFIGURACAO CONCLUIDA!"
echo "========================================"
echo
echo "Teste o sistema em:"
echo "http://oticahospitaldosoculos.com.br/otica2/"
echo
echo "Admin Django:"
echo "http://oticahospitaldosoculos.com.br/otica2/admin/"
echo
echo "API:"
echo "http://oticahospitaldosoculos.com.br/otica2/api/"
echo 