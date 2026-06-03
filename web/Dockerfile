FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (capa cacheable)
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# Copiar código fuente completo
COPY . .

# Build en producción (NO standalone)
ARG API_BASE_URL=http://127.0.0.1:3010
ENV API_BASE_URL=${API_BASE_URL}
RUN npm run build

# --- Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ARG API_BASE_URL=http://127.0.0.1:3010
ENV API_BASE_URL=${API_BASE_URL}

# Copiar todo lo necesario del builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
