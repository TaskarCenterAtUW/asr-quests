/** @format */

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const pkg = JSON.parse(
    readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8")
);
const schema = JSON.parse(
    readFileSync(
        fileURLToPath(new URL("./src/assets/schema.json", import.meta.url)),
        "utf-8"
    )
);

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    base: "/asr-quests/",
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
        __LFQD_SCHEMA_VERSION__: JSON.stringify(schema.version),
    },
});
