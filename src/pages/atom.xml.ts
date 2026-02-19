import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  const siteUrl = site?.href ?? SITE.website;

  const updated =
    sortedPosts.length > 0
      ? new Date(
          sortedPosts[0].data.modDatetime ?? sortedPosts[0].data.pubDatetime
        ).toISOString()
      : new Date().toISOString();

  const entries = sortedPosts
    .map(({ data, id, filePath }) => {
      const postUrl = new URL(getPath(id, filePath), siteUrl).href;
      const pubDate = new Date(
        data.modDatetime ?? data.pubDatetime
      ).toISOString();

      return `  <entry>
    <title>${escapeXml(data.title)}</title>
    <link href="${escapeXml(postUrl)}" />
    <id>${escapeXml(postUrl)}</id>
    <updated>${pubDate}</updated>
    <summary>${escapeXml(data.description)}</summary>
  </entry>`;
    })
    .join("\n");

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(SITE.title)}</title>
  <subtitle>${escapeXml(SITE.desc)}</subtitle>
  <link href="${escapeXml(siteUrl)}" />
  <link href="${escapeXml(new URL("atom.xml", siteUrl).href)}" rel="self" />
  <id>${escapeXml(siteUrl)}</id>
  <updated>${updated}</updated>
  <author>
    <name>${escapeXml(SITE.author)}</name>
  </author>
${entries}
</feed>
`;

  return new Response(atom, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
