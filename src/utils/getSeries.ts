import type { CollectionEntry } from "astro:content";
import { parse } from "yaml";
import { readFileSync } from "fs";
import { join } from "path";
import postFilter from "./postFilter";

export interface SeriesMeta {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  status: "ongoing" | "complete";
}

export interface SeriesPost {
  post: CollectionEntry<"blog">;
  seriesOrder: number;
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

export function getSeriesWithPosts(
  posts: CollectionEntry<"blog">[]
): SeriesWithPosts[] {
  const allMeta = getAllSeriesMeta();
  if (allMeta.length === 0) return [];

  const publishedPosts = posts.filter(postFilter);

  return allMeta
    .map(meta => {
      const seriesPosts = publishedPosts
        .filter(p => p.data.series === meta.id)
        .map(p => ({
          post: p,
          seriesOrder: p.data.seriesOrder ?? 0,
        }))
        .sort((a, b) => a.seriesOrder - b.seriesOrder);

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
): { meta: SeriesMeta; posts: SeriesPost[]; currentOrder: number } | null {
  if (!post.data.series) return null;

  const allMeta = getAllSeriesMeta();
  const meta = allMeta.find(m => m.id === post.data.series);
  if (!meta) return null;

  const publishedPosts = allPosts.filter(postFilter);
  const seriesPosts = publishedPosts
    .filter(p => p.data.series === meta.id)
    .map(p => ({
      post: p,
      seriesOrder: p.data.seriesOrder ?? 0,
    }))
    .sort((a, b) => a.seriesOrder - b.seriesOrder);

  return {
    meta,
    posts: seriesPosts,
    currentOrder: post.data.seriesOrder ?? 0,
  };
}

export function hasAnySeries(): boolean {
  return getAllSeriesMeta().length > 0;
}
