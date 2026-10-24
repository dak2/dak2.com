// GET /notes/:slug  メモ単体
import { defineHandler } from "void";
import { notePage, notFoundResponse, siteOrigin } from "../../src/pages";

export const GET = defineHandler((c) => {
  const origin = siteOrigin(c.req.url);
  return notePage(origin, c.req.param("slug") ?? "") ?? notFoundResponse(origin, c.req.path);
});
