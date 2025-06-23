@echo off
echo ========================================
echo    SISTEMA DE GESTAO DE OTICA
echo ========================================
echo.
echo Instalando e configurando o sistema...
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado. Instale o Python primeiro.
    pause
    exit /b 1
)

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

echo ✅ Python e Node.js encontrados
echo.

REM Criar ambiente virtual Python
echo Criando ambiente virtual Python...
python -m venv venv
call venv\Scripts\activate

REM Instalar dependências Python
echo Instalando dependencias Python...
pip install -r requirements.txt

REM Fazer migrações
echo Fazendo migracoes do banco de dados...
python manage.py makemigrations
python manage.py migrate

REM Criar dados de demonstração
echo Criando dados de demonstração...
python setup_demo.py

REM Instalar dependências Node.js
echo Instalando dependencias Node.js...
npm install

echo.
echo ========================================
echo    INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Para iniciar o sistema:
echo.
echo 1. Backend (Django):
echo    call venv\Scripts\activate
echo    python manage.py runserver
echo.
echo 2. Frontend (React):
echo    npm start
echo.
echo Credenciais de acesso:
echo - Admin: admin / admin123
echo - Gerente: gerente / gerente123
echo.
echo Pressione qualquer tecla para sair...
pause >nul 