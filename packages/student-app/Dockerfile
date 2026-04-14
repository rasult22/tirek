FROM node:22-slim AS build

WORKDIR /app

# Copy shared package (dependency)
COPY packages/shared/ packages/shared/

# Install deps
COPY packages/student-app/package.json packages/student-app/
WORKDIR /app/packages/student-app
RUN npm install

# Copy source and build
COPY packages/student-app/ /app/packages/student-app/
RUN npm run build

# Serve with lightweight static server
FROM node:22-slim
RUN npm i -g serve
COPY --from=build /app/packages/student-app/dist /app
WORKDIR /app
CMD sh -c "serve -s . -l tcp://0.0.0.0:${PORT:-3000}"
