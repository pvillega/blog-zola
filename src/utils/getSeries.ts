import type { CollectionEntry } from "astro:content";
import { parse } from "yaml";
import { readFileSync } from "fs";
import { join } from "path";
import postFilter from "./postFilter";

export interface SectionMeta {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface SeriesMeta {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  status: "ongoing" | "complete";
  sections?: SectionMeta[];
}

export interface SeriesPost {
  post: CollectionEntry<"blog">;
  seriesOrder: number;
  seriesSection?: string;
}

export interface SeriesWithPosts {
  meta: SeriesMeta;
  posts: SeriesPost[];
  publishedDate: Date;
}

export function getAllSeriesMeta(): SeriesMeta[] {
  const filePath = join(process.cwd(), "src/data/series.yaml");
  const content = readFileSync(filePath, "utf-8");
  const parsed = parse(content);
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed as SeriesMeta[];
}

function getSectionOrder(
  meta: SeriesMeta,
  sectionId: string | undefined
): number {
  if (!sectionId || !meta.sections) return 0;
  const section = meta.sections.find(s => s.id === sectionId);
  return section?.order ?? 0;
}

function sortBySection(meta: SeriesMeta, posts: SeriesPost[]): SeriesPost[] {
  return [...posts].sort((a, b) => {
    const sectionDiff =
      getSectionOrder(meta, a.seriesSection) -
      getSectionOrder(meta, b.seriesSection);
    if (sectionDiff !== 0) return sectionDiff;
    return a.seriesOrder - b.seriesOrder;
  });
}

export function getSeriesWithPosts(
  posts: CollectionEntry<"blog">[]
): SeriesWithPosts[] {
  const allMeta = getAllSeriesMeta();
  if (allMeta.length === 0) return [];

  const publishedPosts = posts.filter(postFilter);

  return allMeta
    .map(meta => {
      const seriesPosts = sortBySection(
        meta,
        publishedPosts
          .filter(p => p.data.series === meta.id)
          .map((p): SeriesPost => ({
            post: p,
            seriesOrder: p.data.seriesOrder ?? 0,
            seriesSection: p.data.seriesSection,
          }))
      );

      if (seriesPosts.length === 0) return null;

      const earliestPost = seriesPosts.reduce((earliest, sp) =>
        new Date(sp.post.data.pubDatetime) <
        new Date(earliest.post.data.pubDatetime)
          ? sp
          : earliest
      );

      return {
        meta,
        posts: seriesPosts,
        publishedDate: new Date(earliestPost.post.data.pubDatetime),
      };
    })
    .filter((s): s is SeriesWithPosts => s !== null)
    .sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
}

export function getSeriesForPost(
  post: CollectionEntry<"blog">,
  allPosts: CollectionEntry<"blog">[]
): { meta: SeriesMeta; posts: SeriesPost[]; currentPostId: string } | null {
  if (!post.data.series) return null;

  const allMeta = getAllSeriesMeta();
  const meta = allMeta.find(m => m.id === post.data.series);
  if (!meta) return null;

  const publishedPosts = allPosts.filter(postFilter);
  const seriesPosts = sortBySection(
    meta,
    publishedPosts
      .filter(p => p.data.series === meta.id)
      .map((p): SeriesPost => ({
        post: p,
        seriesOrder: p.data.seriesOrder ?? 0,
        seriesSection: p.data.seriesSection,
      }))
  );

  return {
    meta,
    posts: seriesPosts,
    currentPostId: post.id,
  };
}

export interface SectionWithPosts {
  section: SectionMeta;
  posts: SeriesPost[];
}

export function groupPostsBySections(
  meta: SeriesMeta,
  posts: SeriesPost[]
): { sections: SectionWithPosts[]; unsectioned: SeriesPost[] } {
  if (!meta.sections || meta.sections.length === 0) {
    return { sections: [], unsectioned: posts };
  }

  const sortedSections = [...meta.sections].sort(
    (a, b) => a.order - b.order
  );

  const unsectioned: SeriesPost[] = [];
  const sectionMap = new Map<string, SeriesPost[]>();

  for (const section of sortedSections) {
    sectionMap.set(section.id, []);
  }

  for (const sp of posts) {
    if (sp.seriesSection && sectionMap.has(sp.seriesSection)) {
      sectionMap.get(sp.seriesSection)!.push(sp);
    } else {
      unsectioned.push(sp);
    }
  }

  const sections: SectionWithPosts[] = sortedSections
    .map(section => ({
      section,
      posts: sectionMap.get(section.id) ?? [],
    }))
    .filter(s => s.posts.length > 0);

  return { sections, unsectioned };
}

export function hasAnySeries(): boolean {
  return getAllSeriesMeta().length > 0;
}
