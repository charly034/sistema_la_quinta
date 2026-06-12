FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY apps/web-administracion/package*.json ./apps/web-administracion/

RUN npm install

COPY . .
RUN npm run build --workspace @laquinta/web-administracion

FROM nginx:1.29-alpine
COPY --from=build /app/apps/web-administracion/dist /usr/share/nginx/html

COPY apps/web-administracion/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
