@echo off
echo ========================================
echo    DEPLOY PARA SERVIDOR - OTICA
echo ========================================
echo.

REM Verificar se a pasta build existe
if not exist "build" (
    echo ERRO: Pasta build nao encontrada!
    echo Execute primeiro: build_frontend.bat
    pause
    exit /b 1
)

echo ✅ Pasta build encontrada
echo.

echo ========================================
echo    INSTRUCOES PARA DEPLOY
echo ========================================
echo.
echo 1. Copie a pasta build/ para o servidor
echo 2. No servidor, execute os comandos:
echo.
echo    # Fazer backup do build atual
echo    sudo cp -r /opt/otica/build /opt/otica/build_backup_$(date +%%Y%%m%%d_%%H%%M%%S)
echo.
echo    # Remover build antigo
echo    sudo rm -rf /opt/otica/build
echo.
echo    # Copiar novo build (substitua pelo caminho correto)
echo    sudo cp -r /caminho/para/build /opt/otica/build
echo.
echo    # Ajustar permissões
echo    sudo chown -R www-data:www-data /opt/otica/build
echo    sudo chmod -R 755 /opt/otica/build
echo.
echo    # Reiniciar Nginx
echo    sudo systemctl restart nginx
echo.
echo    # Verificar status
echo    sudo systemctl status nginx
echo.
echo 3. Teste no navegador: http://oticahospitaldosoculos.com.br/otica2/
echo.
echo ========================================
echo    ARQUIVOS PRONTOS PARA DEPLOY
echo ========================================
echo.
echo Pasta build/ contem:
echo - index.html
echo - static/css/main.000243c7.css
echo - static/js/main.104ee472.js
echo.
echo Pressione qualquer tecla para sair...
pause >nul 