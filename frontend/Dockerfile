# AbsenKan frontend — build (Vite) lalu sajikan via nginx (monorepo: npm ci dari root)
FROM node:20-slim AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build --workspace frontend

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
