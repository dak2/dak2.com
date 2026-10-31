// 各ページの HTML を組み立てる（routes/ のハンドラから呼ぶ）
import { posts, notes, profile, slides, findPost, findNote, type Entry, type Note, type Slide } from "./content";
import { layout, esc, SITE_TITLE, SITE_DESCRIPTION, SITE_URL, TWITTER_WIDGET } from "./layout";
import ogpCache from "../build/ogp-cache.json";

const ogp = ogpCache as Record<string, { title?: string; image?: string }>;

// og:url・canonical・RSS 用のオリジン。本番は常に https://dak2.com、ローカル開発だけアクセス元を使う
export function siteOrigin(requestUrl: string) {
  const url = new URL(requestUrl);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return isLocal ? url.origin : SITE_URL;
}

// サイト内パスを絶対 URL に（og:image は絶対 URL が必須）
const abs = (origin: string, p: string) => (/^https?:\/\//.test(p) ? p : origin + p);

// HTML から先頭のテキストを抜き出す（Notes の説明文用）
function excerpt(html: string, max = 100) {
  const text = html
    .replace(/<pre[\s\S]*?<\/pre>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max) + "…" : text;
}

const AUTHOR = { name: "dak2", avatar: "https://github.com/dak2.png?size=80" };

// ---- 部品 ----

const empty = (msg: string) => `<p class="empty">${msg}</p>`;

function postRow(p: Entry) {
  return `<li class="scrap-row">
  <a class="scrap-row-title" href="/posts/${p.slug}">${esc(p.title)}</a>
  <div class="scrap-row-meta">
    <time>${esc(p.date)}</time>
  </div>
</li>`;
}

const postIndexList = (items: Entry[]) =>
  items.length ? `<ul class="scrap-list">${items.map(postRow).join("")}</ul>` : empty("まだ記事はありません。");

// Notes（スクラップ）の一覧行: タイトル・コメント数・更新日・状態
function noteRow(n: Note) {
  return `<li class="scrap-row">
  <a class="scrap-row-title" href="/notes/${n.slug}">${esc(n.title)}</a>
  <div class="scrap-row-meta">
    <span class="badge ${n.closed ? "badge-closed" : "badge-open"}">${n.closed ? "Closed" : "Open"}</span>
    <span>${n.comments.length} comments</span>
    <span>更新 <time>${esc(n.updated)}</time></span>
  </div>
</li>`;
}

const noteList = (items: Note[]) =>
  items.length ? `<ul class="scrap-list">${items.map(noteRow).join("")}</ul>` : empty("まだスクラップはありません。");

// スクラップのコメント（カード）
function commentCard(c: { at: string; html: string }, i: number) {
  const id = `c-${i + 1}`;
  return `<article class="scrap-comment" id="${id}">
  <header class="scrap-comment-head">
    <img class="avatar" src="${AUTHOR.avatar}" alt="" width="28" height="28" loading="lazy">
    <span class="author">${AUTHOR.name}</span>
    <a class="permalink" href="#${id}"><time>${esc(c.at)}</time></a>
  </header>
  <div class="scrap-comment-body">${c.html}</div>
</article>`;
}

function slideCard(s: Slide) {
  const image = s.image || (s.url ? ogp[s.url]?.image : undefined);
  const thumb = image
    ? `<img class="slide-thumb" src="${esc(image)}" alt="" loading="lazy" decoding="async">`
    : `<div class="slide-thumb slide-thumb-empty" aria-hidden="true">${esc(s.event || "Slides")}</div>`;
  const links = [
    s.video ? `<a href="${esc(s.video)}" target="_blank" rel="noopener">動画</a>` : "",
  ].filter(Boolean);
  const title = s.url
    ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`
    : esc(s.title);
  return `<li class="slide">
  ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener" tabindex="-1">${thumb}</a>` : thumb}
  <div class="slide-body">
    <h2 class="slide-title">${title}</h2>
    <p class="slide-meta"><time>${esc(s.date)}</time>${s.event ? ` · ${esc(s.event)}` : ""}</p>
    ${links.length ? `<p class="slide-links">${links.join(" ")}</p>` : ""}
  </div>
</li>`;
}

const sectionHead = (title: string, href: string) =>
  `<div class="section-head"><h2>${title}</h2><a href="${href}">すべて見る →</a></div>`;

// ---- ページ ----

export function homePage(origin: string) {
  const content = `
<section class="intro">
  <p>${esc(SITE_DESCRIPTION)}</p>
</section>
${posts.length ? `<section>${sectionHead("Posts", "/posts")}${postIndexList(posts.slice(0, 3))}</section>` : ""}
${notes.length ? `<section>${sectionHead("Notes", "/notes")}${noteList(notes.slice(0, 5))}</section>` : ""}
${slides.length ? `<section>${sectionHead("Slides", "/slides")}<ul class="slides">${slides.slice(0, 2).map(slideCard).join("")}</ul></section>` : ""}`;
  return layout({ title: SITE_TITLE, description: SITE_DESCRIPTION, url: origin + "/", content });
}

export function profilePage(origin: string) {
  return layout({
    title: `${profile.title || "Profile"} | ${SITE_TITLE}`,
    description: profile.description,
    url: origin + "/profile",
    section: "profile",
    content: `<h1 class="page-title">${esc(profile.title || "Profile")}</h1><div class="profile">${profile.html}</div>`,
  });
}

export function postsIndexPage(origin: string) {
  return layout({
    title: `Posts | ${SITE_TITLE}`,
    description: "dak2 の記事一覧",
    url: origin + "/posts",
    section: "posts",
    content: `<h1 class="page-title">Posts</h1>${postIndexList(posts)}`,
  });
}

export function postPage(origin: string, slug: string) {
  const post = findPost(slug);
  if (!post) return undefined;
  return layout({
    title: `${post.title} | ${SITE_TITLE}`,
    description: post.description,
    url: `${origin}/posts/${post.slug}`,
    image: post.image ? abs(origin, post.image) : undefined,
    type: "article",
    section: "posts",
    extraHead: post.hasTweet ? TWITTER_WIDGET : "",
    content: `<article><h1>${esc(post.title)}</h1><time>${esc(post.date)}</time>${post.html}</article>`,
  });
}

export function notesIndexPage(origin: string) {
  return layout({
    title: `Notes | ${SITE_TITLE}`,
    description: "dak2 のスクラップ。考えたことや調べたことを追記していくメモ。",
    url: origin + "/notes",
    section: "notes",
    content: `<h1 class="page-title">Notes</h1>${noteList(notes)}`,
  });
}

export function notePage(origin: string, slug: string) {
  const note = findNote(slug);
  if (!note) return undefined;
  const status = note.closed
    ? `<p class="scrap-closed">このスクラップはクローズされています</p>`
    : "";
  return layout({
    title: `${note.title} | ${SITE_TITLE}`,
    description: excerpt(note.comments[0]?.html ?? ""),
    url: `${origin}/notes/${note.slug}`,
    type: "article",
    section: "notes",
    extraHead: note.hasTweet ? TWITTER_WIDGET : "",
    content: `<article class="scrap">
  <h1 class="scrap-title">${esc(note.title)}</h1>
  <div class="scrap-row-meta">
    <span class="badge ${note.closed ? "badge-closed" : "badge-open"}">${note.closed ? "Closed" : "Open"}</span>
    <span>作成 <time>${esc(note.created)}</time></span>
    <span>更新 <time>${esc(note.updated)}</time></span>
    <span>${note.comments.length} comments</span>
  </div>
  <div class="scrap-comments">${note.comments.map(commentCard).join("")}</div>
  ${status}
</article>
<p class="back"><a href="/notes">← Notes 一覧</a></p>`,
  });
}

export function slidesPage(origin: string) {
  return layout({
    title: `Slides | ${SITE_TITLE}`,
    description: "dak2 の登壇資料",
    url: origin + "/slides",
    section: "slides",
    content: `<h1 class="page-title">Slides</h1><ul class="slides">${slides.map(slideCard).join("")}</ul>`,
  });
}

// RSS は Posts と Notes をまとめて新しい順に
export function feedXml(origin: string) {
  const items = [
    ...posts.map((p) => ({ title: p.title, url: `${origin}/posts/${p.slug}`, date: p.date, desc: p.description })),
    ...notes.map((n) => ({ title: n.title, url: `${origin}/notes/${n.slug}`, date: n.updated, desc: excerpt(n.comments.at(-1)?.html ?? "") })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (i) =>
        `<item><title>${esc(i.title)}</title><link>${i.url}</link><guid>${i.url}</guid><pubDate>${new Date(i.date).toUTCString()}</pubDate><description>${esc(i.desc)}</description></item>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${SITE_TITLE}</title><link>${origin}</link><description>${esc(SITE_DESCRIPTION)}</description>${items}</channel></rss>`;
}

export function notFoundResponse(origin: string, pathname: string) {
  const body = layout({
    title: `Not Found | ${SITE_TITLE}`,
    url: origin + pathname,
    content: `<h1 class="page-title">404</h1><p>ページが見つかりません。</p>`,
  });
  return new Response(body, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
}
