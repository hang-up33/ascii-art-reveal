import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages で公開する際は base をリポジトリ名に合わせる。
// リポジトリ名を変更した場合はここだけ書き換えればよい。
const REPOSITORY_NAME = "ascii-art-reveal";

export default defineConfig({
  base: `/${REPOSITORY_NAME}/`,
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
