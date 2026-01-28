# Deploy no EasyPanel - Nomami App

Este guia explica como fazer o deploy da aplicação Nomami no EasyPanel usando Docker.

## 📋 Pré-requisitos

- Acesso ao painel EasyPanel
- Banco de dados PostgreSQL (recomendamos Neon PostgreSQL)
- Domínio configurado apontando para o servidor EasyPanel

## 🚀 Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que os seguintes arquivos estão no seu repositório:

```
nomami-v2/
├── nomami-app/
│   ├── Dockerfile          # Dockerfile otimizado
│   ├── package.json
│   ├── next.config.ts
│   └── ... (resto da aplicação)
├── docker-compose.easypanel.yml  # Compose para EasyPanel
└── .env.easypanel.example        # Exemplo de variáveis
```

### 2. Configurar Variáveis de Ambiente

No EasyPanel, vá em **Environment Variables** e adicione todas as variáveis:

#### Obrigatórias:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL do PostgreSQL | `postgresql://user:pass@host/db?sslmode=require` |
| `DATABASE_POOL_URL` | URL do pool de conexões | `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET` | Segredo do NextAuth | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | URL pública da app | `https://app.nomami.com.br` |
| `NEXTAUTH_URL` | URL do NextAuth | `https://app.nomami.com.br` |

#### Integrações:

| Variável | Descrição |
|----------|-----------|
| `ASAAS_API_KEY` | Chave API do Asaas |
| `TELEMEDICINE_API_USER` | Usuário API Telemedicina |
| `TELEMEDICINE_API_PASSWORD` | Senha API Telemedicina |
| `TELEMEDICINE_WEBHOOK_URL` | URL webhook telemedicina |
| `WHATSAPP_API_URL` | URL Evolution API |
| `WHATSAPP_API_KEY` | Chave Evolution API |
| `WHATSAPP_INSTANCE` | Nome da instância (padrão: nomami) |

### 3. Configurar o Serviço no EasyPanel

1. Acesse o EasyPanel
2. Clique em **Create Service**
3. Selecione **Docker Compose**
4. Configure:
   - **Name**: `nomami-app`
   - **Docker Compose File**: Cole o conteúdo de [`docker-compose.easypanel.yml`](docker-compose.easypanel.yml)
   - **Environment Variables**: Cole as variáveis do arquivo `.env`

### 4. Configurar o Build

O EasyPanel detectará automaticamente o Dockerfile. Certifique-se de que:

- O **Build Context** está apontando para `./nomami-app`
- O **Dockerfile** é `Dockerfile`

### 5. Configurar o Domínio

1. Vá em **Domains**
2. Adicione seu domínio (ex: `app.nomami.com.br`)
3. Configure o SSL (Let's Encrypt)

### 6. Configurar Volumes

O EasyPanel criará automaticamente o volume `nomami_uploads` para persistir os uploads.

### 7. Deploy

Clique em **Deploy** e aguarde o build completar.

## 🔍 Verificação

Após o deploy, verifique se:

1. **Health Check**: Acesse `/api/health` - deve retornar status 200
2. **Uploads**: Teste o upload de arquivos
3. **Banco de Dados**: Verifique se as conexões estão funcionando

## 🛠️ Troubleshooting

### Erro de "Cannot find module"

Verifique se o `npm ci` está instalando todas as dependências corretamente.

### Variáveis NEXT_PUBLIC_ não funcionam

Essas variáveis são **build-time**, não runtime. Certifique-se de que estão definidas no EasyPanel ANTES do build.

### Erro de conexão com banco

Verifique se:
- A URL do PostgreSQL está correta
- O SSL está configurado (`?sslmode=require`)
- O IP do servidor EasyPanel está na whitelist do Neon

### Memory Issues

O Dockerfile já configura `NODE_OPTIONS="--max-old-space-size=512"`. Se necessário, aumente no EasyPanel:
- **Memory Limit**: 1GB ou mais
- **Swap**: 512MB

## 📁 Estrutura de Arquivos

```
nomami-v2/
├── nomami-app/
│   ├── Dockerfile              # Dockerfile otimizado com multi-stage build
│   ├── package.json
│   ├── next.config.ts
│   └── ...
├── docker-compose.easypanel.yml    # Compose específico para EasyPanel
├── docker-compose.yml              # Compose original (desenvolvimento)
├── .env.easypanel.example          # Template de variáveis
└── EASYPANEL-DEPLOY.md             # Este arquivo
```

## 🔒 Segurança

- Nunca commite arquivos `.env` com valores reais
- Use secrets do EasyPanel para dados sensíveis
- Configure `CRON_SECRET` para proteger endpoints de cron
- Mantenha o `AUTH_SECRET` seguro e único por ambiente

## 📝 Comandos Úteis

### Gerar AUTH_SECRET:
```bash
openssl rand -base64 32
```

### Testar localmente antes do deploy:
```bash
cd nomami-app
docker build -t nomami-app .
docker run -p 3000:3000 --env-file ../.env nomami-app
```

---

**Nota**: Este setup foi otimizado para o EasyPanel. Para outros provedores, pode ser necessário ajustar o Dockerfile e o docker-compose.