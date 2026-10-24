export type Ogp = { title?: string; description?: string; image?: string; siteName?: string };
export const CACHE_FILE: URL;
export const TWEET_RE: RegExp;
export function cardUrlOfLine(line: string): string | undefined;
export function standaloneUrls(md: string): string[];
export function fetchOgp(url: string): Promise<Ogp>;
export function readCache(): Promise<Record<string, Ogp>>;
export function mergeIntoCache(entries: Record<string, Ogp>): Promise<Record<string, Ogp>>;
