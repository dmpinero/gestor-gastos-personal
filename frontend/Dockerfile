FROM node:26-slim AS construccion

# Node ya no incluye corepack preinstalado desde esta version (ver
# https://github.com/nodejs/corepack); hay que instalarlo explicitamente
# antes de poder activarlo.
RUN npm install -g corepack@latest && corepack enable

WORKDIR /aplicacion

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine AS produccion

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /aplicacion/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
