import * as fs from "fs";
import * as path from "path";
import * as toml from "@iarna/toml";

const ZOLA_CONTENT_DIR = "./content/posts";
const ASTRO_CONTENT_DIR = "./src/data/blog";

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
  description: string;
  tags: string[];
  ogImage?: string;
  draft: boolean;
  author: string;
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

function extractDescription(body: string, title: string): string {
  // Remove HTML comments like <!-- more -->
  const cleanBody = body.replace(/<!--[\s\S]*?-->/g, "").trim();

  // Get the first non-empty paragraph
  const paragraphs = cleanBody.split(/\n\n+/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    // Skip headers, empty lines, code blocks, blockquotes, and very short text
    if (
      trimmed &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("```") &&
      !trimmed.startsWith(">") &&
      trimmed.length > 20
    ) {
      // Remove markdown formatting for description
      let description = trimmed
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links but keep text
        .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
        .replace(/\*([^*]+)\*/g, "$1") // Remove italic
        .replace(/`([^`]+)`/g, "$1") // Remove inline code
        .replace(/\n/g, " ") // Replace newlines with spaces
        .trim();

      // Truncate if too long
      if (description.length > 200) {
        description = description.substring(0, 197) + "...";
      }

      return description;
    }
  }

  // Fallback to title-based description
  return `Blog post about ${title}`;
}

function convertToAstroFrontmatter(
  zola: ZolaFrontmatter,
  body: string
): AstroFrontmatter {
  const title = zola.title || "Untitled";

  const astro: AstroFrontmatter = {
    title: title,
    pubDatetime: zola.date || new Date().toISOString().split("T")[0],
    description:
      zola.description || extractDescription(body, title),
    tags: zola.taxonomies?.tags || ["others"],
    draft: zola.draft || false,
    author: "Pere Villega",
  };

  if (zola.updated) {
    astro.modDatetime = zola.updated;
  }

  if (zola.extra?.social_media_card) {
    astro.ogImage = zola.extra.social_media_card;
  }

  return astro;
}

function escapeYamlString(str: string): string {
  // If string contains special chars, wrap in double quotes and escape
  if (
    str.includes(":") ||
    str.includes("#") ||
    str.includes('"') ||
    str.includes("'") ||
    str.includes("\n") ||
    str.startsWith(" ") ||
    str.endsWith(" ")
  ) {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return str;
}

function toYaml(obj: AstroFrontmatter): string {
  const lines: string[] = [];

  lines.push(`author: ${escapeYamlString(obj.author)}`);
  lines.push(`pubDatetime: ${obj.pubDatetime}`);

  if (obj.modDatetime) {
    lines.push(`modDatetime: ${obj.modDatetime}`);
  }

  lines.push(`title: ${escapeYamlString(obj.title)}`);
  lines.push(`draft: ${obj.draft}`);

  lines.push(`tags:`);
  obj.tags.forEach((tag) => lines.push(`  - ${tag}`));

  lines.push(`description: ${escapeYamlString(obj.description)}`);

  if (obj.ogImage) {
    lines.push(`ogImage: ${escapeYamlString(obj.ogImage)}`);
  }

  return lines.join("\n");
}

function migrateFile(inputPath: string, outputPath: string): void {
  const content = fs.readFileSync(inputPath, "utf-8");

  try {
    const { frontmatter, body } = parseZolaFrontmatter(content);
    const astroFrontmatter = convertToAstroFrontmatter(frontmatter, body);
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
