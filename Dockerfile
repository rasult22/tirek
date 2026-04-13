FROM node:22-slim

WORKDIR /app

# Copy shared package first (backend depends on it via file:../shared)
COPY packages/shared/ packages/shared/

# Copy backend package files and install deps
COPY packages/backend/package.json packages/backend/
WORKDIR /app/packages/backend
RUN npm install

# Copy backend source
COPY packages/backend/ /app/packages/backend/

ENV NODE_ENV=production

CMD ["npx", "tsx", "src/server.ts"]
