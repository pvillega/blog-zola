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
COPY --from=build /app/dist /public

# Expose port 80
EXPOSE 80
