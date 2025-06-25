# Sistema de Gestão de Ótica

Sistema completo de gestão para óticas, desenvolvido com Django (Backend) e React (Frontend).

## 🚀 Funcionalidades

- **Gestão de Produtos**: Cadastro, edição e controle de estoque
- **Gestão de Categorias**: Sistema dinâmico de categorias de produtos
- **Gestão de Vendas**: Registro de vendas com múltiplos produtos
- **Gestão de Vendedores**: Cadastro e controle de vendedores por loja
- **Gestão de Lojas**: Suporte a múltiplas filiais
- **Sistema de Caixa**: Controle de sessões de caixa e fluxo de caixa
- **Relatórios**: Relatórios de vendas, produtos e financeiro
- **Controle de Acesso**: Diferentes níveis de usuário (Admin/Gerente)
- **Filtros Avançados**: Busca e filtros por data, categoria, pagamento, etc.

## 🛠️ Tecnologias

- **Backend**: Django 4.x, Django REST Framework, SQLite
- **Frontend**: React 18, Tailwind CSS, React Router
- **Autenticação**: JWT (JSON Web Tokens)
- **Banco de Dados**: SQLite (desenvolvimento)

## 📋 Pré-requisitos

- Python 3.8+
- Node.js 16+
- npm ou yarn

## 🚀 Instalação Rápida (Windows)

### Opção 1: Instalação Automática
1. Execute o arquivo `install.bat` clicando duas vezes
2. Aguarde a instalação automática
3. Execute `start_system.bat` para iniciar o sistema

### Opção 2: Instalação Manual

#### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd otica1
```

#### 2. Configurar Backend (Django)
```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Fazer migrações
python manage.py makemigrations
python manage.py migrate

# Criar dados de demonstração
python setup_demo.py
```

#### 3. Configurar Frontend (React)
```bash
# Instalar dependências
npm install
```

#### 4. Iniciar o Sistema
```bash
# Terminal 1 - Backend
venv\Scripts\activate
python manage.py runserver

# Terminal 2 - Frontend
npm start
```

## 🔐 Credenciais de Acesso

### Usuário Administrador
- **Usuário**: `admin`
- **Senha**: `admin123`
- **Permissões**: Acesso total ao sistema

### Usuário Gerente
- **Usuário**: `gerente`
- **Senha**: `gerente123`
- **Permissões**: Acesso limitado (sem gestão de usuários)

## 📊 Dados de Demonstração

O sistema vem com dados de exemplo para demonstração:

- **2 Categorias**: Lentes e Armações
- **2 Lojas**: Ótica Central e Ótica Express
- **3 Vendedores**: Maria Santos, Pedro Costa, Ana Oliveira
- **9 Produtos**: Armações e lentes variadas com categorias dinâmicas
- **20 Vendas**: Vendas dos últimos 30 dias
- **Sessões de Caixa**: Dados de fluxo de caixa

## 🎯 Guia de Apresentação

### 1. Login e Navegação
- Demonstre login com usuário admin
- Mostre o dashboard com estatísticas
- Navegue pelo menu lateral

### 2. Gestão de Categorias (NOVO!)
- Acesse "Categorias" no menu admin
- Cadastre uma nova categoria
- Edite categorias existentes
- Mostre como as categorias são usadas nos produtos

### 3. Gestão de Produtos
- Cadastre um novo produto com categoria dinâmica
- Mostre filtros por categoria e estoque
- Edite um produto existente
- Demonstre a relação produto-categoria

### 4. Gestão de Vendas
- Registre uma nova venda
- Selecione produtos e vendedor
- Mostre histórico de vendas

### 5. Gestão de Vendedores
- Cadastre um novo vendedor
- Associe a uma loja
- Mostre lista de vendedores

### 6. Relatórios
- Demonstre relatórios de vendas
- Mostre filtros por data e categoria
- Apresente gráficos e estatísticas

### 7. Sistema de Caixa
- Mostre sessões de caixa
- Demonstre fluxo de caixa
- Apresente controle financeiro

### 8. Controle de Acesso
- Faça logout e login como gerente
- Mostre restrições de acesso
- Demonstre diferenças de permissões

## 🔧 Configuração para Produção

### 1. Configurações de Segurança
- Altere a `SECRET_KEY` em `settings.py`
- Configure `ALLOWED_HOSTS` para seu domínio
- Ative `DEBUG = False`

### 2. Banco de Dados
- Configure PostgreSQL ou MySQL para produção
- Execute `python manage.py collectstatic`

### 3. Variáveis de Ambiente
```bash
export DJANGO_SECRET_KEY="sua-chave-secreta"
export DJANGO_SETTINGS_MODULE="otica_backend.settings_production"
```

## 📁 Estrutura do Projeto

```
otica1/
├── otica_backend/          # Configurações Django
├── otica_app/             # Aplicação principal Django
│   ├── models.py          # Modelos (Product, Category, etc.)
│   ├── views.py           # Views da API
│   ├── serializers.py     # Serializers para API
│   └── migrations/        # Migrações do banco
├── src/                   # Frontend React
│   ├── components/        # Componentes reutilizáveis
│   ├── pages/            # Páginas da aplicação
│   │   ├── admin/        # Páginas administrativas
│   │   └── gerente/      # Páginas do gerente
│   ├── contexts/         # Contextos React
│   └── services/         # Serviços de API
├── media/                # Arquivos de mídia
├── requirements.txt      # Dependências Python
├── package.json          # Dependências Node.js
└── README.md            # Este arquivo
```

## 🆕 Novidades na Versão Atual

### Sistema de Categorias Dinâmicas
- **Categorias Flexíveis**: Agora você pode criar, editar e gerenciar categorias de produtos dinamicamente
- **Migração Automática**: O sistema migra automaticamente produtos antigos para o novo sistema de categorias
- **Interface Administrativa**: Nova página para gerenciar categorias no painel admin
- **Filtros Inteligentes**: Filtros de produtos agora usam categorias dinâmicas

### Melhorias na API
- **Endpoint de Categorias**: Nova API `/api/categories/` para gerenciar categorias
- **Relacionamentos**: Produtos agora têm relacionamento ForeignKey com categorias
- **Validação**: Validação automática de categorias existentes

## 🐛 Solução de Problemas

### Erro de Porta em Uso
```bash
# Backend (Django)
python manage.py runserver 8001

# Frontend (React)
PORT=3001 npm start
```

### Erro de Migrações
```bash
python manage.py makemigrations --merge
python manage.py migrate
```

### Problemas com Categorias
Se houver problemas com a migração de categorias:
```bash
# Verificar status das migrações
python manage.py showmigrations

# Aplicar migrações pendentes
python manage.py migrate

# Verificar dados no banco
python manage.py shell
>>> from otica_app.models import Category, Product
>>> Category.objects.all()
>>> Product.objects.all()
```

### Limpar Cache
```bash
# Frontend
npm run build
rm -rf node_modules
npm install
```

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs no console
- Consulte a documentação da API em `/api/`
- Verifique o status das migrações com `python manage.py showmigrations`

## 🔄 Histórico de Versões

### v2.0 - Sistema de Categorias Dinâmicas
- ✅ Implementado sistema de categorias dinâmicas
- ✅ Migração automática de dados antigos
- ✅ Interface administrativa para categorias
- ✅ Filtros atualizados para usar categorias dinâmicas
- ✅ API de categorias implementada

### v1.0 - Versão Inicial
- ✅ Sistema básico de gestão de ótica
- ✅ Gestão de produtos, vendas e vendedores
- ✅ Sistema de caixa e relatórios
- ✅ Controle de acesso por níveis

## 📄 Licença

Este projeto é desenvolvido para demonstração e uso comercial.

---

**Desenvolvido para Sistema de Gestão de Ótica** 🕶️ 