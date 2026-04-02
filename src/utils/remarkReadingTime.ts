import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";
import type { Root } from "mdast";

export function remarkReadingTime() {
  return (tree: Root, { data }: { data: Record<string, unknown> }) => {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    data.astro = data.astro || {};
    (data.astro as Record<string, unknown>).frontmatter =
      (data.astro as Record<string, unknown>).frontmatter || {};
    (
      (data.astro as Record<string, unknown>).frontmatter as Record<
        string,
        unknown
      >
    ).readingTime = readingTime.text;
  };
}
