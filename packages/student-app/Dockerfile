FROM node:22-slim AS build

WORKDIR /app

# Copy tsconfig and shared package
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/

# Install frontend deps
COPY packages/student-app/package.json packages/student-app/
WORKDIR /app/packages/student-app
RUN npm install --legacy-peer-deps

# Copy source and build (skip tsc, Vite handles transpilation)
COPY packages/student-app/ /app/packages/student-app/
RUN npm run build:prod

# Serve with lightweight static server
FROM node:22-slim
RUN npm i -g serve
COPY --from=build /app/packages/student-app/dist /app
WORKDIR /app
CMD sh -c "serve -s . -l tcp://0.0.0.0:${PORT:-3000}"
