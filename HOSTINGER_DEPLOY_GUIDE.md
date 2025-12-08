# Guia de Hospedagem - Essência Duo PDF na Hostinger

Este documento explica passo a passo como hospedar corretamente o projeto na Hostinger.

## 📋 Pré-requisitos

- Node.js instalado (versão 18 ou superior)
- npm instalado
- Acesso ao painel da Hostinger
- Domínio já configurado na Hostinger

---

## 🔧 Passo 1: Preparar o Projeto para Produção

### 1.1 Clone ou baixe o projeto

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd <NOME_DO_PROJETO>
```

### 1.2 Instale as dependências

```bash
npm install
```

### 1.3 Configure as variáveis de ambiente

Crie um arquivo `.env.production` na raiz do projeto com:

```env
VITE_SUPABASE_PROJECT_ID="ikyrgqxvjvnalnrqibyi"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlreXJncXh2anZuYWxucnFpYnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI4MjMsImV4cCI6MjA3ODUyODgyM30.5ELn_y4HPf7L01sTbq7UAvd23RsmNNgCQju_OkwMuxw"
VITE_SUPABASE_URL="https://ikyrgqxvjvnalnrqibyi.supabase.co"
```

### 1.4 Gere o build de produção

```bash
npm run build
```

Isso criará uma pasta `dist/` com todos os arquivos otimizados para produção.

---

## 🌐 Passo 2: Configurar o Roteamento SPA

### ⚠️ IMPORTANTE - Este é o passo mais crítico!

Projetos React com React Router são **Single Page Applications (SPA)**. Isso significa que todas as rotas são gerenciadas pelo JavaScript, não pelo servidor.

### 2.1 Crie o arquivo `.htaccess`

Dentro da pasta `dist/` (após o build), crie um arquivo chamado `.htaccess` com o seguinte conteúdo:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Se o arquivo ou diretório existe, use-o diretamente
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Caso contrário, redirecione para index.html
  RewriteRule ^ index.html [QSA,L]
</IfModule>

# Configurações de cache para melhor performance
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Imagens
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  
  # CSS e JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  
  # Fontes
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/ttf "access plus 1 year"
</IfModule>

# Compressão GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Headers de segurança
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

### 2.2 Por que isso é necessário?

Sem o `.htaccess`:
- Usuário acessa `seusite.com` → ✅ Funciona
- Usuário acessa `seusite.com/dashboard` → ❌ Erro 404
- Usuário recarrega a página em `/auth` → ❌ Erro 404

Com o `.htaccess`:
- Todas as rotas funcionam corretamente ✅

---

## 📤 Passo 3: Upload para a Hostinger

### 3.1 Acesse o Gerenciador de Arquivos

1. Entre no painel da Hostinger (hpanel.hostinger.com)
2. Vá em **Hospedagem** → Selecione seu domínio
3. Clique em **Gerenciador de Arquivos**

### 3.2 Navegue até a pasta correta

- Para domínio principal: `public_html/`
- Para subdomínio: `public_html/subdominio/` ou `domains/subdominio.seusite.com/public_html/`

### 3.3 Limpe a pasta (se necessário)

⚠️ **IMPORTANTE**: Remova todos os arquivos antigos da pasta antes de fazer upload dos novos.

### 3.4 Faça upload dos arquivos

1. **NÃO faça upload da pasta `dist` inteira**
2. **Faça upload do CONTEÚDO da pasta `dist`**
3. Selecione todos os arquivos e pastas DENTRO de `dist/`:
   - `index.html`
   - `assets/`
   - `.htaccess`
   - Outros arquivos...

### 3.5 Verifique a estrutura final

Sua `public_html/` deve ficar assim:

```
public_html/
├── .htaccess
├── index.html
├── assets/
│   ├── index-XXXXX.js
│   ├── index-XXXXX.css
│   └── ... (outros assets)
├── favicon.ico
├── robots.txt
└── ... (outros arquivos)
```

---

## 🔄 Passo 4: Configurar o Domínio

### 4.1 Verifique o DNS

No painel da Hostinger:
1. Vá em **Domínios** → Seu domínio → **DNS / Nameservers**
2. Certifique-se que os nameservers apontam para a Hostinger:
   - `ns1.dns-parking.com`
   - `ns2.dns-parking.com`
   
   Ou os nameservers específicos da sua conta.

### 4.2 Aguarde a propagação

A propagação DNS pode levar até 48 horas, mas geralmente acontece em 15-30 minutos.

---

## 🔒 Passo 5: Ativar SSL (HTTPS)

### 5.1 Ative o SSL gratuito

1. No painel da Hostinger, vá em **SSL**
2. Clique em **Instalar SSL** para seu domínio
3. Aguarde a instalação (pode levar alguns minutos)

### 5.2 Force HTTPS

Adicione no início do seu `.htaccess`:

```apache
# Forçar HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 🐛 Solução de Problemas Comuns

### Problema: Página em branco

**Causas possíveis:**
1. Arquivos JavaScript não carregando
2. Erro no console do navegador

**Soluções:**
1. Abra o DevTools (F12) → Console → Verifique erros
2. Verifique se todos os arquivos da pasta `assets/` foram enviados
3. Limpe o cache do navegador (Ctrl+Shift+R)

### Problema: Erro 404 em rotas

**Causa:** Arquivo `.htaccess` não foi criado ou não está funcionando

**Soluções:**
1. Verifique se o `.htaccess` está na raiz do `public_html`
2. Verifique se o `mod_rewrite` está ativado (entre em contato com suporte Hostinger)

### Problema: Estilos/CSS não aparecem

**Causas possíveis:**
1. Caminhos relativos incorretos
2. Arquivos CSS não foram enviados

**Soluções:**
1. Verifique se a pasta `assets/` foi enviada completamente
2. Verifique os caminhos no `index.html`

### Problema: Imagens não carregam

**Soluções:**
1. Verifique se a pasta de imagens foi enviada
2. Verifique permissões de arquivo (devem ser 644)
3. Verifique se os caminhos estão corretos

### Problema: Erro de CORS

**Causa:** Requisições para o Supabase bloqueadas

**Soluções:**
1. Verifique se as variáveis de ambiente estão corretas
2. No Supabase, verifique as configurações de CORS
3. Adicione seu domínio nas URLs permitidas do Supabase

---

## 📱 Passo 6: Configurações Adicionais no Supabase

### 6.1 Adicione seu domínio às URLs permitidas

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Authentication** → **URL Configuration**
3. Adicione seu domínio em:
   - **Site URL**: `https://seudominio.com`
   - **Redirect URLs**: 
     - `https://seudominio.com`
     - `https://seudominio.com/auth`
     - `https://seudominio.com/dashboard`
     - `https://www.seudominio.com` (se usar www)

### 6.2 Configure o CAPTCHA (opcional)

Se estiver usando Cloudflare Turnstile:
1. Vá em **Authentication** → **Providers** → **Captcha**
2. Adicione seu domínio na configuração do Turnstile

---

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Build gerado com `npm run build`
- [ ] Arquivo `.htaccess` criado dentro de `dist/`
- [ ] Conteúdo de `dist/` enviado para `public_html/`
- [ ] SSL ativado
- [ ] Domínio configurado no Supabase
- [ ] Teste de login funcionando
- [ ] Teste de navegação entre páginas funcionando
- [ ] Teste de recarregar página em rota diferente de `/`

---

## 🚀 Deploy Automático (Alternativa Recomendada)

Para evitar problemas de deploy manual, considere usar:

### Opção 1: Lovable Publish (Recomendado)

1. No Lovable, clique em **Publish**
2. Configure seu domínio personalizado
3. O Lovable cuida de todo o processo automaticamente

### Opção 2: GitHub Actions + Hostinger

Configure CI/CD para deploy automático a cada push.

### Opção 3: Vercel/Netlify

Plataformas especializadas em hospedar aplicações React/Vite com configuração zero.

---

## 📞 Suporte

Se ainda tiver problemas:

1. **Hostinger**: Chat ao vivo no painel
2. **Supabase**: [Documentação](https://supabase.com/docs)
3. **Lovable**: [Discord](https://discord.com/channels/1119885301872070706)

---

*Documento criado em: Dezembro 2024*
*Projeto: Essência Duo PDF*
