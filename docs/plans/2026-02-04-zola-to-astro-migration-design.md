# Zola to Astro Migration Design

## Overview

Migrate the existing Zola-based blog at `perevillega.com` to Astro using the AstroPaper theme. The migration preserves all existing functionality, content, and styling while modernising the tech stack.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme | AstroPaper | 3.8k GitHub stars, actively maintained, similar aesthetic to tabi |
| Content Migration | Automated script | 70+ posts, consistent frontmatter format |
| Git Strategy | Branch-based | Safe rollback, test before merge |
| Caching | Aggressive + purge on deploy | Static site, content only changes on deploy |
| Analytics | Keep Umami | Already self-hosted and working |
| Features | All | Mermaid, search, social cards, reading time, prev/next links |

## Project Structure

```
blog-zola/
├── src/
│   ├── components/        # Astro components (header, footer, etc.)
│   ├── content/
│   │   └── blog/          # Migrated posts (markdown with YAML frontmatter)
│   ├── layouts/           # Page layouts
│   ├── pages/             # Route pages (index, tags, etc.)
│   ├── styles/            # Global styles, custom.css
│   └── utils/             # Helper functions
├── public/
│   ├── images/            # From static/images
│   ├── imgposts/          # From static/imgposts
│   ├── icons/             # Favicons
│   └── files/             # Downloadable files
├── scripts/
│   └── migrate-content.ts # Migration script
├── astro.config.mjs       # Astro configuration
├── tailwind.config.cjs    # Tailwind customisation
├── Dockerfile             # Updated for Astro build
└── package.json
```

## Content Migration

### Frontmatter Conversion

The migration script converts Zola's TOML frontmatter to Astro's YAML format:

**Zola (before)**
```toml
+++
title = "Understanding Data Mesh"
date = 2023-11-10
[taxonomies]
tags = ["architecture", "data"]
categories = ["engineering"]
[extra]
social_media_card = "social_cards/data-mesh.png"
+++
```

**Astro (after)**
```yaml
---
title: "Understanding Data Mesh"
pubDatetime: 2023-11-10
tags: ["architecture", "data"]
categories: ["engineering"]
ogImage: "social_cards/data-mesh.png"
draft: false
---
```

### Field Mappings

| Zola Field | Astro Field |
|------------|-------------|
| `date` | `pubDatetime` |
| `updated` | `modDatetime` |
| `[taxonomies].tags` | `tags` |
| `[taxonomies].categories` | `categories` |
| `[extra].social_media_card` | `ogImage` |
| `draft = true` | `draft: true` |

### Script Responsibilities

- Parse `+++` TOML blocks and convert to `---` YAML blocks
- Flatten `[taxonomies]` section to top-level arrays
- Map `[extra]` fields to AstroPaper equivalents
- Convert Zola shortcodes to Astro components (if any)
- Preserve markdown content unchanged
- Process all ~70 posts in batch

## Feature Parity

### Code Highlighting

AstroPaper uses Shiki. Configure to match current GitHub themes:

```js
// astro.config.mjs
export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
```

Copy button on code blocks is built into AstroPaper.

### Search

AstroPaper includes fuzzy search using Fuse.js. Searches post titles, descriptions, and content. No additional configuration needed.

### Mermaid Diagrams

Install `remark-mermaid` or use Astro Mermaid component. Diagrams render at build time as SVG for better performance.

```bash
npm install remark-mermaid
```

### Reading Time & Dates

Built into AstroPaper. Matches current settings:
- Show reading time on posts
- Show publication date

### Previous/Next Article Links

Enable in AstroPaper config - supported natively.

### Social Cards (OG Images)

Options:
1. Use existing `social_cards/` images via `ogImage` frontmatter
2. Enable AstroPaper's auto-generation feature

### Dark/Light Theme Toggle

Built into AstroPaper. Respects system preference by default (matching current `default_theme = ""` behaviour).

### Umami Analytics

Add to `src/layouts/Layout.astro` or equivalent:

```html
<script
  defer
  src="https://umami.villegawilcz.com/script.js"
  data-website-id="7bdfa858-bebc-479d-9a1f-bea833a709a8"
></script>
```

## Deployment Configuration

### Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM ghcr.io/static-web-server/static-web-server:2
WORKDIR /
COPY --from=build /app/dist /public
```

Alternative using nginx:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Coolify Configuration

1. **Create Application**
   - Go to Coolify dashboard
   - Create new application
   - Source: GitHub repository `blog-zola`
   - Branch: `main` (after migration merges)

2. **Build Settings**
   - Build Pack: Dockerfile
   - Dockerfile location: `./Dockerfile`

3. **Domain Configuration**
   - Add domain: `perevillega.com`
   - Enable HTTPS (handled by Cloudflare Tunnel)

4. **Auto-Deploy**
   - Enable webhook for automatic deployment on push to `main`

5. **Environment Variables**
   - `CLOUDFLARE_ZONE_ID`: Your Cloudflare zone ID
   - `CLOUDFLARE_API_TOKEN`: API token with cache purge permissions

6. **Post-Deployment Command**
   Add cache purge script (see below)

### Cache Purge on Deploy

Create `scripts/purge-cloudflare-cache.sh`:

```bash
#!/bin/bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

Configure as Coolify post-deployment hook, or add to CI/CD pipeline.

## Cloudflare Configuration

### Tunnel Setup

Your existing Cloudflare Tunnel routes traffic to Coolify. Ensure:
- Public hostname `perevillega.com` points to Coolify container
- Service URL matches the container's internal port

No changes needed if tunnel already routes to the same Coolify instance.

### Cache Rules

Configure in Cloudflare Dashboard: **Caching > Cache Rules**

#### Rule 1: Static Assets (Highest Priority)

- **Name**: Cache Astro Assets 1 Year
- **When**: `(http.request.uri.path contains "/assets/") or (http.request.uri.path contains "/_astro/")`
- **Then**:
  - Cache eligibility: Eligible for cache
  - Edge TTL: Override - 1 year
  - Browser TTL: Override - 1 year

*Astro adds content hashes to these filenames, so long cache is safe.*

#### Rule 2: Images

- **Name**: Cache Images 1 Month
- **When**: `(http.request.uri.path contains "/images/") or (http.request.uri.path contains "/imgposts/") or (http.request.uri.path contains "/icons/")`
- **Then**:
  - Cache eligibility: Eligible for cache
  - Edge TTL: Override - 1 month
  - Browser TTL: Override - 1 month

#### Rule 3: HTML Pages

- **Name**: Cache HTML 4 Hours
- **When**: `(http.request.uri.path eq "/") or (ends_with(http.request.uri.path, "/")) or (ends_with(http.request.uri.path, ".html"))`
- **Then**:
  - Cache eligibility: Eligible for cache
  - Edge TTL: Override - 4 hours
  - Browser TTL: Override - 4 hours

*Purged on deploy anyway, 4 hours is safe fallback.*

#### Rule 4: RSS/Sitemap

- **Name**: Cache Feeds 1 Hour
- **When**: `(http.request.uri.path contains ".xml")`
- **Then**:
  - Cache eligibility: Eligible for cache
  - Edge TTL: Override - 1 hour
  - Browser TTL: Override - 1 hour

### Additional Cloudflare Settings

Navigate to each section in Cloudflare Dashboard:

#### Speed > Optimization > Content Optimization

- **Auto Minify**: Enable for JavaScript, CSS, HTML
- **Early Hints**: Enable (free performance boost)
- **Rocket Loader**: Disable (can break Astro hydration)

#### Caching > Tiered Cache

- Enable **Tiered Cache** (free, improves cache hit ratio)

#### Caching > Configuration

- **Browser Cache TTL**: Respect Existing Headers
- **Crawler Hints**: Enable
- **Always Online**: Enable (serves cached version if origin is down)

#### Rules > Page Rules (Legacy, optional)

If Cache Rules don't work as expected, fallback to Page Rules:
- `perevillega.com/*` → Cache Level: Cache Everything

### Cloudflare API Token for Cache Purge

1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Create Token with:
   - **Permissions**: Zone > Cache Purge > Purge
   - **Zone Resources**: Include > Specific zone > perevillega.com
3. Save token as `CLOUDFLARE_API_TOKEN` in Coolify

### Finding Your Zone ID

1. Go to Cloudflare Dashboard
2. Select `perevillega.com`
3. On the Overview page, scroll down to **API** section
4. Copy **Zone ID**
5. Save as `CLOUDFLARE_ZONE_ID` in Coolify

## Files to Remove (After Migration)

Once migration is complete and verified on `main`:

```
config.toml           # Zola config
templates/            # Zola templates
sass/                 # Zola styles
themes/               # tabi submodule
content/              # Zola content (replaced by src/content)
.gitmodules           # tabi submodule reference
update_theme.sh       # tabi update script
init_submodules.sh    # submodule init script
run.sh                # Zola dev server script (if Zola-specific)
```

## Migration Phases

### Phase 1: Setup

1. Create branch `astro-migration` from `main`
2. Initialise Astro project with AstroPaper template
3. Configure `astro.config.mjs` (syntax highlighting, plugins)
4. Port custom styles from `sass/` and `static/custom.css`
5. Configure Umami analytics

### Phase 2: Content Migration

1. Write migration script
2. Test on 3-5 sample posts
3. Run bulk migration of all ~70 posts
4. Copy static assets (`images/`, `imgposts/`, `icons/`, `files/`)
5. Verify all posts render correctly locally

### Phase 3: Feature Verification

1. Test search functionality
2. Test Mermaid diagrams (if any posts use them)
3. Test code highlighting in both light and dark themes
4. Verify RSS feed generates correctly
5. Test all navigation (tags, categories, pagination)
6. Test previous/next article links
7. Test social card images

### Phase 4: Deployment

1. Update Dockerfile for Astro
2. Configure Coolify application
3. Configure Cloudflare cache rules
4. Set up cache purge on deploy
5. Test deployment on Coolify
6. Verify site works via Cloudflare Tunnel

### Phase 5: Cleanup & Merge

1. Remove all Zola files from branch
2. Final testing on deployed site
3. Merge `astro-migration` to `main`
4. Update Coolify to deploy from `main`
5. Monitor for issues

## Rollback Plan

If issues arise after merging:

1. Revert merge commit on `main`
2. Coolify auto-deploys the Zola version
3. Purge Cloudflare cache
4. Debug issues on `astro-migration` branch
5. Re-merge when fixed
