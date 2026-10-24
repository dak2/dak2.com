// GET /posts  記事一覧
import { defineHandler } from "void";
import { postsIndexPage, siteOrigin } from "../../src/pages";

export const GET = defineHandler((c) => postsIndexPage(siteOrigin(c.req.url)));
