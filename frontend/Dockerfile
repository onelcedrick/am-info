FROM node:20-alpine as build

WORKDIR /app

# Installer les dependances
COPY package*.json ./
RUN npm ci

# Copier le code et builder
COPY . .
RUN npm run build

# Etape 2 : Nginx pour servir le frontend
FROM nginx:alpine

# Copier le build
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
