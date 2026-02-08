# Series Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Series" feature to group related blog posts into multi-part series, with dedicated listing pages, in-post navigation, and conditional header visibility.

**Architecture:** Series metadata lives in `src/data/series.yaml`. Posts opt into a series via frontmatter fields `series` (matching a series id) and `seriesOrder` (integer position). New pages at `/series` (index) and `/series/[id]` (detail). In-post navigation via two components: a context box at the top and a progression bar at the bottom. The "Series" nav item in the header only appears when `series.yaml` has at least one entry.

**Tech Stack:** Astro 5, TypeScript, Tailwind CSS (matching existing project patterns).

---

## Phase 1: Content Model & Utilities

### Task 1: Add Series Fields to Blog Schema

**Files:**
- Modify: `src/content.config.ts`

**Step 1: Add optional series fields to the blog schema**

Add two optional fields to the existing blog collection schema:
- `series`: optional string (must match an `id` in `series.yaml`)
- `seriesOrder`: optional number (integer, position within the series)

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors. Existing posts unaffected.

**Step 3: Commit checkpoint**

Commit message: `feat: add series and seriesOrder fields to blog schema`

---

### Task 2: Create Series Metadata File

**Files:**
- Create: `src/data/series.yaml` (empty array to start)
- Create: `src/assets/series/` directory (for cover images)

**Step 1: Create the series metadata file**

Create `src/data/series.yaml` with the following structure (as a comment/example, starting with an empty array):

```yaml
# Series metadata file.
# Each entry defines a series that groups related blog posts.
#
# Fields:
#   id: string - unique identifier, must match the `series` frontmatter value in posts
#   title: string - display name for the series
#   description: string - short description shown on series cards and detail pages
#   coverImage: string - path to cover image relative to src/assets/series/
#   status: "ongoing" | "complete" - whether the series is still being written
#
# Example:
#   - id: "durable-computing"
#     title: "Durable Computing Deep Dive"
#     description: "A comprehensive exploration of durable computing patterns..."
#     coverImage: "./durable-computing.png"
#     status: "ongoing"

[]
```

**Step 2: Create the series assets directory**

Create `src/assets/series/` directory with a `.gitkeep` file.

**Step 3: Commit checkpoint**

Commit message: `feat: add series metadata file and assets directory`

---

### Task 3: Create Series Utility Functions

**Files:**
- Create: `src/utils/getSeries.ts`

**Step 1: Implement series utility functions**

Create `src/utils/getSeries.ts` with the following exports:

```typescript
// Types
interface SeriesMeta {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  status: "ongoing" | "complete";
}

interface SeriesPost {
  // Blog post data with series context
  post: CollectionEntry<"blog">;
  seriesOrder: number;
}

interface SeriesWithPosts {
  meta: SeriesMeta;
  posts: SeriesPost[];       // sorted by seriesOrder
  publishedDate: Date;       // derived from first post's pubDatetime
}
```

Functions to implement:

- **`getAllSeriesMeta(): SeriesMeta[]`** - Reads and parses `src/data/series.yaml`. Returns all series metadata entries. Returns empty array if file is empty.

- **`getSeriesWithPosts(posts: CollectionEntry<"blog">[]): SeriesWithPosts[]`** - Takes all blog posts, groups them by series, merges with metadata, sorts posts within each series by `seriesOrder`. Filters to only include series that have at least one published (non-draft) post. Derives `publishedDate` from the earliest post's `pubDatetime`.

- **`getSeriesForPost(post: CollectionEntry<"blog">, allPosts: CollectionEntry<"blog">[]): { meta: SeriesMeta; posts: SeriesPost[]; currentOrder: number } | null`** - For a given post, returns its series context (metadata, all posts in the series, and the current post's order). Returns null if the post doesn't belong to a series.

- **`hasAnySeries(): boolean`** - Returns true if `series.yaml` has at least one entry. Used for conditional nav rendering.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit checkpoint**

Commit message: `feat: add series utility functions`

---

## Phase 2: Series Pages

### Task 4: Create Series Index Page

**Files:**
- Create: `src/pages/series/index.astro`

**Step 1: Implement the series index page**

Create `/series` page that displays a card grid of all series. Follow existing page patterns (use `Main.astro` layout with breadcrumbs).

Page behaviour:
- Calls `getSeriesWithPosts()` to get all series with their posts
- Renders a responsive card grid (similar to tags page grid layout)
- Each card shows:
  - Cover image (or a placeholder if none)
  - Series title (linked to `/series/[id]`)
  - Description (truncated if long)
  - Status badge: "Ongoing" or "Complete" (styled distinctly)
  - Part count (e.g. "3 parts")
- Cards sorted by `publishedDate` (newest series first)

**Step 2: Verify build and page**

Run: `npm run build`
Expected: Build succeeds. Page renders at `/series` (will be empty until series are created).

**Step 3: Commit checkpoint**

Commit message: `feat: add series index page with card grid`

---

### Task 5: Create Series Detail Page

**Files:**
- Create: `src/pages/series/[series].astro`

**Step 1: Implement the series detail page**

Create `/series/[series-id]` dynamic page using `getStaticPaths()`. Follow existing patterns from `src/pages/tags/[tag]/[...page].astro`.

Page behaviour:
- Uses `getStaticPaths()` to generate a path for each series in `series.yaml` that has published posts
- Displays:
  - Cover image (large, at top)
  - Series title
  - Full description
  - Status badge
  - Ordered list of all published posts in the series, each showing:
    - Part number (from `seriesOrder`)
    - Post title (linked to the post)
    - Publication date
    - Post description
- Use `Main.astro` layout with breadcrumbs: `Home > Series > [Series Title]`

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit checkpoint**

Commit message: `feat: add series detail page`

---

## Phase 3: In-Post Series Navigation

### Task 6: Create Series Context Box Component (Top of Post)

**Files:**
- Create: `src/components/SeriesBox.astro`

**Step 1: Implement the series context box**

Create a component that shows the full series context above the post content.

Props:
- `seriesMeta: SeriesMeta`
- `posts: SeriesPost[]` (all posts in the series, sorted by order)
- `currentOrder: number`

Behaviour:
- Shows series title (linked to `/series/[id]`)
- Shows status badge
- Lists all parts with their order number and title
- Current part is highlighted (bold, no link, visually distinct)
- Other parts are clickable links to their posts
- **Collapsible if 4+ parts**: shows series title and "Part X of Y" with an expand/collapse toggle. Expanded by default if fewer than 4 parts.
- Style: subtle box with border, consistent with the blog's existing card/box patterns. Works in both light and dark mode.

**Step 2: Verify component renders**

Will be verified when integrated into PostDetails in Task 8.

**Step 3: Commit checkpoint**

Commit message: `feat: add SeriesBox component for top-of-post navigation`

---

### Task 7: Create Series Progression Bar Component (Bottom of Post)

**Files:**
- Create: `src/components/SeriesNav.astro`

**Step 1: Implement the series progression bar**

Create a component that shows previous/next navigation within a series, placed below the post content.

Props:
- `seriesMeta: SeriesMeta`
- `posts: SeriesPost[]` (all posts in the series, sorted by order)
- `currentOrder: number`

Behaviour:
- Shows "Previous in series" link (left-aligned) if not the first part
  - Displays: arrow + part title
- Shows "Next in series" link (right-aligned) if not the last part
  - Displays: part title + arrow
- If the post is the only part, the component renders nothing
- Style: similar to existing prev/next post navigation in PostDetails. Works in both light and dark mode.

**Step 2: Verify component renders**

Will be verified when integrated into PostDetails in Task 8.

**Step 3: Commit checkpoint**

Commit message: `feat: add SeriesNav component for bottom-of-post navigation`

---

### Task 8: Integrate Series Components into Post Layout

**Files:**
- Modify: `src/layouts/PostDetails.astro`

**Step 1: Add SeriesBox above post content**

In `PostDetails.astro`, after the post metadata (title, date, tags) but before `<Content />`:
- Call `getSeriesForPost()` with the current post and all posts
- If the post belongs to a series, render `<SeriesBox />` with the series data
- If not, render nothing (no visual change)

**Step 2: Add SeriesNav below post content**

In `PostDetails.astro`, after `<Content />` but before or near the existing prev/next post navigation:
- If the post belongs to a series, render `<SeriesNav />` with the series data
- If not, render nothing

**Step 3: Verify build and rendering**

Run: `npm run build`
Expected: Build succeeds. Posts without series look exactly the same as before.

**Step 4: Commit checkpoint**

Commit message: `feat: integrate series navigation into post layout`

---

## Phase 4: Header Navigation

### Task 9: Add Conditional Series Nav Item

**Files:**
- Modify: `src/components/Header.astro`

**Step 1: Add Series link to navigation**

Add a "Series" nav item between "Posts" and "Tags" in the header. The item is conditionally rendered:

```
if (hasAnySeries()) → show "Series" link to /series
```

This applies to both the desktop nav and the mobile hamburger menu.

**Step 2: Verify with empty series.yaml**

Run: `npm run build`
Expected: Build succeeds. "Series" nav item does NOT appear (series.yaml is empty).

**Step 3: Verify with a test entry**

Temporarily add a test entry to `series.yaml` and a test `series` field to an existing post's frontmatter. Verify:
- "Series" nav item appears in the header
- `/series` page shows the test series card
- `/series/[id]` page shows the test series with its post
- The post shows SeriesBox (top) and SeriesNav (bottom)
- Remove test data after verification.

**Step 4: Commit checkpoint**

Commit message: `feat: add conditional Series nav item to header`

---

## Phase 5: Validation & Cleanup

### Task 10: End-to-End Validation

**Files:**
- None (verification only)

**Step 1: Build validation**

Run: `npm run build`
Expected: Clean build with no errors or warnings.

**Step 2: Verify no regressions**

Check that:
- All existing pages render correctly (posts, tags, archives, about, search)
- Posts without series show no series UI
- Header shows no "Series" item when `series.yaml` is empty
- RSS feed still works

**Step 3: Run existing validation script**

Run: `./buildAll.sh`
Expected: All checks pass.

---

## Appendix: How to Create a Series

Once implemented, to create a new series:

1. **Add series metadata** to `src/data/series.yaml`:
   ```yaml
   - id: "my-series"
     title: "My Series Title"
     description: "What this series covers..."
     coverImage: "./my-series-cover.png"
     status: "ongoing"
   ```

2. **Add a cover image** to `src/assets/series/my-series-cover.png`.

3. **Tag posts** by adding frontmatter to each post in the series:
   ```yaml
   series: "my-series"
   seriesOrder: 1
   ```

4. **Build and verify**: `npm run build` and check `/series` page.

5. **Update status** when complete: change `status: "ongoing"` to `status: "complete"` in `series.yaml`.
