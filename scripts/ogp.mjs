// リンクカード用 OGP の取得とキャッシュ（build/ogp-cache.json）。
// scripts/fetch-ogp.mjs（CLI）と build/markdown.ts（Vite プラグイン）の両方から使う。
import { readFile, writeFile } from "node:fs/promises";

export const CACHE_FILE = new URL("../build/ogp-cache.json", import.meta.url);
export const TWEET_RE = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/\w+\/status\/\d+/;

// カードにする行: 「URL だけ」または「リンク 1 つだけ（[text](url)）」の行
const BARE_RE = /^\s*(https?:\/\/\S+)\s*$/;
const LINK_RE = /^\s*\[[^\]]*\]\((https?:\/\/[^)\s]+)\)\s*$/;
export const cardUrlOfLine = (line) => (line.match(BARE_RE) || line.match(LINK_RE))?.[1];

export function standaloneUrls(md) {
  const urls = [];
  let inFence = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const url = cardUrlOfLine(line);
    if (url && !TWEET_RE.test(url)) urls.push(url);
  }
  return urls;
}

const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function parseOgp(html, baseUrl) {
  const head = html.slice(0, html.search(/<\/head>/i) + 1 || 200_000);
  const metas = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const attr = (n) => tag.match(new RegExp(`\\b${n}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
    const key = attr("property") ?? attr("name");
    const val = attr("content");
    if (key && val) {
      const k = (key[2] ?? key[3]).toLowerCase();
      metas[k] ??= decodeEntities(val[2] ?? val[3]).trim();
    }
  }
  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const image = metas["og:image"] || metas["twitter:image"];
  return {
    title: metas["og:title"] || metas["twitter:title"] || (titleTag && decodeEntities(titleTag).trim()) || undefined,
    description: metas["og:description"] || metas["twitter:description"] || metas["description"] || undefined,
    image: image ? new URL(image, baseUrl).href : undefined,
    siteName: metas["og:site_name"] || undefined,
  };
}

export async function fetchOgp(url) {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
    headers: { "user-agent": "Mozilla/5.0 (compatible; blog-ogp-fetcher)", accept: "text/html" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  // 文字コード: Content-Type → <meta charset> → UTF-8 の順に判定（Shift_JIS のサイト対策）
  let charset = res.headers.get("content-type")?.match(/charset=([\w-]+)/i)?.[1];
  if (!charset) {
    const sniff = new TextDecoder("latin1").decode(buf.slice(0, 4096));
    charset = sniff.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  }
  let text;
  try {
    text = new TextDecoder(charset || "utf-8").decode(buf);
  } catch {
    text = new TextDecoder("utf-8").decode(buf);
  }
  return parseOgp(text, res.url || url);
}


export async function readCache() {
  return JSON.parse(await readFile(CACHE_FILE, "utf8").catch(() => "{}"));
}

// 取得結果をキャッシュにマージして書き出す（他の書き込みを消さないよう、読み直してからマージ）
export async function mergeIntoCache(entries) {
  const cache = { ...(await readCache()), ...entries };
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(CACHE_FILE, JSON.stringify(sorted, null, 2) + "\n");
  return sorted;
}
