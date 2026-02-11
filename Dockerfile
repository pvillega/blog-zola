FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build the site
RUN npm run build

# Production image using static-web-server
FROM ghcr.io/static-web-server/static-web-server:2-alpine
WORKDIR /

# Install curl for Cloudflare cache purge (switch to root for apk)
USER root
RUN apk add --no-cache curl

COPY --from=build /app/dist /public
COPY --from=build /app/scripts/purge-cloudflare-cache.sh /scripts/purge-cloudflare-cache.sh
RUN chmod +x /scripts/purge-cloudflare-cache.sh

# Expose port 80
EXPOSE 80
