@echo off
echo ========================================
echo    TESTE LOCAL - SISTEMA OTICA
echo ========================================
echo.

echo 1. Iniciando servidor Django...
echo    Execute em outro terminal: python manage.py runserver
echo.

echo 2. Iniciando servidor React...
echo    Execute em outro terminal: npm start
echo.

echo 3. URLs para teste:
echo    - Frontend React: http://localhost:3000
echo    - Backend Django: http://localhost:8000
echo    - API Django: http://localhost:8000/api/
echo    - Admin Django: http://localhost:8000/admin/
echo.

echo 4. Para testar o build de producao:
echo    - Execute: build_frontend.bat
echo    - Abra: build/index.html no navegador
echo    - Verifique se os arquivos estaticos carregam
echo.

echo 5. Para deploy no servidor:
echo    - Execute: deploy_to_server.bat
echo    - Siga as instrucoes no arquivo
echo.

echo Pressione qualquer tecla para sair...
pause >nul 