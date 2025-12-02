# Estágio 1: Builder - Compila a aplicação
FROM node:20-alpine AS build_stage

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de gerenciamento de pacotes
COPY package.json package-lock.json ./

# Instala as dependências de desenvolvimento
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Define argumentos de build para variáveis de ambiente públicas
ARG NEXT_PUBLIC_STACK_PROJECT_ID
ARG NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY

# Define variáveis de ambiente durante o build
ENV NEXT_PUBLIC_STACK_PROJECT_ID=$NEXT_PUBLIC_STACK_PROJECT_ID
ENV NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=$NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY

# Executa o build de produção
RUN npm run build

# Estágio 2: Runner - Executa a aplicação
FROM node:20-alpine AS runner

WORKDIR /app

# Copia as dependências de produção do estágio de build
COPY --from=build_stage /app/package.json /app/package-lock.json ./
RUN npm install --production && npm install typescript --no-save

# Copia os artefatos de build do estágio anterior
COPY --from=build_stage /app/public ./public
COPY --from=build_stage /app/.next ./.next
COPY --from=build_stage /app/next.config.ts ./

# Expõe a porta em que a aplicação Next.js roda
EXPOSE 3000

# Define o comando para iniciar a aplicação em modo de produção
CMD ["npm", "start"]