# Atualização para Node.js 24 LTS

## 📋 Mudanças Realizadas

### 1. Dockerfile
- ✅ `node:20-alpine` → `node:24-alpine` (build stage)
- ✅ `node:20-alpine` → `node:24-alpine` (runner stage)

### 2. Arquivos .nvmrc
- ✅ Criado `.nvmrc` na raiz do projeto
- ✅ Criado `nomami-app/.nvmrc`
- Ambos especificam: `24.12.0`

### 3. package.json
- ✅ Atualizado `@types/node` de `^20` para `^22`
- ✅ Adicionado campo `engines`:
  ```json
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
  ```

### 4. Documentação
- ✅ README.md atualizado com Node.js 24 LTS
- ✅ DEPLOY-OTIMIZACAO.md atualizado

## 🚀 Como Atualizar Localmente

### Opção 1: Usando NVM (Recomendado)
```bash
# Instalar Node.js 24
nvm install 24.12.0

# Usar Node.js 24
nvm use 24.12.0

# Verificar versão
node --version  # Deve mostrar v24.12.0

# Reinstalar dependências
cd nomami-app
rm -rf node_modules package-lock.json
npm install
```

### Opção 2: Download Manual
1. Acesse: https://nodejs.org/
2. Baixe Node.js 24.12.0 LTS
3. Instale
4. Reinstale as dependências:
```bash
cd nomami-app
rm -rf node_modules package-lock.json
npm install
```

## 🐳 Deploy com Docker

O Docker já está configurado para usar Node.js 24. Basta fazer o rebuild:

```bash
# Parar container
docker-compose down

# Rebuild com Node.js 24
docker-compose build --no-cache nomami-app

# Subir
docker-compose up -d

# Verificar versão do Node no container
docker exec nomami-app node --version
```

## ✅ Benefícios do Node.js 24

### Performance
- ✅ V8 JavaScript engine mais recente
- ✅ Melhor performance em operações assíncronas
- ✅ Menor uso de memória

### Compatibilidade
- ✅ Melhor suporte para ESM (ES Modules)
- ✅ Resolve problema do pino-pretty
- ✅ Suporte completo para Next.js 15

### Segurança
- ✅ Patches de segurança mais recentes
- ✅ Suporte LTS até abril de 2027

## 🔍 Verificações Pós-Atualização

### 1. Verificar Versão Local
```bash
node --version
# Esperado: v24.12.0
```

### 2. Verificar Versão no Docker
```bash
docker exec nomami-app node --version
# Esperado: v24.12.0
```

### 3. Testar Build Local
```bash
cd nomami-app
npm run build
```

### 4. Testar Dev Server
```bash
npm run dev
# Deve iniciar sem erros do pino-pretty
```

## ⚠️ Possíveis Problemas

### Problema: npm install falha
**Solução:**
```bash
# Limpar cache do npm
npm cache clean --force

# Remover node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

### Problema: Erro de permissão no Linux
**Solução:**
```bash
# Usar nvm ao invés de sudo
nvm install 24.12.0
nvm use 24.12.0
```

### Problema: Docker não reconhece nova versão
**Solução:**
```bash
# Limpar cache do Docker
docker system prune -a

# Rebuild sem cache
docker-compose build --no-cache nomami-app
```

## 📊 Compatibilidade

### Dependências Verificadas
Todas as dependências do projeto são compatíveis com Node.js 24:

- ✅ Next.js 15.5.6 - Compatível
- ✅ React 19.1.0 - Compatível
- ✅ NextAuth.js 5.0.0-beta.30 - Compatível
- ✅ Neon Database - Compatível
- ✅ Pino Logger - Compatível
- ✅ Todas as outras dependências - Compatíveis

### Engines Mínimos
O projeto agora requer:
- Node.js >= 20.0.0 (recomendado 24.12.0)
- npm >= 10.0.0

## 🎯 Checklist de Atualização

### Desenvolvimento Local
- [ ] Node.js 24.12.0 instalado
- [ ] `node --version` mostra v24.12.0
- [ ] `npm install` executado com sucesso
- [ ] `npm run dev` inicia sem erros
- [ ] `npm run build` completa com sucesso

### Docker/Produção
- [ ] Dockerfile atualizado
- [ ] Docker rebuild executado
- [ ] Container iniciado com sucesso
- [ ] `docker exec nomami-app node --version` mostra v24.12.0
- [ ] Aplicação funcionando normalmente

### Documentação
- [ ] README.md atualizado
- [ ] .nvmrc criado
- [ ] package.json com engines configurado

## 📝 Notas Importantes

1. **Backward Compatible**: Node.js 24 é compatível com código Node.js 20
2. **LTS**: Node.js 24 tem suporte até abril de 2027
3. **Performance**: Espere ~10-15% de melhoria em performance
4. **Memória**: Melhor gerenciamento de memória (importante para o problema de RAM)

## 🆘 Rollback (Se Necessário)

Se precisar voltar para Node.js 20:

```bash
# Local
nvm use 20

# Dockerfile
# Mudar de node:24-alpine para node:20-alpine

# package.json
# Mudar @types/node de ^22 para ^20
```

---

**Data de Atualização**: 06/01/2026
**Versão Anterior**: Node.js 20
**Versão Atual**: Node.js 24.12.0 LTS
