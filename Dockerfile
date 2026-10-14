# ============================================================================
# AyudaYa Frontend - Imagen Docker multi-etapa
#
#   Etapa 1 (build):      Node 22 Alpine compila la app Angular en producción.
#   Etapa 2 (production): Nginx Alpine sirve los archivos estáticos generados.
#
# La etapa final NO contiene Node ni el código fuente, solo los estáticos,
# lo que reduce drásticamente el tamaño y la superficie de ataque.
# ============================================================================

# ---------- Etapa 1: Compilación ----------
# Angular 22.1 exige Node >= 22.18 (ver "engines" en package-lock.json),
# por lo que node:20 NO sirve: usamos node:22-alpine (LTS).
FROM node:22-alpine AS build

WORKDIR /app

# Copiamos primero los manifiestos para aprovechar la caché de capas de Docker:
# mientras package.json/package-lock.json no cambien, no se reinstalan deps.
COPY package.json package-lock.json ./

# Instalar dependencias del proyecto.
RUN npm install

# Copiar el resto del código fuente (src/, public/, angular.json, tsconfig, etc.)
COPY . .

# Compilar para producción.
# El builder @angular/build:application (Angular 17+) genera la salida en:
#   dist/AyudaYa-Frontend/browser
RUN npm run build -- --configuration=production

# ---------- Etapa 2: Producción (Nginx) ----------
# Heredamos la configuración por defecto de la imagen oficial.
FROM nginx:alpine AS production

# Reemplazamos la config por defecto de Nginx (conf.d/default.conf) por la nuestra,
# que incluye el fallback a index.html para el enrutado SPA de Angular.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los artefactos compilados al directorio público de Nginx
COPY --from=build /app/dist/AyudaYa-Frontend/browser /usr/share/nginx/html

# Nginx escucha en el puerto 80
EXPOSE 80

# Ejecuta Nginx en primer plano (daemon off) para que el contenedor no muera
CMD ["nginx", "-g", "daemon off;"]
