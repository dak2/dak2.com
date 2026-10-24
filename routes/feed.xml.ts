// GET /feed.xml  RSS
import { defineHandler } from "void";
import { feedXml, siteOrigin } from "../src/pages";

export const GET = defineHandler((c) =>
  new Response(feedXml(siteOrigin(c.req.url)), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  }),
);
