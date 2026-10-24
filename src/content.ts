// content/ 以下の Markdown は build/markdown.ts（Vite プラグイン）がビルド時に HTML 化している
import profileMd from "../content/profile.md";
import slidesJson from "../content/slides.json";

export type Entry = {
  slug: string;
  title: string;
  date: string;
  description: string;
  image?: string; // og:image 用（サイト内パス or 外部 URL）
  hasTweet: boolean; // X の埋め込みを含むか（widgets.js を読むか）
  html: string;
};

type Module = Omit<Entry, "slug"> & {
  closed: boolean;
  entries: { at: string; html: string }[];
};

function collection(modules: Record<string, Module>): Entry[] {
  return Object.entries(modules)
    .map(([path, mod]) => {
      const slug = path.split("/").pop()!.replace(/\.md$/, "");
      return { ...mod, slug };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
}

// Posts: しっかり書く記事
export const posts = collection(
  import.meta.glob("../content/posts/*.md", { import: "default", eager: true }) as Record<string, Module>,
);

// Notes: Zenn のスクラップ風。1 ファイル = 1 スレッドで、`@日時` の行ごとにコメントを追記していく
export type Comment = { at: string; html: string };
export type Note = {
  slug: string;
  title: string;
  created: string; // 最初のコメントの日時
  updated: string; // 最後のコメントの日時
  closed: boolean;
  hasTweet: boolean;
  comments: Comment[]; // 古い順
};

export const notes: Note[] = Object.entries(
  import.meta.glob("../content/notes/*.md", { import: "default", eager: true }) as Record<string, Module>,
)
  .map(([path, mod]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    // 区切りがないファイルは、本文全体を 1 コメントとして扱う
    const comments = mod.entries.length ? mod.entries : [{ at: mod.date, html: mod.html }];
    comments.sort((a, b) => a.at.localeCompare(b.at));
    return {
      slug,
      title: mod.title || slug,
      created: comments[0]?.at ?? mod.date,
      updated: comments[comments.length - 1]?.at ?? mod.date,
      closed: mod.closed,
      hasTweet: mod.hasTweet,
      comments,
    };
  })
  // 更新が新しい順
  .sort((a, b) => b.updated.localeCompare(a.updated));

export const findPost = (slug: string) => posts.find((p) => p.slug === slug);
export const findNote = (slug: string) => notes.find((n) => n.slug === slug);

// Profile: 1 ページの Markdown
export const profile = profileMd as Module;

// Slides: content/slides.json
export type Slide = {
  title: string;
  date: string; // "2026-04-22" や "2026-04" など
  event?: string;
  url?: string; // Speaker Deck などのスライド URL
  video?: string; // 発表動画の URL
  image?: string; // サムネイル（省略時は url の OGP 画像）
};

export const slides = (slidesJson as Slide[]).slice().sort((a, b) => b.date.localeCompare(a.date));
