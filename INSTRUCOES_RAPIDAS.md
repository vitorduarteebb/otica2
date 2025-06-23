# 🚀 Instruções Rápidas - Sistema de Óticas

## Configuração Inicial

### 1. Backend Django
```bash
# Crie e ative ambiente virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instale dependências
pip install -r requirements.txt

# Configure banco de dados
python manage.py makemigrations
python manage.py migrate

# Crie usuários padrão
python manage.py setup_initial_data

# Inicie servidor Django
python manage.py runserver
```

### 2. Frontend React
```bash
# Em outro terminal
npm install
npm start
```

## 🔑 Acesso

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin

## 👤 Credenciais

- **Admin**: admin / admin123
- **Gerente**: gerente / gerente123

## 📁 Estrutura

```
otica1/
├── otica_backend/     # Django settings
├── otica_app/         # Django app principal
├── src/               # React frontend
├── manage.py          # Django management
├── requirements.txt   # Python dependencies
└── package.json       # Node.js dependencies
```

## 🛠️ Comandos Úteis

```bash
# Django
python manage.py runserver          # Inicia servidor
python manage.py shell              # Shell Django
python manage.py createsuperuser    # Criar admin
python manage.py setup_initial_data # Dados iniciais

# React
npm start                           # Desenvolvimento
npm run build                       # Produção
```

## 🔧 Desenvolvimento

- **Backend**: Django REST Framework + SQLite
- **Frontend**: React + Tailwind CSS
- **Autenticação**: JWT
- **Banco**: SQLite (automático)

## 📊 Funcionalidades

✅ **Concluído:**
- Autenticação JWT
- Modelos de banco completos
- API REST
- Dashboards (Admin/Gerente)
- Layout responsivo
- Admin Django

🚧 **Em desenvolvimento:**
- Gerenciamento de lojas/usuários
- Controle de estoque
- Sistema PDV
- Fluxo de caixa
- Relatórios detalhados 