@echo off
echo ========================================
echo    INICIANDO SISTEMA DE OTICA
echo ========================================
echo.

REM Ativar ambiente virtual
echo Ativando ambiente virtual...
call venv\Scripts\activate

REM Iniciar backend em background
echo Iniciando backend (Django)...
start "Backend Django" cmd /k "call venv\Scripts\activate && python manage.py runserver"

REM Aguardar um pouco para o backend inicializar
timeout /t 3 /nobreak >nul

REM Iniciar frontend
echo Iniciando frontend (React)...
echo.
echo O sistema sera aberto automaticamente no navegador.
echo.
echo Credenciais de acesso:
echo - Admin: admin / admin123
echo - Gerente: gerente / gerente123
echo.
echo Pressione Ctrl+C para parar o frontend
echo.

npm start 