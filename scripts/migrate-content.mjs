/**
 * Migration script to convert Zola blog posts to Astro format
 *
 * Converts:
 * - TOML frontmatter (+++) to YAML frontmatter (---)
 * - date → publishDate
 * - [taxonomies] categories → categories
 * - [taxonomies] tags → tags
 */

import * as fs from 'fs';
import * as path from 'path';

const SOURCE_DIR = 'content/posts';
const TARGET_DIR = 'src/data/post';

function parseTomlFrontmatter(content) {
  const tomlMatch = content.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n([\s\S]*)$/);

  if (!tomlMatch) {
    return null;
  }

  const tomlContent = tomlMatch[1];
  const body = tomlMatch[2];

  // Simple TOML parser for our specific format
  const frontmatter = {
    title: '',
    date: '',
    taxonomies: {},
  };

  // Parse title
  const titleMatch = tomlContent.match(/title\s*=\s*"([^"]+)"/);
  if (titleMatch) {
    frontmatter.title = titleMatch[1];
  }

  // Parse date
  const dateMatch = tomlContent.match(/date\s*=\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    frontmatter.date = dateMatch[1];
  }

  // Parse taxonomies - look for categories and tags anywhere after [taxonomies]
  const hasTaxonomies = tomlContent.includes('[taxonomies]');
  if (hasTaxonomies) {
    // Parse categories - can be anywhere in the content after [taxonomies]
    const categoriesMatch = tomlContent.match(/categories\s*=\s*\[([\s\S]*?)\]/);
    if (categoriesMatch) {
      const categoriesStr = categoriesMatch[1];
      frontmatter.taxonomies.categories = categoriesStr
        .split(',')
        .map(c => c.trim().replace(/^["']|["']$/g, ''))
        .filter(c => c.length > 0);
    }

    // Parse tags - can be anywhere in the content after [taxonomies]
    const tagsMatch = tomlContent.match(/tags\s*=\s*\[([\s\S]*?)\]/);
    if (tagsMatch) {
      const tagsStr = tagsMatch[1];
      frontmatter.taxonomies.tags = tagsStr
        .split(',')
        .map(t => t.trim().replace(/^["']|["']$/g, ''))
        .filter(t => t.length > 0);
    }
  }

  return { frontmatter, body };
}

function toYamlFrontmatter(fm) {
  const lines = ['---'];

  lines.push(`title: "${fm.title.replace(/"/g, '\\"')}"`);
  lines.push(`publishDate: ${fm.publishDate}`);
  lines.push(`draft: ${fm.draft}`);

  if (fm.categories && fm.categories.length > 0) {
    lines.push(`categories:`);
    fm.categories.forEach(c => lines.push(`  - "${c}"`));
  }

  if (fm.tags && fm.tags.length > 0) {
    lines.push(`tags:`);
    fm.tags.forEach(t => lines.push(`  - "${t}"`));
  }

  lines.push('---');

  return lines.join('\n');
}

function convertFile(sourcePath, targetPath) {
  try {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const parsed = parseTomlFrontmatter(content);

    if (!parsed) {
      console.error(`Failed to parse: ${sourcePath}`);
      return false;
    }

    const { frontmatter, body } = parsed;

    const astroFrontmatter = {
      title: frontmatter.title,
      publishDate: frontmatter.date,
      categories: frontmatter.taxonomies?.categories,
      tags: frontmatter.taxonomies?.tags,
      draft: false,
    };

    const yamlFrontmatter = toYamlFrontmatter(astroFrontmatter);
    const newContent = `${yamlFrontmatter}\n${body}`;

    fs.writeFileSync(targetPath, newContent, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error converting ${sourcePath}:`, error);
    return false;
  }
}

function migrate() {
  console.log('Starting migration...');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Target: ${TARGET_DIR}`);

  // Ensure target directory exists
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // Get all markdown files
  const files = fs.readdirSync(SOURCE_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'));

  console.log(`Found ${files.length} files to migrate`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file);

    // Remove date prefix from filename for cleaner URLs
    // e.g., "2024-12-27-durable-computing-hype.md" → "durable-computing-hype.md"
    const newFilename = file.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const targetPath = path.join(TARGET_DIR, newFilename);

    if (convertFile(sourcePath, targetPath)) {
      console.log(`✓ ${file} → ${newFilename}`);
      successCount++;
    } else {
      console.log(`✗ ${file}`);
      failCount++;
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
}

migrate();
