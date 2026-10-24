import { defineConfig } from "vite";
import { voidPlugin } from "void";
import { markdown } from "./build/markdown";

export default defineConfig({
  plugins: [markdown(), voidPlugin()],
});
