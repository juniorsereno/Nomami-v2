# NoMami App - Sistema de Gerenciamento de Clube de Benefícios

Sistema de gerenciamento completo para clube de benefícios com autenticação segura, gestão de assinantes, parceiros e integração com telemedicina.

## 🚀 Início Rápido

### Desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Produção

```bash
npm run build
npm start
```

## 📋 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia servidor de produção
- `npm run clean` - Limpa cache do Next.js
- `npm run rebuild` - Limpa cache e reconstrói o projeto
- `npm run lint` - Executa linter

## 🔐 Autenticação e Segurança

O sistema implementa autenticação robusta com:

- ✅ Login com email e senha (NextAuth.js)
- ✅ Sessão JWT com expiração de 2 horas
- ✅ Logout automático após 30 minutos de inatividade
- ✅ Middleware de proteção de rotas
- ✅ Validação rigorosa de sessão
- ✅ Primeiro acesso com validação de CPF

### Fluxo de Autenticação

1. Usuário acessa o sistema → Redireciona para `/login`
2. Faz login com email e senha
3. Sistema valida credenciais no banco Neon
4. Cria sessão JWT válida por 2 horas
5. Após 30 minutos sem atividade → Logout automático

## 📁 Estrutura do Projeto

```
nomami-app/
├── app/                    # Páginas e rotas (App Router)
│   ├── (auth)/            # Rotas de autenticação
│   ├── dashboard/         # Dashboard principal
│   ├── subscribers/       # Gestão de assinantes
│   ├── partners/          # Gestão de parceiros
│   └── api/               # API routes
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticação
│   ├── ui/               # Componentes de UI
│   └── ...
├── lib/                   # Bibliotecas e utilitários
│   ├── auth.ts           # Configuração NextAuth
│   ├── db-pool.ts        # Pool de conexão Neon
│   └── actions/          # Server Actions
├── middleware.ts          # Middleware de autenticação
└── scripts/              # Scripts utilitários
```

## 🗄️ Banco de Dados

O sistema utiliza **Neon Postgres** (serverless) com as seguintes tabelas principais:

- `users` - Usuários do sistema
- `subscribers` - Assinantes do clube
- `partners` - Parceiros comerciais
- `telemedicine_batches` - Lotes de telemedicina
- `webhook_logs` - Logs de webhooks

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="sua-chave-secreta-aqui"
ASAAS_API_KEY="sua-chave-asaas"
TELEMEDICINE_API_USER="usuario"
TELEMEDICINE_API_PASSWORD="senha"
```

Para gerar `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

## 📚 Documentação Adicional

- [CORRECOES-AUTENTICACAO.md](./CORRECOES-AUTENTICACAO.md) - Detalhes das correções de autenticação
- [DEPLOY.md](./DEPLOY.md) - Guia completo de deploy
- [CHECKLIST-DEPLOY.md](./CHECKLIST-DEPLOY.md) - Checklist para deploy
- [COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md) - Comandos úteis

## 🚀 Deploy

### Deploy Manual (PM2)

```bash
cd nomami-app
git pull
npm run rebuild
pm2 restart nomami-app
```

### Deploy com Docker

```bash
docker-compose down
docker-compose build --no-cache nomami-app
docker-compose up -d
```

### Após o Deploy

1. Limpe os cookies do navegador
2. Acesse a URL do app
3. Verifique se redireciona para `/login`
4. Teste o fluxo de autenticação

## 🧪 Testes

### Teste Automatizado

**Windows:**
```powershell
.\scripts\test-auth.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/test-auth.sh
./scripts/test-auth.sh
```

### Teste Manual

1. Acesse o app sem estar logado
2. Deve redirecionar para `/login`
3. Faça login com credenciais válidas
4. Deve acessar o dashboard
5. Aguarde 30 minutos sem interagir
6. Deve ser deslogado automaticamente

## 🛠️ Tecnologias

- **Framework:** Next.js 15 (App Router)
- **Runtime:** Node.js 24 LTS
- **Autenticação:** NextAuth.js v5
- **Banco de Dados:** Neon Postgres (Serverless)
- **UI:** Tailwind CSS + Radix UI
- **Formulários:** React Hook Form + Zod
- **Tabelas:** TanStack Table
- **Logs:** Pino

## 🐛 Troubleshooting

### App inicia logado após build

```bash
npm run clean
npm run build
pm2 restart nomami-app
# Limpe os cookies do navegador
```

### Erro de autenticação

1. Verifique se `AUTH_SECRET` está definido
2. Verifique conexão com banco de dados
3. Verifique logs: `pm2 logs nomami-app`

### Sessão não expira

1. Verifique se `SessionProvider` está no layout
2. Verifique console do navegador
3. Limpe cookies e teste novamente

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique a documentação em `/docs`
2. Consulte os logs do servidor
3. Verifique o console do navegador (F12)

## 📄 Licença

Propriedade de NoMami - Todos os direitos reservados.
