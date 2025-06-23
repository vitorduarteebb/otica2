@echo off
echo ========================================
echo    DEPLOY - SISTEMA DE GESTAO DE OTICA
echo ========================================
echo.

REM Verificar se o Git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Git nao encontrado. Instale o Git primeiro.
    pause
    exit /b 1
)

echo ✅ Git encontrado
echo.

REM Verificar se o repositório está inicializado
if not exist ".git" (
    echo Inicializando repositorio Git...
    git init
    echo.
)

REM Adicionar todos os arquivos
echo Adicionando arquivos ao Git...
git add .

REM Fazer commit
echo Fazendo commit das alteracoes...
git commit -m "Sistema de Gestão de Ótica - Versão para apresentação"

echo.
echo ========================================
echo    REPOSITORIO PREPARADO!
echo ========================================
echo.
echo Para enviar para o GitHub/GitLab:
echo.
echo 1. Crie um repositório no GitHub/GitLab
echo 2. Execute os comandos:
echo.
echo    git remote add origin <URL_DO_REPOSITORIO>
echo    git branch -M main
echo    git push -u origin main
echo.
echo Para clonar em outro computador:
echo    git clone <URL_DO_REPOSITORIO>
echo    cd otica1
echo    install.bat
echo.
echo Pressione qualquer tecla para sair...
pause >nul 