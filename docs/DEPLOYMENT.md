# Deployment Guide

## Overview

This blog is deployed to Coolify and served via Cloudflare Tunnel.

## Coolify Configuration

### Create Application

1. Go to Coolify dashboard
2. Click "New Resource" > "Application"
3. Select your GitHub repository
4. Configure:
   - **Branch**: `main`
   - **Build Pack**: Dockerfile
   - **Dockerfile**: `./Dockerfile`
   - **Port**: 80

### Domain Configuration

1. In application settings, go to "Domains"
2. Add domain: `perevillega.com`
3. HTTPS is handled by Cloudflare Tunnel

### Environment Variables

Add these secrets in Coolify:

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_ZONE_ID` | Your Cloudflare zone ID |
| `CLOUDFLARE_API_TOKEN` | API token with cache purge permissions |

### Post-Deployment Hook

In Coolify application settings, add post-deployment command:

```bash
/scripts/purge-cloudflare-cache.sh
```

### Auto-Deploy

Enable webhook for automatic deployment when pushing to `main`.

## Cloudflare Configuration

### DNS Migration from GitHub Pages

1. In Cloudflare Dashboard > DNS, **delete** the existing GitHub Pages records:
   - Remove any A records pointing to GitHub's IPs (`185.199.108-111.153`)
   - Remove any CNAME record pointing to `*.github.io`
2. In the GitHub repository settings, **disable** GitHub Pages

### Tunnel Setup

The Coolify server is not publicly exposed. All traffic goes through a Cloudflare Tunnel.

1. Go to **Cloudflare Zero Trust** > **Networks** > **Tunnels**
2. Select your existing tunnel
3. Go to the **Public Hostname** tab
4. Click **Add a public hostname**
5. Configure:
   - **Domain**: `perevillega.com`
   - **Subdomain**: (leave empty for root domain, or set as needed)
   - **Service Type**: HTTP
   - **URL**: `localhost:<coolify-app-port>` (the port Coolify exposes for the container, typically 80)
6. Cloudflare automatically creates the required CNAME DNS record pointing to your tunnel

**Note**: Use **HTTP** (not HTTPS) as the service type since SSL terminates at Cloudflare's edge. The tunnel itself encrypts traffic between Cloudflare and your server, so no certificate is needed on the Coolify side.

### Cache Rules

Configure in Cloudflare Dashboard: **Caching > Cache Rules**

#### Rule 1: Static Assets (1 year)

- **Name**: Cache Astro Assets 1 Year
- **When**: `(http.request.uri.path contains "/assets/") or (http.request.uri.path contains "/_astro/")`
- **Then**:
  - Cache eligibility: Eligible for cache
  - Edge TTL: 1 year
  - Browser TTL: 1 year

#### Rule 2: Images (1 month)

- **Name**: Cache Images 1 Month
- **When**: `(http.request.uri.path contains "/images/") or (http.request.uri.path contains "/imgposts/") or (http.request.uri.path contains "/icons/")`
- **Then**:
  - Cache eligibility: Eligible for cache
  - Edge TTL: 1 month
  - Browser TTL: 1 month

#### Rule 3: HTML Pages (4 hours)

- **Name**: Cache HTML 4 Hours
- **When**: `(http.request.uri.path eq "/") or (ends_with(http.request.uri.path, "/")) or (ends_with(http.request.uri.path, ".html"))`
- **Then**:
  - Cache eligibility: Eligible for cache
  - Edge TTL: 4 hours
  - Browser TTL: 4 hours

#### Rule 4: RSS/Sitemap (1 hour)

- **Name**: Cache Feeds 1 Hour
- **When**: `(http.request.uri.path contains ".xml")`
- **Then**:
  - Cache eligibility: Eligible for cache
  - Edge TTL: 1 hour
  - Browser TTL: 1 hour

### Additional Settings

#### Speed > Optimization > Content Optimization

- **Auto Minify**: Enable for JavaScript, CSS, HTML
- **Early Hints**: Enable
- **Rocket Loader**: Disable (breaks Astro hydration)

#### Caching > Tiered Cache

- Enable **Tiered Cache**

#### Caching > Configuration

- **Browser Cache TTL**: Respect Existing Headers
- **Crawler Hints**: Enable
- **Always Online**: Enable

### API Token for Cache Purge

1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Create Token:
   - **Permissions**: Zone > Cache Purge > Purge
   - **Zone Resources**: Include > Specific zone > perevillega.com
3. Save token as `CLOUDFLARE_API_TOKEN` in Coolify

### Finding Zone ID

1. Cloudflare Dashboard > select `perevillega.com`
2. Overview page > API section > copy **Zone ID**
3. Save as `CLOUDFLARE_ZONE_ID` in Coolify

## Manual Cache Purge

If needed, purge cache manually:

```bash
export CLOUDFLARE_ZONE_ID="your-zone-id"
export CLOUDFLARE_API_TOKEN="your-api-token"
./scripts/purge-cloudflare-cache.sh
```

## Rollback

If issues arise:

1. Revert the problematic commit on `main`
2. Push to trigger auto-deploy
3. Purge Cloudflare cache
