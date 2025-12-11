# 🚀 Comandos Rápidos - NoMami App

## 🧹 Limpeza e Build

```bash
# Limpar cache
npm run clean

# Limpar e rebuildar
npm run rebuild

# Build normal
npm run build

# Iniciar em produção
npm start

# Desenvolvimento
npm run dev
```

## 🐳 Docker

```bash
# Parar containers
docker-compose down

# Build sem cache
docker-compose build --no-cache nomami-app

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f nomami-app

# Ver logs (últimas 50 linhas)
docker-compose logs nomami-app --tail=50

# Reiniciar apenas o app
docker-compose restart nomami-app

# Rebuild completo
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

## 📦 PM2

```bash
# Reiniciar app
pm2 restart nomami-app

# Ver status
pm2 status

# Ver logs
pm2 logs nomami-app

# Ver logs (últimas 50 linhas)
pm2 logs nomami-app --lines 50

# Parar app
pm2 stop nomami-app

# Iniciar app
pm2 start nomami-app

# Deletar do PM2
pm2 delete nomami-app

# Salvar configuração
pm2 save
```

## 🔍 Verificações

```bash
# Verificar se o app está rodando
curl http://localhost:3000/api/auth/session

# Verificar se redireciona para login
curl -L http://localhost:3000/dashboard

# Testar autenticação (Windows)
.\scripts\test-auth.ps1

# Testar autenticação (Linux/Mac)
./scripts/test-auth.sh

# Verificar variáveis de ambiente
cat .env | grep AUTH_SECRET
```

## 🗄️ Banco de Dados (Neon)

```bash
# Conectar ao banco (se tiver psql instalado)
psql "postgresql://neondb_owner:npg_k3Gr7xiRYTWh@ep-still-lake-acuuj2i0-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Verificar usuários
psql "..." -c "SELECT id, nome, email, role, ativo FROM users;"

# Verificar usuários sem senha
psql "..." -c "SELECT id, nome, email FROM users WHERE password_hash IS NULL OR password_hash = '';"
```

## 🧪 Testes Rápidos

### Teste 1: Verificar se não está logado
```bash
# Deve retornar vazio ou null
curl http://localhost:3000/api/auth/session
```

### Teste 2: Acessar dashboard sem login
```bash
# Deve redirecionar para /login
curl -L http://localhost:3000/dashboard | grep "Faça login"
```

### Teste 3: Verificar página de login
```bash
# Deve retornar 200
curl -I http://localhost:3000/login
```

## 🔧 Troubleshooting Rápido

### Problema: Ainda inicia logado

```bash
# Solução 1: Limpar tudo
cd nomami-app
rm -rf .next
npm run build
pm2 restart nomami-app  # ou docker-compose restart nomami-app
```

### Problema: Erro de build

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema: Erro de conexão com banco

```bash
# Verificar variável de ambiente
echo $DATABASE_URL

# Testar conexão
psql "$DATABASE_URL" -c "SELECT 1;"
```

### Problema: Sessão não expira

```bash
# Verificar AUTH_SECRET
cat .env | grep AUTH_SECRET

# Gerar novo AUTH_SECRET
openssl rand -base64 32

# Atualizar .env e reiniciar
pm2 restart nomami-app
```

## 📊 Monitoramento

```bash
# Ver uso de recursos (PM2)
pm2 monit

# Ver logs em tempo real (PM2)
pm2 logs nomami-app --raw

# Ver logs em tempo real (Docker)
docker-compose logs -f nomami-app

# Ver status dos containers
docker-compose ps

# Ver uso de recursos (Docker)
docker stats
```

## 🔐 Segurança

```bash
# Gerar novo AUTH_SECRET
openssl rand -base64 32

# Verificar permissões do .env
ls -la .env

# Corrigir permissões do .env
chmod 600 .env
```

## 📝 Git

```bash
# Ver status
git status

# Adicionar alterações
git add .

# Commit
git commit -m "fix: corrigir autenticação e adicionar timeout de sessão"

# Push
git push origin main

# Pull no servidor
git pull origin main
```

## 🎯 Deploy Completo (Um Comando)

### PM2:
```bash
cd nomami-app && git pull && npm run rebuild && pm2 restart nomami-app && pm2 logs nomami-app --lines 20
```

### Docker:
```bash
cd nomami-app && git pull && docker-compose down && docker-compose build --no-cache && docker-compose up -d && docker-compose logs -f nomami-app
```

## 💡 Dicas

- Sempre limpe os cookies do navegador após deploy
- Use modo anônimo para testar sem cache
- Verifique os logs após cada deploy
- Mantenha backup do .env
- Documente qualquer problema encontrado
