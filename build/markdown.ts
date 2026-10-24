// posts/*.md をビルド時に HTML へ変換する Vite プラグイン。
// - frontmatter の解析
// - 相対パスの画像を Vite の import に置き換え（ハッシュ付き URL・lazy 読み込み）
// - URL だけの段落 → リンクカード / X の埋め込み
// - コードブロック → Shiki でハイライト（ライト/ダーク両テーマ、行番号は CSS）
// - `@2026-10-24 17:30` だけの行で本文を区切ると、スクラップのコメント（entries）として分割
// 生成されるモジュール: export default { title, date, description, image, closed, hasTweet, html, entries }
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Marked, type Token, type Tokens } from "marked";
import { createHighlighter, bundledLanguages, type Highlighter } from "shiki";
import type { Plugin } from "vite";
import { esc } from "../src/layout";
import { renderEmbed, isTweetUrl, type Ogp } from "./embeds";
import { standaloneUrls, fetchOgp, mergeIntoCache, cardUrlOfLine } from "../scripts/ogp.mjs";

// 取得に失敗した URL は、このプロセスの間は再取得しない（保存のたびに待たされないように）
const failedUrls = new Set<string>();

// 記事内のカード対象 URL のうち、キャッシュにないものを取得してキャッシュに足す
async function fillOgp(body: string, ogp: Record<string, Ogp>) {
  const missing = [...new Set(standaloneUrls(body))].filter((u) => !ogp[u] && !failedUrls.has(u));
  if (!missing.length) return ogp;
  const fetched: Record<string, Ogp> = {};
  await Promise.all(
    missing.map(async (u) => {
      try {
        fetched[u] = await fetchOgp(u);
        console.log(`[ogp] ok   ${u}`);
      } catch (e) {
        failedUrls.add(u);
        console.warn(`[ogp] skip ${u} (${(e as Error).message})`);
      }
    }),
  );
  return Object.keys(fetched).length ? await mergeIntoCache(fetched) : ogp;
}

const OGP_CACHE = fileURLToPath(new URL("./ogp-cache.json", import.meta.url));
const THEMES = { light: "github-light", dark: "github-dark" } as const;

let highlighter: Promise<Highlighter> | undefined;
const getHighlighter = () =>
  (highlighter ??= createHighlighter({ themes: Object.values(THEMES), langs: [] }));

const isRelative = (href: string) => !/^([a-z]+:|\/|#)/i.test(href);

function parseFrontmatter(src: string) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta: Record<string, string> = {};
  if (!m) return { meta, body: src };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: src.slice(m[0].length) };
}

// 「@日時」だけの行で本文をコメントに分割する（コードブロック内は対象外）
const ENTRY_RE = /^@(\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2})?)\s*$/;
function splitEntries(body: string) {
  const entries: { at: string; body: string }[] = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = !inFence && line.match(ENTRY_RE);
    if (m) entries.push({ at: m[1].replace("T", " "), body: "" });
    else if (entries.length) entries[entries.length - 1].body += line + "\n";
  }
  return entries;
}

const langOf = (lang?: string) => (lang ?? "").trim().split(/\s+/)[0].toLowerCase();

async function renderMarkdown(body: string, ogp: Record<string, Ogp>, addAsset: (href: string) => string) {
  const hl = await getHighlighter();

  const md = new Marked({
    renderer: {
      // URL だけの段落 → 埋め込み
      paragraph({ tokens }) {
        const meaningful = tokens.filter((t) => !(t.type === "text" && !t.raw.trim()));
        const only = meaningful[0];
        if (meaningful.length === 1 && only.type === "link") {
          const link = only as Tokens.Link;
          // 「URL だけ」または「リンク 1 つだけ」の段落
          if (/^https?:\/\//.test(link.href)) return renderEmbed(link.href, ogp) + "\n";
        }
        return `<p>${this.parser.parseInline(tokens)}</p>\n`;
      },
      image({ href, title, text }) {
        const titleAttr = title ? ` title="${esc(title)}"` : "";
        return `<img src="${esc(href)}" alt="${esc(text)}"${titleAttr} loading="lazy" decoding="async">`;
      },
      code({ text, lang }) {
        const l = langOf(lang);
        const loaded = hl.getLoadedLanguages().includes(l);
        const html = hl.codeToHtml(text, { lang: loaded ? l : "text", themes: THEMES, defaultColor: false });
        return `<div class="code-block"${l ? ` data-lang="${esc(l)}"` : ""}>${html}</div>\n`;
      },
    },
  });

  const tokens = md.lexer(body);

  // 画像パスの置き換えと、使われている言語の収集
  const langs = new Set<string>();
  md.walkTokens(tokens as Token[], (t) => {
    if (t.type === "image") {
      const img = t as Tokens.Image;
      if (isRelative(img.href)) img.href = addAsset(img.href);
    } else if (t.type === "code") {
      const l = langOf((t as Tokens.Code).lang);
      if (l && l in bundledLanguages) langs.add(l);
    }
  });
  await Promise.all([...langs].map((l) => hl.loadLanguage(l as keyof typeof bundledLanguages)));

  return md.parser(tokens);
}

export function markdown(): Plugin {
  return {
    name: "blog-markdown",
    enforce: "pre",
    async transform(src, id) {
      const file = id.split("?")[0];
      if (!file.endsWith(".md")) return;

      this.addWatchFile(OGP_CACHE);
      let ogp: Record<string, Ogp> = {};
      try {
        ogp = JSON.parse(readFileSync(OGP_CACHE, "utf8"));
      } catch {}

      // 画像は import に変換し、HTML 中はプレースホルダーにしておく
      const imports: string[] = [];
      const addAsset = (href: string) => {
        const i = imports.length;
        imports.push(href.startsWith(".") ? href : "./" + href);
        return `__MD_ASSET_${i}__`;
      };

      const { meta, body } = parseFrontmatter(src);
      // 新しく書いた URL の OGP はここで取得する（dev でも保存するだけでカードになる）
      ogp = await fillOgp(body, ogp);
      const parts = splitEntries(body);
      const html = parts.length ? "" : await renderMarkdown(body, ogp, addAsset);
      const entries = await Promise.all(
        parts.map(async (e) => ({ at: e.at, html: await renderMarkdown(e.body, ogp, addAsset) })),
      );
      const image = meta.image ? (isRelative(meta.image) ? addAsset(meta.image) : meta.image) : undefined;
      const hasTweet = body.split(/\r?\n/).some((line) => {
        const url = cardUrlOfLine(line);
        return !!url && isTweetUrl(url);
      });

      // "...__MD_ASSET_0__..." → "..." + __asset0 + "..."
      const toExpr = (s: string) =>
        s.split(/(__MD_ASSET_\d+__)/).map((part) => {
          const m = part.match(/^__MD_ASSET_(\d+)__$/);
          return m ? `__asset${m[1]}` : JSON.stringify(part);
        }).join(" + ");

      const code = [
        ...imports.map((p, i) => `import __asset${i} from ${JSON.stringify(p)};`),
        `export default {`,
        `  title: ${JSON.stringify(meta.title ?? "")},`,
        `  date: ${JSON.stringify(meta.date ?? "")},`,
        `  description: ${JSON.stringify(meta.description ?? "")},`,
        `  image: ${image ? toExpr(image) : "undefined"},`,
        `  closed: ${meta.closed === "true"},`,
        `  hasTweet: ${hasTweet},`,
        `  html: ${toExpr(html)},`,
        `  entries: [${entries.map((e) => `{ at: ${JSON.stringify(e.at)}, html: ${toExpr(e.html)} }`).join(", ")}],`,
        `};`,
      ].join("\n");
      return { code, map: null };
    },
  };
}
