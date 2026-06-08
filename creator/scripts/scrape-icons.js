/** @format */

// Run with: node scripts/scrape-icons.js
// Fetches the GiG element_icons.json data file, constructs icon URLs,
// and writes creator/src/assets/icons.json as [{ name, label, url }].
//   name  — snake_case canonical identifier (derived from filename)
//   label — human-readable display name
//   url   — full icon image URL
// Requires Node 18+ (built-in fetch).

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL =
  "https://provisodevstorage.blob.core.windows.net/projects/gig-element-icons/";
const JSON_URL = `${BASE_URL}element_icons.json`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../src/assets/icons.json");

const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  console.log(`Fetching ${JSON_URL} ...`);
  const res = await fetchWithTimeout(JSON_URL);
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("element_icons.json is empty or not an array.");
  }

  const icons = data.map(({ name, path }) => {
    const snakeCase = String(path ?? "")
      .replace(/\.\w+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return {
      name: snakeCase || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
      label: name.trim(),
      url: `${BASE_URL}icons2/${path}`,
    };
  });

  icons.sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(icons, null, 2) + "\n", "utf8");

  console.log(`Wrote ${icons.length} icons to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
