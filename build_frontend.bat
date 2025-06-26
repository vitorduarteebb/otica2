@echo off
echo ========================================
echo    BUILD FRONTEND REACT - OTICA
echo ========================================
echo.

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

REM Verificar se o npm está instalado
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: npm nao encontrado. Instale o npm primeiro.
    pause
    exit /b 1
)

echo ✅ npm encontrado
echo.

REM Instalar dependências
echo Instalando dependencias...
npm install

if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas
echo.

REM Fazer build do projeto
echo Fazendo build do projeto...
npm run build

if errorlevel 1 (
    echo ERRO: Falha ao fazer build
    pause
    exit /b 1
)

echo ✅ Build concluido com sucesso!
echo.

REM Verificar se a pasta build foi criada
if not exist "build" (
    echo ERRO: Pasta build nao foi criada
    pause
    exit /b 1
)

echo ========================================
echo    BUILD CONCLUIDO!
echo ========================================
echo.
echo Arquivos gerados em: build/
echo.
echo Para fazer deploy:
echo 1. Copie a pasta build/ para o servidor
echo 2. Coloque em /opt/otica/build/
echo 3. Reinicie o Nginx: sudo systemctl restart nginx
echo.
echo Pressione qualquer tecla para sair...
pause >nul 