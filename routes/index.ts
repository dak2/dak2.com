// GET /  トップ（各セクションの新着）
import { defineHandler } from "void";
import { homePage, siteOrigin } from "../src/pages";

export const GET = defineHandler((c) => homePage(siteOrigin(c.req.url)));
