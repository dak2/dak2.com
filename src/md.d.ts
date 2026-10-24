// build/markdown.ts が .md を { title, date, description, image, hasTweet, html } に変換する
declare module "*.md" {
  const entry: {
    title: string;
    date: string;
    description: string;
    image?: string;
    closed: boolean;
    hasTweet: boolean;
    html: string;
    entries: { at: string; html: string }[];
  };
  export default entry;
}
