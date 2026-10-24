---
title: 個人ブログを Void で作り直す
closed: true
---

@2026-10-24 13:00
個人サイトを作り直す。Next.js から、Vite + Void で Cloudflare Workers に載せる構成にする。
モチベーションはドメインを dak2.com に変えたかっただけw

@2026-10-24 13:30
方針はシンプルに。

- Markdown を置くだけで記事になる
- HTML はビルド時に作って、Worker は返すだけ

これで Claude さんに依頼

@2026-10-24 16:45
お名前.com のネームサーバーを Cloudflare に向けた。`dig` では切り替わっているのに、ダッシュボードは Invalid nameservers のまま。「Check nameservers now」を押して待つ。
お名前やめたいので更新は止めた。

@2026-10-24 17:20
大体良さそう。
途中で Zenn の Scrap 的な something が欲しいんだったと思い出した

@2026-10-24 17:40
Profile / Posts / Notes / Slides の 4 セクションに分けた。ルーティングは `routes/` にファイルを置くだけ。

```ts
// routes/posts/[slug].ts
export const GET = defineHandler((c) => postPage(origin, c.req.param("slug")));
```

@2026-10-24 18:30
前のブログの記事を移行
