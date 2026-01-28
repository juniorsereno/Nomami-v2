# Deploy no EasyPanel - Usando Apenas Dockerfile

Este guia explica como fazer o deploy da aplicação Nomami no EasyPanel usando **apenas o Dockerfile** (sem Docker Compose).

## 📋 Pré-requisitos

- Acesso ao painel EasyPanel
- Banco de dados PostgreSQL (Neon recomendado)
- Domínio configurado

## 🚀 Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que o [`Dockerfile`](nomami-app/Dockerfile) está na pasta `nomami-app/`.

### 2. Criar o Serviço no EasyPanel

1. Acesse o EasyPanel
2. Clique em **Create Service**
3. Selecione **Dockerfile** (não Docker Compose)
4. Configure:

#### Source:
- **Repository**: URL do seu repositório Git
- **Branch**: `main` (ou sua branch de produção)
- **Dockerfile Path**: `nomami-app/Dockerfile`
- **Context Path**: `nomami-app`

#### Build Arguments (IMPORTANTE):
Adicione os build arguments obrigatórios:

| Build Arg | Valor | Descrição |
|-----------|-------|-----------|
| `NEXT_PUBLIC_APP_URL` | `https://app.seudominio.com.br` | URL pública da aplicação |
| `NEXTAUTH_URL` | `https://app.seudominio.com.br` | URL do NextAuth |

> ⚠️ **ATENÇÃO**: Variáveis `NEXT_PUBLIC_*` são build-time, não runtime!

### 3. Configurar Variáveis de Ambiente (Runtime)

Na aba **Environment Variables**, adicione:

#### Obrigatórias:
```env
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
DATABASE_POOL_URL=postgresql://user:password@host:port/database?sslmode=require

# Authentication
AUTH_SECRET=sua-chave-secreta-aqui

# Application URLs
NEXT_PUBLIC_APP_URL=https://app.seudominio.com.br
NEXTAUTH_URL=https://app.seudominio.com.br
```

#### Integrações:
```env
# Asaas
ASAAS_API_KEY=sua-chave-asaas

# Telemedicine
TELEMEDICINE_API_USER=seu-usuario
TELEMEDICINE_API_PASSWORD=sua-senha
TELEMEDICINE_WEBHOOK_URL=https://app.seudominio.com.br/api/webhook/telemedicine

# WhatsApp
WHATSAPP_API_URL=https://sua-evolution-api.com
WHATSAPP_API_KEY=sua-chave-api
WHATSAPP_INSTANCE=nomami

# Cron (opcional)
CRON_SECRET=sua-chave-cron
```

### 4. Configurar Recursos

Na aba **Resources**:
- **Memory Limit**: `1024 MB` (1GB) - recomendado
- **Memory Reservation**: `512 MB`
- **CPU Limit**: `1.0`
- **CPU Reservation**: `0.5`

### 5. Configurar Portas

Na aba **Ports**:
- **Container Port**: `3000`
- **Published Port**: `3000` (ou deixe o EasyPanel escolher)

### 6. Configurar Volumes

Na aba **Volumes**, adicione:
- **Volume Name**: `uploads`
- **Mount Path**: `/app/public/uploads`

Isso garante que os uploads persistam entre reinicializações.

### 7. Configurar Domínio

Na aba **Domains**:
- Adicione seu domínio (ex: `app.nomami.com.br`)
- Ative SSL (Let's Encrypt)

### 8. Deploy

Clique em **Deploy** e aguarde o build completar.

---

## 🔍 Verificação

Após o deploy, teste:

1. **Health Check**: `https://app.seudominio.com.br/api/health`
2. **Home**: `https://app.seudominio.com.br`
3. **Uploads**: Teste o upload de arquivos

---

## 🛠️ Troubleshooting

### Build falha com "Cannot find module"
```
Verifique se o package.json está correto e se o npm ci está funcionando.
```

### Variáveis NEXT_PUBLIC não funcionam
```
Essas variáveis são build-time! Certifique-se de que estão em 
"Build Arguments", não em "Environment Variables".
```

### Erro de memória durante o build
```
Aumente o Memory Limit no EasyPanel para 2GB temporariamente 
durante o build, depois pode reduzir para 1GB.
```

### Banco de dados não conecta
```
Verifique:
1. Se a URL do PostgreSQL está correta
2. Se o SSL está configurado (?sslmode=require)
3. Se o IP do servidor está na whitelist do Neon
```

### Uploads não persistem
```
Verifique se o volume está montado em /app/public/uploads
```

---

## 📋 Resumo das Configurações

| Config | Valor |
|--------|-------|
| **Tipo** | Dockerfile |
| **Caminho** | `nomami-app/Dockerfile` |
| **Contexto** | `nomami-app` |
| **Porta** | `3000` |
| **Volume** | `uploads` → `/app/public/uploads` |
| **Build Args** | `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL` |

---

## 🔒 Checklist de Segurança

- [ ] `AUTH_SECRET` gerado com `openssl rand -base64 32`
- [ ] `CRON_SECRET` configurado (se usar cron jobs)
- [ ] SSL ativado no domínio
- [ ] Banco de dados com SSL obrigatório
- [ ] Variáveis sensíveis não commitadas

---

**Pronto!** Sua aplicação deve estar rodando no EasyPanel usando apenas o Dockerfile.