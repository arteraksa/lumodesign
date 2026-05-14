import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const casesDir = join(root, "cases");
const outputFile = join(root, "admin", "data", "cases.json");
const tagLabels = [
  ["uiux", "UI/UX Design"],
  ["desenvolvimento", "Desenvolvimento"],
  ["branding", "Branding"],
  ["editorial", "Editorial"],
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanImageUrl(url) {
  return url.replace(/&amp;/g, "&");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function extractDescription(text, title, tags) {
  let description = text.replaceAll(`${title} - Raksa Design`, " ").replaceAll(title, " ");
  for (const tag of tags) description = description.replaceAll(tag, " ");
  description = description.replace(/\bAcessar website\b/g, " ").replace(/\s+/g, " ").trim();
  return description.slice(0, 720);
}

const cases = readdirSync(casesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const slug = entry.name;
    const html = readFileSync(join(casesDir, slug, "index.html"), "utf8");
    const title = (html.match(/<title>(.*?)\s+-\s+Raksa Design<\/title>/)?.[1] || slug)
      .replace(/&amp;/g, "&")
      .trim();
    const text = stripHtml(html);
    const tags = tagLabels.filter(([, label]) => text.includes(label)).map(([, label]) => label);
    const images = unique([...html.matchAll(/<img [^>]*src="([^"]+)"/g)].map((match) => cleanImageUrl(match[1])));
    const cover = images[0] || "";

    return {
      id: slug,
      slug,
      title,
      tags,
      description: extractDescription(text, title, tags),
      cover,
      images,
      updatedAt: new Date().toISOString(),
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

mkdirSync(join(root, "admin", "data"), { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(cases, null, 2)}\n`);
console.log(`Generated ${cases.length} admin cases at ${outputFile}`);
