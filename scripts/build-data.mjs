import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const contentDir = path.join(root, "content", "cases");
const outDir = path.join(root, "public", "data");
const outFile = path.join(outDir, "cases.json");

function walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  return items.flatMap((it) => {
    const p = path.join(dir, it.name);
    return it.isDirectory() ? walk(p) : [p];
  });
}

function normLang(filename) {
  const m = filename.match(/\.([a-z]{2})(-[A-Z]{2})?\.md$/);
  return m ? m[1].toLowerCase() : "de";
}

const files = walk(contentDir).filter((f) => f.endsWith(".md"));
const entries = [];

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);

  const id = data.id ?? path.basename(file).replace(/\.[a-z]{2}(\-[A-Z]{2})?\.md$/, "");

  entries.push({
    id,
    lang: data.lang ?? normLang(file),
    title: data.title ?? id,
    short: data.short ?? "",
    categories: Array.isArray(data.categories) ? data.categories : [],
    score: typeof data.score === "number" ? data.score : undefined,
    url: data.url ?? undefined,
    locations: Array.isArray(data.locations) ? data.locations : [],
    region: data.region ?? undefined,
    updated: data.updated ?? undefined,
  });
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(entries, null, 2), "utf8");

fs.writeFileSync(
  path.join(outDir, "meta.json"),
  JSON.stringify({ builtAt: new Date().toISOString() }, null, 2),
  "utf8"
);