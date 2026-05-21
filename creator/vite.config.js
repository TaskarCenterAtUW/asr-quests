/** @format */

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/asr-quests/creator/", // ← matches https://taskarcenteratuw.github.io/asr-quests/creator/
});
