# Solução para Arquivos Estáticos do React

## Problema Identificado
O frontend React não está carregando os arquivos estáticos (JS e CSS) no servidor, retornando erro 404.

## Solução

### 1. Build Local (Já Concluído ✅)
- O `package.json` foi corrigido com `"homepage": "/otica2"`
- O build foi executado com sucesso
- Os arquivos estão em `build/` com os caminhos corretos

### 2. Deploy no Servidor

Execute estes comandos no servidor:

```bash
# 1. Fazer backup do build atual
sudo cp -r /opt/otica/build /opt/otica/build_backup_$(date +%Y%m%d_%H%M%S)

# 2. Remover build antigo
sudo rm -rf /opt/otica/build

# 3. Copiar novo build (substitua pelo caminho correto)
# Se você fez upload via SCP/SFTP:
sudo cp -r /tmp/build /opt/otica/build
# OU se você fez upload via Git:
sudo cp -r /opt/otica/build_temp /opt/otica/build

# 4. Ajustar permissões
sudo chown -R www-data:www-data /opt/otica/build
sudo chmod -R 755 /opt/otica/build

# 5. Verificar se os arquivos existem
ls -la /opt/otica/build/static/
ls -la /opt/otica/build/static/css/
ls -la /opt/otica/build/static/js/

# 6. Reiniciar Nginx
sudo systemctl restart nginx

# 7. Verificar status
sudo systemctl status nginx
```

### 3. Verificação da Configuração Nginx

A configuração atual do Nginx deve estar assim:

```nginx
# Frontend React
location /otica2/ {
    alias /opt/otica/build/;
    try_files $uri $uri/ /otica2/index.html;
    index index.html;
}
```

### 4. Testes

Após o deploy, teste:

1. **No navegador desktop**: http://oticahospitaldosoculos.com.br/otica2/
2. **No celular**: http://oticahospitaldosoculos.com.br/otica2/
3. **Verificar arquivos estáticos**:
   - http://oticahospitaldosoculos.com.br/otica2/static/css/main.000243c7.css
   - http://oticahospitaldosoculos.com.br/otica2/static/js/main.104ee472.js

### 5. Logs para Debug

Se ainda houver problemas, verifique os logs:

```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs do Gunicorn
sudo journalctl -u gunicorn -f
```

### 6. Estrutura Esperada

Após o deploy, a estrutura deve ser:

```
/opt/otica/build/
├── index.html
├── asset-manifest.json
└── static/
    ├── css/
    │   ├── main.000243c7.css
    │   └── main.000243c7.css.map
    └── js/
        ├── main.104ee472.js
        ├── main.104ee472.js.map
        └── main.104ee472.js.LICENSE.txt
```

## Status Atual
- ✅ Build local correto
- ✅ Arquivos estáticos gerados
- ✅ Caminhos configurados corretamente
- ⏳ Aguardando deploy no servidor 