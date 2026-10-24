import { esc } from "../src/layout";

export type Ogp = { title?: string; description?: string; image?: string; siteName?: string };

const TWEET_RE = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/;

export const isTweetUrl = (url: string) => TWEET_RE.test(url);

// X の投稿 → 公式埋め込み（widgets.js が無くても引用＋リンクとして読める）
function tweetEmbed(url: string) {
  const [, user, id] = url.match(TWEET_RE)!;
  const href = `https://twitter.com/${user}/status/${id}`;
  return `<blockquote class="twitter-tweet" data-dnt="true"><a href="${esc(href)}">@${esc(user)} の投稿を見る</a></blockquote>`;
}

// 一般 URL → リンクカード（OGP は scripts/fetch-ogp.mjs が取得したキャッシュを使う）
function linkCard(url: string, o: Ogp = {}) {
  const host = new URL(url).hostname;
  return `<a class="link-card" href="${esc(url)}" target="_blank" rel="noopener">
  <span class="lc-body">
    <span class="lc-title">${esc(o.title || url)}</span>
    ${o.description ? `<span class="lc-desc">${esc(o.description)}</span>` : ""}
    <span class="lc-host">${esc(o.siteName || host)}</span>
  </span>
  ${o.image ? `<img class="lc-image" src="${esc(o.image)}" alt="" loading="lazy" decoding="async">` : ""}
</a>`;
}

export function renderEmbed(url: string, ogp: Record<string, Ogp>) {
  return isTweetUrl(url) ? tweetEmbed(url) : linkCard(url, ogp[url]);
}
