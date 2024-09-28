# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install build-essential equivalent and other common build tools
RUN apk add --no-cache build-base python3 make g++ && \
    ln -sf python3 /usr/bin/python && \
    npm config set python /usr/bin/python
ENV PYTHON=/usr/bin/python

COPY package*.json ./
# Use explicit Python path for node-gyp
RUN npm ci --production --python=/usr/bin/python

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY config ./config

EXPOSE 8888

ENV NODE_ENV=production
ENV PORT=8888

CMD ["node", "dist/server.js"]