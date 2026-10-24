// GET /posts/:slug  記事ページ
import { defineHandler } from "void";
import { postPage, notFoundResponse, siteOrigin } from "../../src/pages";

export const GET = defineHandler((c) => {
  const origin = siteOrigin(c.req.url);
  return postPage(origin, c.req.param("slug") ?? "") ?? notFoundResponse(origin, c.req.path);
});
