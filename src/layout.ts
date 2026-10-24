export const SITE_TITLE = "dak2.com";
// 正規 URL（og:url・canonical・RSS はこのドメインで出す）
export const SITE_URL = "https://dak2.com";
export const SITE_DESCRIPTION = "dak2 のサイト。技術的なことや趣味のことまで幅広く";

// ヘッダーのナビゲーション
export const SECTIONS = [
  { key: "profile", label: "Profile", href: "/profile" },
  { key: "posts", label: "Posts", href: "/posts" },
  { key: "notes", label: "Notes", href: "/notes" },
  { key: "slides", label: "Slides", href: "/slides" },
] as const;
export type SectionKey = (typeof SECTIONS)[number]["key"];

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type PageMeta = {
  title: string;
  content: string;
  url: string; // 正規 URL（絶対）
  description?: string;
  image?: string; // og:image（絶対 URL）
  type?: "website" | "article";
  extraHead?: string;
  section?: SectionKey; // ナビで現在地を示す
};

export function layout(m: PageMeta) {
  const desc = m.description || SITE_DESCRIPTION;
  const og = [
    ["og:title", m.title],
    ["og:description", desc],
    ["og:url", m.url],
    ["og:type", m.type ?? "website"],
    ["og:site_name", SITE_TITLE],
    ["og:locale", "ja_JP"],
    ...(m.image ? [["og:image", m.image]] : []),
  ]
    .map(([k, v]) => `<meta property="${k}" content="${esc(v)}">`)
    .join("\n");
  // 画像があれば大きいカード、なければ小さいカード
  const tw = `<meta name="twitter:card" content="${m.image ? "summary_large_image" : "summary"}">`;

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(m.url)}">
${og}
${tw}
<link rel="stylesheet" href="/style.css">
<link rel="alternate" type="application/rss+xml" title="${SITE_TITLE}" href="/feed.xml">
${m.extraHead ?? ""}
</head>
<body>
<header class="site-header">
  <a href="/" class="site-title">${SITE_TITLE}</a>
  <nav class="site-nav">
    ${SECTIONS.map((sec) => `<a href="${sec.href}"${sec.key === m.section ? ' aria-current="page"' : ""}>${sec.label}</a>`).join("\n    ")}
  </nav>
</header>
<main>${m.content}</main>
<footer>© ${new Date().getFullYear()} ${SITE_TITLE}</footer>
</body>
</html>`;
}

export const TWITTER_WIDGET = `<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
