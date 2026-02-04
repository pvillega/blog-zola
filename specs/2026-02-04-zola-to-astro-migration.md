# Zola to Astro Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the Zola blog to Astro using AstroPaper theme, with Coolify deployment and Cloudflare caching.

**Architecture:** Branch-based migration on `astro-migration` branch. AstroPaper provides the base theme. Automated script converts Zola TOML frontmatter to Astro YAML. Static assets copied to `public/`. Dockerfile builds and serves via static-web-server.

**Tech Stack:** Astro 4.x, AstroPaper theme, TypeScript, Tailwind CSS, Shiki (syntax highlighting), Fuse.js (search), static-web-server (container)

**Design Document:** `docs/plans/2026-02-04-zola-to-astro-migration-design.md`

---

## Phase 1: Project Setup

### Task 1: Create Migration Branch

**Files:**
- None (git operation)

**Step 1: Create and checkout branch**

```bash
git checkout -b astro-migration
```

**Step 2: Verify branch**

Run: `git branch --show-current`
Expected: `astro-migration`

**Step 3: Commit checkpoint**

No commit needed - branch created.

---

### Task 2: Initialise Astro with AstroPaper

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `tailwind.config.cjs`
- Create: `src/` directory structure

**Step 1: Clone AstroPaper template into temporary directory**

```bash
cd /tmp
git clone --depth 1 https://github.com/satnaing/astro-paper.git astro-paper-template
```

**Step 2: Copy AstroPaper files to project (excluding git)**

```bash
cd /Users/pvillega/dev/blogs/blog-zola
cp -r /tmp/astro-paper-template/src ./
cp -r /tmp/astro-paper-template/public ./public-astro
cp /tmp/astro-paper-template/package.json ./
cp /tmp/astro-paper-template/astro.config.ts ./
cp /tmp/astro-paper-template/tsconfig.json ./
cp /tmp/astro-paper-template/tailwind.config.cjs ./
cp /tmp/astro-paper-template/.prettierrc ./
cp /tmp/astro-paper-template/.prettierignore ./
```

**Step 3: Install dependencies**

```bash
npm install
```

**Step 4: Verify Astro runs**

Run: `npm run dev`
Expected: Dev server starts at `http://localhost:4321`

Press Ctrl+C to stop.

**Step 5: Commit**

```bash
git add package.json package-lock.json astro.config.ts tsconfig.json tailwind.config.cjs src/ public-astro/ .prettierrc .prettierignore
git commit -m "feat: initialise Astro project with AstroPaper template"
```

---

### Task 3: Configure Astro for Project

**Files:**
- Modify: `astro.config.ts`
- Modify: `src/config.ts`

**Step 1: Update astro.config.ts with syntax highlighting**

Replace the markdown configuration section:

```typescript
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";

export default defineConfig({
  site: "https://perevillega.com",
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [
      remarkToc,
      [
        remarkCollapse,
        {
          test: "Table of contents",
        },
      ],
    ],
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  scopedStyleStrategy: "where",
  experimental: {
    contentLayer: true,
  },
});
```

**Step 2: Update src/config.ts with site details**

```typescript
export const SITE = {
  website: "https://perevillega.com/",
  author: "Pere Villega",
  profile: "https://perevillega.com/",
  desc: "Pere Villega's blog - Software serves the Business",
  title: "Software serves the Business",
  ogImage: "social_cards/index.png",
  lightAndDarkMode: true,
  postPerIndex: 5,
  postPerPage: 5,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: true,
  editPost: {
    enabled: false,
  },
  dynamicOgImage: true,
};

export const LOCALE = {
  lang: "en",
  langTag: ["en-EN"],
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS = [
  {
    name: "Github",
    href: "https://github.com/pvillega",
    linkTitle: `${SITE.author} on Github`,
    active: true,
  },
  {
    name: "GitLab",
    href: "https://gitlab.com/pvillega",
    linkTitle: `${SITE.author} on GitLab`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/perevillega/",
    linkTitle: `${SITE.author} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:pvillegaw+blog@aracon.com",
    linkTitle: `Send an email to ${SITE.author}`,
    active: true,
  },
  {
    name: "Bluesky",
    href: "https://bsky.app/profile/perevillega.com",
    linkTitle: `${SITE.author} on Bluesky`,
    active: true,
  },
  {
    name: "Mastodon",
    href: "https://mastodon.social/@pvillega",
    linkTitle: `${SITE.author} on Mastodon`,
    active: true,
  },
  {
    name: "StackOverflow",
    href: "https://stackoverflow.com/users/116791/pere-villega",
    linkTitle: `${SITE.author} on StackOverflow`,
    active: true,
  },
] as const;
```

**Step 3: Verify configuration**

Run: `npm run dev`
Expected: Site loads with updated title "Software serves the Business"

**Step 4: Commit**

```bash
git add astro.config.ts src/config.ts
git commit -m "feat: configure Astro for perevillega.com"
```

---

### Task 4: Add Umami Analytics

**Files:**
- Modify: `src/layouts/Layout.astro`

**Step 1: Add Umami script to head**

In `src/layouts/Layout.astro`, find the `<head>` section and add before `</head>`:

```astro
<!-- Umami Analytics -->
<script
  defer
  src="https://umami.villegawilcz.com/script.js"
  data-website-id="7bdfa858-bebc-479d-9a1f-bea833a709a8"
></script>
```

**Step 2: Verify script appears in HTML**

Run: `npm run build && grep -r "umami" dist/`
Expected: Script tag found in HTML files

**Step 3: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: add Umami analytics"
```

---

## Phase 2: Content Migration

### Task 5: Write Migration Script

**Files:**
- Create: `scripts/migrate-content.ts`
- Modify: `package.json` (add script)

**Step 1: Create migration script**

Create `scripts/migrate-content.ts`:

```typescript
import * as fs from "fs";
import * as path from "path";
import * as toml from "@iarna/toml";

const ZOLA_CONTENT_DIR = "./content/posts";
const ASTRO_CONTENT_DIR = "./src/content/blog";

interface ZolaFrontmatter {
  title?: string;
  date?: string;
  updated?: string;
  draft?: boolean;
  description?: string;
  taxonomies?: {
    tags?: string[];
    categories?: string[];
  };
  extra?: {
    social_media_card?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AstroFrontmatter {
  title: string;
  pubDatetime: string;
  modDatetime?: string;
  description?: string;
  tags?: string[];
  ogImage?: string;
  draft: boolean;
  author?: string;
}

function parseZolaFrontmatter(content: string): {
  frontmatter: ZolaFrontmatter;
  body: string;
} {
  const match = content.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Could not parse Zola frontmatter");
  }

  const frontmatterStr = match[1];
  const body = match[2];

  const frontmatter = toml.parse(frontmatterStr) as ZolaFrontmatter;
  return { frontmatter, body };
}

function convertToAstroFrontmatter(
  zola: ZolaFrontmatter
): AstroFrontmatter {
  const astro: AstroFrontmatter = {
    title: zola.title || "Untitled",
    pubDatetime: zola.date || new Date().toISOString().split("T")[0],
    draft: zola.draft || false,
    author: "Pere Villega",
  };

  if (zola.updated) {
    astro.modDatetime = zola.updated;
  }

  if (zola.description) {
    astro.description = zola.description;
  }

  if (zola.taxonomies?.tags && zola.taxonomies.tags.length > 0) {
    astro.tags = zola.taxonomies.tags;
  }

  if (zola.extra?.social_media_card) {
    astro.ogImage = zola.extra.social_media_card;
  }

  return astro;
}

function toYaml(obj: AstroFrontmatter): string {
  const lines: string[] = [];

  lines.push(`title: "${obj.title.replace(/"/g, '\\"')}"`);
  lines.push(`pubDatetime: ${obj.pubDatetime}`);

  if (obj.modDatetime) {
    lines.push(`modDatetime: ${obj.modDatetime}`);
  }

  if (obj.description) {
    lines.push(`description: "${obj.description.replace(/"/g, '\\"')}"`);
  }

  if (obj.author) {
    lines.push(`author: "${obj.author}"`);
  }

  if (obj.tags && obj.tags.length > 0) {
    lines.push(`tags:`);
    obj.tags.forEach((tag) => lines.push(`  - ${tag}`));
  }

  if (obj.ogImage) {
    lines.push(`ogImage: "${obj.ogImage}"`);
  }

  lines.push(`draft: ${obj.draft}`);

  return lines.join("\n");
}

function migrateFile(inputPath: string, outputPath: string): void {
  const content = fs.readFileSync(inputPath, "utf-8");

  try {
    const { frontmatter, body } = parseZolaFrontmatter(content);
    const astroFrontmatter = convertToAstroFrontmatter(frontmatter);
    const yaml = toYaml(astroFrontmatter);

    const newContent = `---\n${yaml}\n---\n${body}`;

    fs.writeFileSync(outputPath, newContent, "utf-8");
    console.log(`Migrated: ${path.basename(inputPath)}`);
  } catch (error) {
    console.error(`Error migrating ${inputPath}:`, error);
  }
}

function main(): void {
  // Ensure output directory exists
  if (!fs.existsSync(ASTRO_CONTENT_DIR)) {
    fs.mkdirSync(ASTRO_CONTENT_DIR, { recursive: true });
  }

  // Get all markdown files (excluding _index.md)
  const files = fs
    .readdirSync(ZOLA_CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && f !== "_index.md");

  console.log(`Found ${files.length} posts to migrate\n`);

  files.forEach((file) => {
    const inputPath = path.join(ZOLA_CONTENT_DIR, file);
    const outputPath = path.join(ASTRO_CONTENT_DIR, file);
    migrateFile(inputPath, outputPath);
  });

  console.log(`\nMigration complete! ${files.length} posts migrated.`);
}

main();
```

**Step 2: Install TOML parser dependency**

```bash
npm install @iarna/toml
npm install -D @types/node tsx
```

**Step 3: Add migration script to package.json**

Add to `scripts` section:

```json
"migrate": "tsx scripts/migrate-content.ts"
```

**Step 4: Verify script compiles**

Run: `npx tsx --version`
Expected: Version number displayed

**Step 5: Commit**

```bash
git add scripts/migrate-content.ts package.json package-lock.json
git commit -m "feat: add content migration script"
```

---

### Task 6: Test Migration on Sample Posts

**Files:**
- Create: `src/content/blog/` (via script)

**Step 1: Run migration script**

```bash
npm run migrate
```

Expected output:
```
Found 70+ posts to migrate

Migrated: 2023-11-10-understanding-data-mesh.md
Migrated: 2024-12-27-durable-computing-hype.md
...

Migration complete! XX posts migrated.
```

**Step 2: Verify frontmatter conversion**

Check a migrated file:
```bash
head -20 src/content/blog/2023-11-10-understanding-data-mesh.md
```

Expected format:
```yaml
---
title: "Understanding Data Mesh"
pubDatetime: 2023-11-10
author: "Pere Villega"
tags:
  - architecture
  - data
draft: false
---
```

**Step 3: Verify Astro can read content**

Run: `npm run dev`
Navigate to `http://localhost:4321/posts/`
Expected: Posts listing shows migrated posts

**Step 4: Commit**

```bash
git add src/content/blog/
git commit -m "feat: migrate all blog posts from Zola"
```

---

### Task 7: Copy Static Assets

**Files:**
- Copy: `static/images/` -> `public/images/`
- Copy: `static/imgposts/` -> `public/imgposts/`
- Copy: `static/icons/` -> `public/icons/`
- Copy: `static/files/` -> `public/files/`
- Copy: `content/social_cards/` -> `public/social_cards/`

**Step 1: Copy static assets**

```bash
cp -r static/images public/
cp -r static/imgposts public/
cp -r static/icons public/
cp -r static/files public/
cp -r content/social_cards public/
```

**Step 2: Copy favicon**

```bash
cp static/icons/favicon.ico public/
```

**Step 3: Merge with AstroPaper public assets**

```bash
cp -r public-astro/* public/
rm -rf public-astro
```

**Step 4: Verify assets accessible**

Run: `npm run dev`
Navigate to `http://localhost:4321/images/avatar.webp`
Expected: Avatar image displays

**Step 5: Commit**

```bash
git add public/
git commit -m "feat: copy static assets from Zola"
```

---

## Phase 3: Feature Configuration

### Task 8: Configure Homepage

**Files:**
- Modify: `src/pages/index.astro`

**Step 1: Update homepage with bio**

In `src/pages/index.astro`, update the intro section to match current site:

```astro
---
import { getCollection } from "astro:content";
import Layout from "@layouts/Layout.astro";
import Header from "@components/Header.astro";
import Footer from "@components/Footer.astro";
import LinkButton from "@components/LinkButton.astro";
import Hr from "@components/Hr.astro";
import Card from "@components/Card.astro";
import Socials from "@components/Socials.astro";
import getSortedPosts from "@utils/getSortedPosts";
import { SITE, SOCIALS } from "@config";

const posts = await getCollection("blog");
const sortedPosts = getSortedPosts(posts);
const featuredPosts = sortedPosts.filter(({ data }) => data.featured);
const recentPosts = sortedPosts.filter(({ data }) => !data.featured);

const socialCount = SOCIALS.filter(social => social.active).length;
---

<Layout>
  <Header />
  <main id="main-content">
    <section id="hero">
      <h1>Hi! I'm Pere Villega</h1>
      <a
        target="_blank"
        href="/rss.xml"
        class="rss-link"
        aria-label="rss feed"
        title="RSS Feed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="rss-icon"
          ><path
            d="M19 20.001C19 11.729 12.271 5 4 5v2c7.168 0 13 5.832 13 13.001h2z"
          ></path><path
            d="M12 20.001h2C14 14.486 9.514 10 4 10v2c4.411 0 8 3.589 8 8.001z"
          ></path><circle cx="6" cy="18" r="2"></circle>
        </svg>
        <span class="sr-only">RSS Feed</span>
      </a>

      <p>
        I'm a principal engineer (currently freelancing) with over 20 years of industry experience.
        I write about software engineering, and how to build better solutions for your business.
        I live in Switzerland, but I've been working remotely or hybrid since 2014.
      </p>
      {
        socialCount > 0 && (
          <div class="social-wrapper">
            <div class="social-links">Social Links:</div>
            <Socials />
          </div>
        )
      }
    </section>

    <Hr />

    {
      featuredPosts.length > 0 && (
        <>
          <section id="featured">
            <h2>Featured</h2>
            <ul>
              {featuredPosts.map(({ data, slug }) => (
                <Card
                  href={`/posts/${slug}/`}
                  frontmatter={data}
                  secHeading={false}
                />
              ))}
            </ul>
          </section>
          {recentPosts.length > 0 && <Hr />}
        </>
      )
    }

    {
      recentPosts.length > 0 && (
        <section id="recent-posts">
          <h2>Recent Posts</h2>
          <ul>
            {recentPosts.slice(0, SITE.postPerIndex).map(
              ({ data, slug }) => (
                <Card
                  href={`/posts/${slug}/`}
                  frontmatter={data}
                  secHeading={false}
                />
              )
            )}
          </ul>
        </section>
      )
    }

    <div class="all-posts-btn-wrapper">
      <LinkButton href="/posts/">
        All Posts
        <svg xmlns="http://www.w3.org/2000/svg"
          ><path
            d="m11.293 17.293 1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586z"
          ></path>
        </svg>
      </LinkButton>
    </div>
  </main>

  <Footer />
</Layout>
```

**Step 2: Verify homepage**

Run: `npm run dev`
Navigate to `http://localhost:4321/`
Expected: Homepage shows bio and recent posts

**Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: configure homepage with bio"
```

---

### Task 9: Add Mermaid Support

**Files:**
- Create: `src/components/Mermaid.astro`
- Modify: `astro.config.ts`

**Step 1: Install Mermaid**

```bash
npm install mermaid
```

**Step 2: Create Mermaid component**

Create `src/components/Mermaid.astro`:

```astro
---
interface Props {
  chart: string;
}

const { chart } = Astro.props;
---

<div class="mermaid">
  <Fragment set:html={chart} />
</div>

<script>
  import mermaid from "mermaid";

  mermaid.initialize({
    startOnLoad: true,
    theme: document.documentElement.dataset.theme === "dark" ? "dark" : "default",
  });

  // Re-render on theme change
  const observer = new MutationObserver(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.dataset.theme === "dark" ? "dark" : "default",
    });
    mermaid.run();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
</script>

<style>
  .mermaid {
    display: flex;
    justify-content: center;
    margin: 1.5rem 0;
  }
</style>
```

**Step 3: Verify Mermaid renders**

Create a test post with Mermaid diagram and verify it renders.

**Step 4: Commit**

```bash
git add src/components/Mermaid.astro package.json package-lock.json
git commit -m "feat: add Mermaid diagram support"
```

---

### Task 10: Verify All Features

**Files:**
- None (testing only)

**Step 1: Test search**

Run: `npm run dev`
Navigate to `http://localhost:4321/search/`
Type a search term
Expected: Results appear

**Step 2: Test dark/light mode**

Click theme toggle
Expected: Theme switches smoothly

**Step 3: Test code highlighting**

Navigate to a post with code blocks
Expected: Syntax highlighted with GitHub theme

**Step 4: Test RSS feed**

Navigate to `http://localhost:4321/rss.xml`
Expected: Valid RSS/Atom feed

**Step 5: Test tags**

Navigate to `http://localhost:4321/tags/`
Expected: Tags listing with post counts

**Step 6: Document any issues**

If any features don't work, note them for fixing before merge.

---

## Phase 4: Deployment Setup

### Task 11: Update Dockerfile

**Files:**
- Modify: `Dockerfile`

**Step 1: Replace Dockerfile content**

```dockerfile
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
FROM ghcr.io/static-web-server/static-web-server:2
WORKDIR /
COPY --from=build /app/dist /public

# Expose port 80
EXPOSE 80
```

**Step 2: Test Docker build locally**

```bash
docker build -t blog-astro .
docker run -p 8080:80 blog-astro
```

Navigate to `http://localhost:8080`
Expected: Site loads correctly

Stop container with Ctrl+C.

**Step 3: Commit**

```bash
git add Dockerfile
git commit -m "feat: update Dockerfile for Astro build"
```

---

### Task 12: Create Cache Purge Script

**Files:**
- Create: `scripts/purge-cloudflare-cache.sh`

**Step 1: Create purge script**

Create `scripts/purge-cloudflare-cache.sh`:

```bash
#!/bin/bash

# Purge Cloudflare cache after deployment
# Requires CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN environment variables

set -e

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "Error: CLOUDFLARE_ZONE_ID not set"
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Error: CLOUDFLARE_API_TOKEN not set"
  exit 1
fi

echo "Purging Cloudflare cache for zone ${CLOUDFLARE_ZONE_ID}..."

response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

success=$(echo "$response" | grep -o '"success":true')

if [ -n "$success" ]; then
  echo "Cache purged successfully!"
else
  echo "Failed to purge cache:"
  echo "$response"
  exit 1
fi
```

**Step 2: Make script executable**

```bash
chmod +x scripts/purge-cloudflare-cache.sh
```

**Step 3: Commit**

```bash
git add scripts/purge-cloudflare-cache.sh
git commit -m "feat: add Cloudflare cache purge script"
```

---

### Task 13: Create Deployment Documentation

**Files:**
- Create: `docs/DEPLOYMENT.md`

**Step 1: Create deployment guide**

Create `docs/DEPLOYMENT.md`:

```markdown
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
./scripts/purge-cloudflare-cache.sh
```

### Auto-Deploy

Enable webhook for automatic deployment when pushing to `main`.

## Cloudflare Configuration

### Tunnel Setup

Ensure your Cloudflare Tunnel routes `perevillega.com` to the Coolify container.

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
```

**Step 2: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: add deployment guide for Coolify and Cloudflare"
```

---

## Phase 5: Cleanup and Merge

### Task 14: Remove Zola Files

**Files:**
- Delete: `config.toml`
- Delete: `templates/`
- Delete: `sass/`
- Delete: `themes/`
- Delete: `content/` (Zola version)
- Delete: `.gitmodules`
- Delete: `update_theme.sh`
- Delete: `init_submodules.sh`

**Step 1: Remove Zola configuration**

```bash
rm config.toml
rm -rf templates/
rm -rf sass/
rm -rf themes/
rm -rf content/
rm .gitmodules
rm update_theme.sh
rm init_submodules.sh
```

**Step 2: Update .gitignore**

Ensure `.gitignore` includes:

```
node_modules/
dist/
.astro/
```

**Step 3: Verify build still works**

```bash
npm run build
```

Expected: Build completes successfully

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Zola files after migration"
```

---

### Task 15: Final Testing

**Files:**
- None (testing only)

**Step 1: Full local test**

```bash
npm run build
npm run preview
```

Navigate to `http://localhost:4321` and test:
- [ ] Homepage loads with bio
- [ ] Recent posts display
- [ ] Individual post pages work
- [ ] Tags page works
- [ ] Search works
- [ ] Dark/light mode toggle works
- [ ] Code highlighting works in both themes
- [ ] RSS feed is valid
- [ ] All images load
- [ ] Social links work

**Step 2: Docker test**

```bash
docker build -t blog-astro .
docker run -p 8080:80 blog-astro
```

Test same checklist at `http://localhost:8080`

**Step 3: Document any remaining issues**

Fix any issues found before merging.

---

### Task 16: Merge to Main

**Files:**
- None (git operation)

**Step 1: Push migration branch**

```bash
git push -u origin astro-migration
```

**Step 2: Create pull request (optional)**

If you want to review changes:
```bash
gh pr create --title "feat: migrate from Zola to Astro" --body "Complete migration of blog from Zola to Astro using AstroPaper theme"
```

**Step 3: Merge to main**

```bash
git checkout main
git merge astro-migration
git push origin main
```

**Step 4: Configure Coolify**

1. Update Coolify application to deploy from `main` branch
2. Add environment variables for Cloudflare
3. Configure post-deployment hook
4. Trigger manual deploy

**Step 5: Configure Cloudflare**

Apply cache rules as documented in `docs/DEPLOYMENT.md`

**Step 6: Verify production site**

Navigate to `https://perevillega.com` and verify everything works.

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Project setup with AstroPaper |
| 2 | 5-7 | Content migration script and execution |
| 3 | 8-10 | Feature configuration and verification |
| 4 | 11-13 | Deployment setup (Dockerfile, scripts, docs) |
| 5 | 14-16 | Cleanup and merge to main |

Total: 16 tasks across 5 phases.
