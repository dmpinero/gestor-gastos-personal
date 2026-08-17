FROM node:24-slim AS construccion

RUN corepack enable

WORKDIR /aplicacion

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine AS produccion

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /aplicacion/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
