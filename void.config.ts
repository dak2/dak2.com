import { defineConfig } from "void/config";

export default defineConfig({
  worker: {
    compatibility_date: "2026-10-19",
  },
  inference: {
    appType: "void",
    // リンクカード用の OGP を取得してからビルドする（void deploy もこのコマンドを使う）
    build: "node scripts/fetch-ogp.mjs && vite build",
  },
  routing: {
    // www は正規ドメインへ（Worker に届く前にエッジで処理される）
    redirects: {
      "https://www.dak2.com/*": { to: "https://dak2.com/:splat", status: 301 },
    },
    // 未定義パスは routes/[...path].ts の 404 ページを返す
    notFound: "none",
  },
  cloudflare: {
    name: "dak2-blog",
    // 独自ドメイン（DNS レコードと SSL 証明書は Cloudflare が自動で作成）
    routes: [
      { pattern: "dak2.com", custom_domain: true },
      { pattern: "www.dak2.com", custom_domain: true },
    ],
  },
});
