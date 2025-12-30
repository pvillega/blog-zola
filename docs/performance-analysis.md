# Performance Analysis & PageSpeed Insights

## Overview

This document outlines the performance optimizations currently implemented in this Astro-based static site, expected PageSpeed scores, testing methodology, and recommendations for further optimization.

## Current Optimizations

### 1. Build-Time Optimizations

#### Static Site Generation (SSG)
- **Output Mode**: `static` (astro.config.ts)
- **Benefit**: All pages are pre-rendered at build time, eliminating server response time and providing instant content delivery
- **Impact**: Extremely fast Time to First Byte (TTFB)

#### Asset Compression (`astro-compress`)
- **CSS Compression**: Enabled
- **JavaScript Compression**: Enabled with minification
- **HTML Compression**: Enabled with html-minifier-terser
  - Note: `removeAttributeQuotes: false` to maintain compatibility
- **SVG/Image Compression**: Disabled (handled separately)
- **Expected Reduction**: 40-60% reduction in asset sizes

### 2. Image Optimization

#### Astro's Built-in Image Optimization
- **Sharp Integration**: Sharp 0.34.3 for fast, high-quality image processing
- **Unpic**: Universal image CDN support (v4.1.3)
- **Lazy Loading**: Automatic lazy loading for markdown images via `lazyImagesRehypePlugin`
- **External Domains**: Configured for cdn.pixabay.com
- **Format Conversion**: Automatic WebP/AVIF generation for modern browsers
- **Responsive Images**: Automatic srcset generation for different screen sizes

### 3. Code Splitting & Bundling

#### Astro's Default Behavior
- **Automatic Code Splitting**: Each page only loads what it needs
- **Component Islands**: Interactive components are isolated and loaded independently
- **CSS Scoping**: Component-specific CSS reduces unused styles
- **Tree Shaking**: Vite automatically removes unused code

### 4. Font Optimization

#### Font Loading Strategy
- **Font Package**: @fontsource-variable/inter (v5.2.6)
- **Variable Fonts**: Reduces number of font files needed
- **Self-hosted**: Eliminates external font requests
- **Recommendation**: Verify font-display strategy is set to 'swap' or 'optional'

### 5. Third-Party Script Optimization

#### Partytown Integration
- **Status**: Configured but currently disabled (`hasExternalScripts = false`)
- **Purpose**: When enabled, offloads third-party scripts to web workers
- **Use Case**: Analytics scripts (Umami is configured)
- **Note**: Currently minimal third-party script impact

#### Analytics
- **Umami Analytics**: Lightweight, privacy-focused analytics
- **Impact**: Minimal performance overhead compared to Google Analytics
- **Configuration**: ID 7bdfa858-bebc-479d-9a1f-bea833a709a8

### 6. CSS Optimization

#### Tailwind CSS Configuration
- **PurgeCSS**: Automatic removal of unused CSS via content scanning
- **Content Paths**: `./src/**/*.{astro,html,js,jsx,json,md,mdx,svelte,ts,tsx,vue}`
- **Typography Plugin**: Only included where needed
- **Dark Mode**: Class-based (no performance impact)
- **JIT Mode**: Just-in-Time compilation (Tailwind default)

### 7. Framework-Specific Optimizations

#### Astro View Transitions
- **Status**: Enabled via `ClientRouter`
- **Fallback**: 'swap' strategy
- **Benefit**: SPA-like navigation without full page reloads
- **Trade-off**: Adds ~5KB to initial bundle

#### Markdown Processing
- **MDX Support**: Enabled for interactive content
- **Reading Time Plugin**: Server-side calculation (no client overhead)
- **Responsive Tables Plugin**: Automatic overflow handling for mobile
- **Lazy Images Plugin**: Automatic loading="lazy" attribute

### 8. Sitemap & SEO

#### Sitemap Generation
- **Integration**: @astrojs/sitemap
- **Purpose**: Improves SEO crawlability
- **Performance**: No client-side impact (build-time only)

#### SEO Metadata
- **Package**: @astrolib/seo
- **OpenGraph**: Configured with optimized images (1200x628)
- **Twitter Cards**: summary_large_image format
- **Robots**: Indexing enabled for public content

### 9. Missing Optimizations

#### Image Compression in astro-compress
- **Status**: Currently disabled (`Image: false`)
- **Recommendation**: Consider enabling for additional image optimization
- **Note**: May conflict with Astro's built-in image optimization

#### SVG Optimization
- **Status**: Currently disabled (`SVG: false`)
- **Recommendation**: Enable SVGO compression for icon assets
- **Icons Used**: Tabler icons and Flat Color Icons

## Expected PageSpeed Insights Scores

### Desktop Performance
- **Expected Score**: 95-100
- **Rationale**:
  - Static pre-rendered HTML
  - Minimal JavaScript (Astro framework)
  - Optimized assets with compression
  - No render-blocking resources (async scripts)

### Mobile Performance
- **Expected Score**: 90-98
- **Rationale**:
  - Same optimizations as desktop
  - Lazy loading for images
  - Responsive design (no unnecessary downloads)
  - Potential slight reduction due to CPU simulation

### Accessibility
- **Expected Score**: 90-100
- **Rationale**:
  - Semantic HTML from Astro
  - Proper heading hierarchy in templates
  - Alt text support for images
  - Responsive tables with overflow handling

### Best Practices
- **Expected Score**: 95-100
- **Rationale**:
  - HTTPS deployment
  - Modern image formats (WebP/AVIF)
  - Secure analytics implementation
  - No console errors or deprecated APIs

### SEO
- **Expected Score**: 95-100
- **Rationale**:
  - Complete metadata configuration
  - Sitemap generation
  - Semantic HTML
  - Mobile-friendly design
  - Proper robots.txt directives

## How to Run PageSpeed Tests

### After Deployment

#### 1. Google PageSpeed Insights
```bash
# Visit the web interface
https://pagespeed.web.dev/

# Or use the PSI API
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://perevillega.com&strategy=mobile"
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://perevillega.com&strategy=desktop"
```

#### 2. Lighthouse CLI
```bash
# Install globally
npm install -g @lhci/cli lighthouse

# Run against production
lighthouse https://perevillega.com --output html --output-path ./lighthouse-report.html

# Run with specific categories
lighthouse https://perevillega.com --only-categories=performance,accessibility,best-practices,seo
```

#### 3. Chrome DevTools Lighthouse
1. Open Chrome DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select categories to audit
4. Choose "Mobile" or "Desktop"
5. Click "Analyze page load"

#### 4. WebPageTest
```bash
# Visit
https://www.webpagetest.org/

# Test multiple locations and connection speeds
# Provides detailed waterfall charts and filmstrip view
```

### Recommended Test Pages

Test these page types to ensure comprehensive performance coverage:
- **Homepage**: https://perevillega.com/
- **Blog List**: https://perevillega.com/blog
- **Blog Post**: https://perevillega.com/blog/[any-post-slug]
- **Category Page**: https://perevillega.com/category/[category]
- **Tag Page**: https://perevillega.com/tag/[tag]

### Testing Frequency
- **Initial Deployment**: Test all page types
- **After Major Changes**: Re-test affected pages
- **Monthly**: Spot-check homepage and one blog post
- **Quarterly**: Full audit of all page types

## Performance Monitoring

### Recommended Tools

#### 1. Real User Monitoring (RUM)
- **Current Setup**: Umami analytics (basic visitor tracking)
- **Upgrade Option**: Consider Umami + custom performance marks
- **Alternative**: Google Analytics 4 with Web Vitals reporting

#### 2. Synthetic Monitoring
- **Tool**: Lighthouse CI in GitHub Actions
- **Frequency**: On every deployment
- **Budget**: Set performance budgets to prevent regressions

#### 3. Core Web Vitals Monitoring
Monitor these key metrics:
- **LCP (Largest Contentful Paint)**: Target < 2.5s
- **FID (First Input Delay)**: Target < 100ms (or INP < 200ms)
- **CLS (Cumulative Layout Shift)**: Target < 0.1

## Potential Performance Concerns

### 1. Font Loading
**Issue**: Font loading strategy not explicitly defined
**Current Impact**: Low (self-hosted fonts)
**Recommendation**:
```css
/* Add to CustomStyles.astro or global CSS */
@font-face {
  font-family: 'Inter Variable';
  font-display: swap; /* or 'optional' for even better performance */
  /* ... other font properties */
}
```

### 2. View Transitions Bundle Size
**Issue**: ClientRouter adds ~5KB to bundle
**Current Impact**: Minimal (good UX trade-off)
**Alternative**: Can be disabled by commenting lines 16 and 40 in Layout.astro
**Recommendation**: Keep enabled unless performance issues arise

### 3. Icon Loading
**Issue**: Large icon sets included
**Current Config**:
- Tabler: All icons (`['*']`)
- Flat Color Icons: 9 specific icons

**Recommendation**: Review which Tabler icons are actually used and limit imports
```typescript
// Example optimization in astro.config.ts
icon({
  include: {
    tabler: ['arrow-right', 'menu', 'x', /* only used icons */],
    'flat-color-icons': [/* current list is already optimized */],
  },
}),
```

### 4. External Image Domain
**Issue**: Loading images from cdn.pixabay.com
**Current Impact**: Depends on usage frequency
**Recommendation**:
- Download and self-host frequently used images
- Leverage Astro's image optimization for all images
- Remove external domain if no longer needed

### 5. Analytics Script Loading
**Issue**: Third-party script from external domain
**Current Impact**: Low (Umami is lightweight)
**Optimization**: Consider enabling Partytown to offload to web worker
```typescript
// In astro.config.ts, change:
const hasExternalScripts = true; // Enable Partytown for analytics
```

## Recommendations for Further Optimization

### High Priority

1. **Enable SVG Compression**
   ```typescript
   // astro.config.ts
   compress({
     SVG: true, // Enable SVG optimization
     // ... rest of config
   })
   ```

2. **Optimize Icon Imports**
   - Audit actual icon usage
   - Replace `tabler: ['*']` with specific icon list
   - Potential savings: 50-100KB

3. **Implement Performance Budget**
   - Create `.lighthouserc.json`
   - Set budgets for bundle sizes
   - Add to CI/CD pipeline

4. **Add Resource Hints**
   ```html
   <!-- Add to Layout.astro head -->
   <link rel="preconnect" href="https://umami.villegawilcz.com">
   <link rel="dns-prefetch" href="https://umami.villegawilcz.com">
   ```

### Medium Priority

5. **Consider Enabling Partytown**
   - Move analytics to web worker
   - Reduces main thread blocking
   - Improves interactive metrics

6. **Audit Font Subset Needs**
   - Inter Variable includes all weights
   - Consider subsetting if only using specific weights
   - Potential savings: 20-40KB

7. **Implement Critical CSS**
   - Inline critical CSS for above-fold content
   - Defer non-critical styles
   - Reduces render-blocking

8. **Add Service Worker**
   - Cache static assets
   - Offline functionality
   - Faster repeat visits

### Low Priority

9. **Review MDX Usage**
   - MDX adds bundle overhead
   - Consider if interactive components are needed in all posts
   - Use static markdown where possible

10. **Evaluate View Transitions**
    - Measure actual UX benefit
    - Consider disabling if not providing value
    - Saves ~5KB bundle size

## Performance Budget (Recommended)

Create `.lighthouserc.json` in project root:

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## GitHub Actions Integration

Example workflow for automated performance testing:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npx @lhci/cli@0.13.x autorun
```

## Monitoring Checklist

After deployment, verify:

- [ ] All PageSpeed Insights scores > 90
- [ ] LCP < 2.5s on mobile
- [ ] No layout shifts (CLS < 0.1)
- [ ] All images using modern formats (WebP/AVIF)
- [ ] No render-blocking resources
- [ ] Font display strategy set to 'swap' or 'optional'
- [ ] Analytics script loading asynchronously
- [ ] Sitemap accessible at /sitemap-index.xml
- [ ] robots.txt configured correctly
- [ ] All critical pages tested individually

## Conclusion

This Astro-based static site is well-optimized out of the box with:
- Static pre-rendering for instant TTFB
- Automatic code splitting and tree shaking
- Image optimization with lazy loading
- Asset compression (CSS, JS, HTML)
- Minimal third-party script overhead

Expected PageSpeed scores range from 90-100 across all metrics. The main opportunities for further optimization include enabling SVG compression, optimizing icon imports, and implementing performance budgets in CI/CD.

After deployment, follow the testing methodology outlined above to validate performance and identify any environment-specific issues.
