# Modernize perevillega.com: Zola → Astro Migration

## Summary
Migrate personal blog from Zola to Astro + TailwindCSS, adding freelancer services, booking, and payment integration. Minimalist-modern design (designjoy-inspired) with conversion focus.

---

## Decisions Made

| Area | Choice | Notes |
|------|--------|-------|
| Theme | AstroWind (free) | Most comprehensive free Astro theme |
| Booking | Cal.com (free) | Syncs with macOS Calendar + Zoom |
| Payments | Stripe Checkout | Mixed B2B/B2C, Spanish VAT-registered |
| Blog Series | Individual posts + compiled series | Plus future PDF export |
| Services | Time-based + deliverable + custom | Like designjoy/saasrock hybrid |
| Projects | Hybrid grid + case studies | Grid overview, detailed for key projects |
| Style | Minimalist-modern + conversion CTAs | Whitespace, clean, strategic CTAs |

---

## Site Architecture

```
perevillega.com/
├── /                     → Hero + services + social proof + CTA
├── /blog/                → Posts feed with filters
├── /blog/[slug]/         → Individual posts
├── /series/              → Series index
├── /series/[slug]/       → Series with TOC + parts
├── /services/            → Service packages
├── /services/[slug]/     → Service detail
├── /projects/            → Portfolio grid
├── /projects/[slug]/     → Case studies
├── /about/               → About + credentials
├── /contact/             → Cal.com + form
└── /book/                → Direct Cal.com embed
```

---

## Implementation Phases

### Phase 1: Foundation Setup
1. Initialize new Astro project with AstroWind template
2. Configure TailwindCSS and customize color palette
3. Set up GitHub Actions for deployment to GitHub Pages
4. Configure domain (CNAME for perevillega.com)
5. Set up Umami analytics (preserve existing tracking)

**Files to create:**
- `astro.config.mjs`
- `tailwind.config.mjs`
- `.github/workflows/deploy.yml`
- `public/CNAME`

### Phase 2: Content Collections Setup
1. Define content schemas for posts, series, services, projects
2. Configure Astro content collections
3. Set up frontmatter validation

**Files to create:**
- `src/content/config.ts`
- `src/content/posts/` (directory)
- `src/content/series/` (directory)
- `src/content/services/` (directory)
- `src/content/projects/` (directory)

### Phase 3: Content Migration
1. Write migration script (TOML → YAML frontmatter)
2. Migrate 73 blog posts from Zola
3. Preserve categories, tags, dates
4. Add series metadata to related posts
5. Migrate static assets (icons, images, avatar)
6. Validate all migrated content

**Migration script location:**
- `scripts/migrate-content.ts`

**Source content:**
- `content/posts/*.md` (73 files)
- `static/icons/*` (29 files)
- `static/images/avatar.webp`

### Phase 4: Core Pages
1. **Home page**: Hero with value prop, featured services, testimonials placeholder, blog highlights, booking CTA
2. **Blog index**: Posts feed with category/tag filters, search
3. **Blog post**: Reading time, prev/next nav, series badge, related posts
4. **About page**: Bio, credentials, tech stack expertise

**Files to create:**
- `src/pages/index.astro`
- `src/pages/blog/index.astro`
- `src/pages/blog/[slug].astro`
- `src/pages/about.astro`

### Phase 5: Series System
1. Series index page listing all series
2. Series detail page with TOC and linked posts
3. Series navigation component (prev/next in series)
4. "Part of Series X" banner on posts

**Files to create:**
- `src/pages/series/index.astro`
- `src/pages/series/[slug].astro`
- `src/components/SeriesBanner.astro`
- `src/components/SeriesNav.astro`

### Phase 6: Services & Pricing
1. Services overview page with package cards
2. Individual service detail pages
3. Stripe Checkout link integration (no API, just links)
4. Pricing display components

**Files to create:**
- `src/pages/services/index.astro`
- `src/pages/services/[slug].astro`
- `src/components/PricingCard.astro`
- `src/components/ServiceFeatures.astro`

### Phase 7: Projects Portfolio
1. Projects grid page with filters
2. Project card component
3. Case study template for detailed projects

**Files to create:**
- `src/pages/projects/index.astro`
- `src/pages/projects/[slug].astro`
- `src/components/ProjectCard.astro`
- `src/components/ProjectFilters.astro`

### Phase 8: Booking & Contact
1. Contact page with Cal.com embed
2. Dedicated booking page
3. Contact form (optional, for non-booking inquiries)
4. Configure Cal.com → Zoom integration

**Files to create:**
- `src/pages/contact.astro`
- `src/pages/book.astro`
- `src/components/CalEmbed.astro`

### Phase 9: Conversion Elements
1. Sticky header with "Book a Call" CTA
2. Footer with newsletter signup placeholder
3. Social proof section (testimonials, client logos)
4. Featured posts/services on homepage

**Files to modify:**
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/Testimonials.astro`

### Phase 10: SEO & Performance
1. Configure sitemap generation
2. Set up RSS feed
3. Add Open Graph / social cards
4. Implement Pagefind static search
5. Test PageSpeed scores

### Phase 11: Testing & Launch
1. Test all pages and navigation
2. Verify mobile responsiveness
3. Test Cal.com booking flow
4. Test Stripe Checkout links
5. Verify RSS feed
6. Check analytics tracking
7. Final deployment to GitHub Pages

---

## Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Framework | Astro 5.x |
| Styling | TailwindCSS 4.x |
| Base Theme | AstroWind |
| Content | Markdown/MDX |
| Search | Pagefind |
| Analytics | Umami (existing) |
| Hosting | GitHub Pages |
| Booking | Cal.com |
| Payments | Stripe Checkout |
| Video | Zoom (via Cal.com) |

---

## Content Structure

```yaml
# Post frontmatter
---
title: "Post Title"
date: 2024-12-27
categories: ["scala"]
tags: ["functional", "programming"]
series: "scala-deep-dive"  # optional
seriesOrder: 3             # optional
draft: false
---

# Service frontmatter
---
title: "Architecture Review"
type: "deliverable"
price:
  amount: 500
  currency: "EUR"
duration: "1 week"
includes: [...]
stripeLink: "https://buy.stripe.com/xxx"
featured: true
order: 1
---

# Project frontmatter
---
title: "Project Name"
description: "Brief description"
image: "/images/projects/project.png"
tags: ["Scala", "AWS"]
featured: true
caseStudy: true  # if detailed page needed
link: "https://example.com"
---
```

---

## External Setup Required

### Cal.com (before launch)
1. Create Cal.com account
2. Connect macOS Calendar via CalDAV
3. Connect Zoom account
4. Create event types for consultations
5. Get embed code for website

### Stripe (before launch)
1. Create/configure Stripe account
2. Set up tax settings for Spanish VAT
3. Create Products for each service
4. Generate Checkout links for each product
5. Configure success/cancel redirect URLs

---

## Estimated Implementation Order

1. Foundation + deployment pipeline
2. Content collections + migration script
3. Blog pages (index + posts)
4. Series system
5. About page
6. Services + pricing
7. Projects portfolio
8. Contact + booking
9. Conversion elements + polish
10. SEO + search
11. Testing + launch

---

## Success Criteria

- [ ] All 73 blog posts migrated and accessible
- [ ] Series pages working with TOC
- [ ] Services pages with Stripe Checkout integration
- [ ] Cal.com booking working on /book and /contact
- [ ] Projects portfolio displaying correctly
- [ ] Mobile responsive on all pages
- [ ] PageSpeed score > 90
- [ ] RSS feed generating correctly
- [ ] Search functionality working
- [ ] Analytics tracking verified
