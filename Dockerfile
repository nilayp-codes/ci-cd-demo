# Stage 1: builder
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src/ ./src/
RUN npm test

# Stage 2: runtime
FROM node:18-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY server.js ./

EXPOSE 3000

USER node

CMD ["node", "server.js"]
