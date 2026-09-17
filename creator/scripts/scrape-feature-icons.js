/** @format */

// Run with: bun scripts/scrape-feature-icons.js
// Fetches the ASR feature icon catalog and writes [{ name, label, url }].

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL =
  "https://provisodevstorage.blob.core.windows.net/projects/asr-feature-icons/";
const JSON_URL = `${BASE_URL}feature-icons.json`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../src/assets/featureIcons.json");
const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function slugFromPath(path) {
  return String(path)
    .replace(/\.\w+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  console.log(`Fetching ${JSON_URL} ...`);
  const response = await fetchWithTimeout(JSON_URL);
  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("feature-icons.json is empty or not an array.");
  }

  const icons = data.map((record, index) => {
    if (
      !record ||
      typeof record.name !== "string" ||
      !record.name.trim() ||
      typeof record.path !== "string" ||
      !record.path.trim()
    ) {
      throw new Error(
        `feature-icons.json record ${index} is missing required name or path fields.`
      );
    }

    const name = slugFromPath(record.path);
    if (!name) {
      throw new Error(`feature-icons.json record ${index} has an invalid path.`);
    }

    return {
      name,
      label: record.name.trim(),
      url: `${BASE_URL}${record.path.trim()}`,
    };
  });

  icons.sort((left, right) => left.name.localeCompare(right.name));
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(icons, null, 2)}\n`, "utf8");
  console.log(`Wrote ${icons.length} feature icons to ${OUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
