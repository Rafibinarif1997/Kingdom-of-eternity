FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY services/api/package.json services/api/package.json
RUN pnpm install --no-frozen-lockfile
COPY services/api services/api
RUN pnpm --filter @koe/api build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/api/dist ./dist
COPY --from=build /app/services/api/package.json ./package.json
RUN npm install --omit=dev
EXPOSE 4000
CMD ["node", "dist/server.js"]
