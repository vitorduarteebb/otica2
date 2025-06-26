#!/bin/bash

# Script de Deploy Completo para Sistema Ótica - VPS
# Executar como root na VPS: bash deploy_vps.sh

set -e  # Para o script se houver erro

echo "🚀 Iniciando deploy do Sistema Ótica na VPS..."
echo "================================================"

# Variáveis de configuração
DOMAIN="oticahospitaldosoculos.com.br"  # Domínio da ótica
PROJECT_DIR="/opt/otica"
BACKEND_PORT="8001"
DB_NAME="otica_db"
DB_USER="otica_user"
DB_PASS="otica123456"  # ALTERE PARA UMA SENHA SEGURA

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root"
fi

log "Atualizando sistema..."
apt update && apt upgrade -y

log "Instalando dependências do sistema..."
apt install -y nginx python3 python3-pip python3-venv git curl wget unzip

log "Instalando dependências para Pillow..."
apt install -y libjpeg-dev libpng-dev libfreetype6-dev liblcms2-dev libopenjp2-7-dev libtiff5-dev libwebp-dev libharfbuzz-dev libfribidi-dev libxcb1-dev

log "Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib

log "Configurando PostgreSQL..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

log "Criando diretório do projeto..."
mkdir -p $PROJECT_DIR

log "Copiando projeto atual para diretório de produção..."
cp -r . $PROJECT_DIR/
cd $PROJECT_DIR

log "Configurando ambiente Python..."
python3 -m venv venv
source venv/bin/activate

log "Instalando dependências Python..."
pip install --upgrade pip
pip install --upgrade setuptools wheel
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

log "Reinstalando rest_framework_simplejwt para resolver compatibilidade..."
pip uninstall -y djangorestframework-simplejwt
pip install djangorestframework-simplejwt==5.3.0

log "Configurando variáveis de ambiente..."
cat > .env << EOF
DEBUG=False
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost/$DB_NAME
ALLOWED_HOSTS=$DOMAIN,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://$DOMAIN,http://$DOMAIN
USE_X_FORWARDED_HOST=True
FORCE_SCRIPT_NAME=/otica2
STATIC_URL=/otica2/static/
MEDIA_URL=/otica2/media/
EOF

log "Executando migrações..."
source venv/bin/activate
python manage.py migrate

log "Criando superusuário..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@otica.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell

log "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

log "Configurando Gunicorn..."
cat > /etc/systemd/system/otica-gunicorn.service << EOF
[Unit]
Description=Gunicorn daemon for Ótica Django
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$PROJECT_DIR/venv/bin"
ExecStart=$PROJECT_DIR/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:$BACKEND_PORT otica_backend.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
EOF

log "Instalando dependências Node.js..."
npm install

log "Configurando React para subpasta..."
# Criar arquivo .env para o React
cat > .env << EOF
PUBLIC_URL=/otica2
REACT_APP_API_URL=/otica2/api
EOF

log "Fazendo build do frontend..."
npm run build

log "Configurando Nginx..."
cat > /etc/nginx/sites-available/otica << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # API do Django
    location /otica2/api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin do Django
    location /otica2/admin/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Arquivos estáticos do Django
    location /otica2/static/ {
        alias $PROJECT_DIR/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Arquivos de mídia
    location /otica2/media/ {
        alias $PROJECT_DIR/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend React
    location /otica2/ {
        alias $PROJECT_DIR/build/;
        try_files $uri $uri/ /index.html;
    }
}
EOF

log "Habilitando site no Nginx..."
ln -sf /etc/nginx/sites-available/otica /etc/nginx/sites-enabled/otica

log "Removendo site default do Nginx..."
rm -f /etc/nginx/sites-enabled/default

log "Testando configuração do Nginx..."
nginx -t

log "Recarregando Nginx..."
systemctl reload nginx

log "Iniciando serviços..."
systemctl daemon-reload
systemctl enable otica-gunicorn
systemctl start otica-gunicorn

log "Configurando firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

log "Configurando backup automático..."
cat > /opt/backup_otica.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/otica"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Backup do banco de dados
sudo -u postgres pg_dump $DB_NAME > \$BACKUP_DIR/db_\$DATE.sql

# Backup dos arquivos
tar -czf \$BACKUP_DIR/files_\$DATE.tar.gz -C $PROJECT_DIR .

# Manter apenas os últimos 7 backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup_otica.sh

# Adicionar ao crontab para backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup_otica.sh") | crontab -

log "Criando script de manutenção..."
cat > /opt/manage_otica.sh << EOF
#!/bin/bash
case "\$1" in
    start)
        systemctl start otica-gunicorn
        systemctl reload nginx
        echo "Sistema Ótica iniciado"
        ;;
    stop)
        systemctl stop otica-gunicorn
        echo "Sistema Ótica parado"
        ;;
    restart)
        systemctl restart otica-gunicorn
        systemctl reload nginx
        echo "Sistema Ótica reiniciado"
        ;;
    status)
        systemctl status otica-gunicorn
        ;;
    logs)
        journalctl -u otica-gunicorn -f
        ;;
    backup)
        /opt/backup_otica.sh
        ;;
    update)
        cd $PROJECT_DIR
        git pull
        source venv/bin/activate
        pip install -r requirements.txt
        python manage.py migrate
        python manage.py collectstatic --noinput
        npm install
        npm run build
        systemctl restart otica-gunicorn
        echo "Sistema atualizado"
        ;;
    *)
        echo "Uso: \$0 {start|stop|restart|status|logs|backup|update}"
        exit 1
        ;;
esac
EOF

chmod +x /opt/manage_otica.sh

log "Configurando monitoramento básico..."
cat > /opt/monitor_otica.sh << EOF
#!/bin/bash
# Verificar se o serviço está rodando
if ! systemctl is-active --quiet otica-gunicorn; then
    echo "ALERTA: Serviço Ótica parado! Reiniciando..."
    systemctl restart otica-gunicorn
fi

# Verificar uso de disco
DISK_USAGE=\$(df / | tail -1 | awk '{print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 80 ]; then
    echo "ALERTA: Uso de disco alto: \$DISK_USAGE%"
fi

# Verificar uso de memória
MEM_USAGE=\$(free | grep Mem | awk '{printf("%.0f", \$3/\$2 * 100.0)}')
if [ \$MEM_USAGE -gt 80 ]; then
    echo "ALERTA: Uso de memória alto: \$MEM_USAGE%"
fi
EOF

chmod +x /opt/monitor_otica.sh

# Adicionar monitoramento ao crontab (a cada 5 minutos)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/monitor_otica.sh") | crontab -

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=================================="
echo ""
echo "📋 INFORMAÇÕES IMPORTANTES:"
echo "• URL do sistema: http://$DOMAIN/otica2/"
echo "• Admin Django: http://$DOMAIN/otica2/admin/"
echo "• Usuário admin: admin"
echo "• Senha admin: admin123"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "• Gerenciar sistema: /opt/manage_otica.sh {start|stop|restart|status|logs|backup|update}"
echo "• Ver logs: journalctl -u otica-gunicorn -f"
echo "• Backup manual: /opt/backup_otica.sh"
echo "• Monitoramento: /opt/monitor_otica.sh"
echo ""
echo "🔒 PRÓXIMOS PASSOS:"
echo "1. Acesse diretamente: http://$DOMAIN/otica2/"
echo "2. Teste o sistema e faça login"
echo "3. Altere as senhas padrão (admin e banco de dados)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "• Altere a senha do admin Django"
echo "• Altere a senha do banco de dados"
echo "• Configure backups para um local externo"
echo "• Monitore os logs regularmente"
echo ""

# Verificar status dos serviços
log "Verificando status dos serviços..."
systemctl status otica-gunicorn --no-pager -l
systemctl status nginx --no-pager -l

log "Deploy finalizado! Acesse http://$DOMAIN para verificar."

# 1. Desabilitar temporariamente o sistema Goklen
mv /etc/nginx/sites-enabled/goklen /etc/nginx/sites-enabled/goklen.disabled

# 2. Verificar se o arquivo otica2 está sendo incluído corretamente
cat /etc/nginx/sites-available/default | grep otica2

# 3. Recarregar o Nginx
systemctl reload nginx

# 4. Testar a API do sistema Ótica
curl -v http://82.29.57.111/otica2/api/

# 5. Testar uma rota específica
curl -v http://82.29.57.111/otica2/api/stores/ 