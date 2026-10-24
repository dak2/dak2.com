// GET /slides
import { defineHandler } from "void";
import { slidesPage, siteOrigin } from "../src/pages";

export const GET = defineHandler((c) => slidesPage(siteOrigin(c.req.url)));
