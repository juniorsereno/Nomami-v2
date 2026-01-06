# Estágio 1: Builder - Compila a aplicação
FROM node:24-alpine AS build_stage

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
FROM node:24-alpine AS runner

WORKDIR /app

# Definir NODE_ENV antes de instalar dependências
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copia as dependências de produção do estágio de build
COPY --from=build_stage /app/package.json /app/package-lock.json ./
RUN npm ci --only=production --ignore-scripts

# Copia os artefatos de build do estágio anterior
COPY --from=build_stage /app/public ./public
COPY --from=build_stage /app/.next ./.next
COPY --from=build_stage /app/next.config.ts ./

# Cria pasta de uploads com permissões corretas
RUN mkdir -p /app/public/uploads && chmod 777 /app/public/uploads

# Expõe a porta em que a aplicação Next.js roda
EXPOSE 3000

# Define o comando para iniciar a aplicação em modo de produção
CMD ["npm", "start"]