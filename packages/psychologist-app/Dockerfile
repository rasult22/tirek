FROM node:22-slim AS build

WORKDIR /app

# Copy tsconfig and shared package
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/

# Install deps
COPY packages/psychologist-app/package.json packages/psychologist-app/
WORKDIR /app/packages/psychologist-app
RUN npm install

# Copy source and build (skip tsc, Vite handles transpilation)
COPY packages/psychologist-app/ /app/packages/psychologist-app/
RUN npm run build:prod

# Serve with lightweight static server
FROM node:22-slim
RUN npm i -g serve
COPY --from=build /app/packages/psychologist-app/dist /app
WORKDIR /app
CMD sh -c "serve -s . -l tcp://0.0.0.0:${PORT:-3000}"
