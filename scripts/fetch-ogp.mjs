// content/ 以下の Markdown のカード対象 URL と content/slides.json のスライド URL の
// OGP を取得し、build/ogp-cache.json に保存する。
// 取得済みの URL はスキップする（--refresh で全件取り直し）。失敗してもビルドは止めない。
import { readdir, readFile } from "node:fs/promises";
import { standaloneUrls, fetchOgp, readCache, mergeIntoCache } from "./ogp.mjs";

const CONTENT_DIR = new URL("../content/", import.meta.url);
const refresh = process.argv.includes("--refresh");

const cache = await readCache();
const files = (await readdir(CONTENT_DIR, { recursive: true })).filter((f) => f.endsWith(".md"));
const urls = new Set();
for (const f of files) for (const u of standaloneUrls(await readFile(new URL(f, CONTENT_DIR), "utf8"))) urls.add(u);
// スライドのサムネイル用
const slides = JSON.parse(await readFile(new URL("slides.json", CONTENT_DIR), "utf8").catch(() => "[]"));
for (const s of slides) if (s.url && !s.image) urls.add(s.url);

const targets = [...urls].filter((u) => refresh || !cache[u]);
const fetched = {};
await Promise.all(
  targets.map(async (u) => {
    try {
      fetched[u] = await fetchOgp(u);
      console.log(`[ogp] ok   ${u}`);
    } catch (e) {
      console.warn(`[ogp] skip ${u} (${e.message})`);
    }
  }),
);

if (Object.keys(fetched).length) await mergeIntoCache(fetched);
console.log(`[ogp] ${urls.size} url(s), fetched ${Object.keys(fetched).length}/${targets.length}`);
