# Estágio 1: Builder - Compila a aplicação
FROM node:18-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de gerenciamento de pacotes
COPY package.json package-lock.json ./

# Instala as dependências de desenvolvimento
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Executa o build de produção
RUN npm run build

# Estágio 2: Runner - Executa a aplicação
FROM node:18-alpine AS runner

WORKDIR /app

# Copia as dependências de produção do estágio de build
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm install --production

# Copia os artefatos de build do estágio anterior
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./

# Expõe a porta em que a aplicação Next.js roda
EXPOSE 3000

# Define o comando para iniciar a aplicação em modo de produção
CMD ["npm", "start"]