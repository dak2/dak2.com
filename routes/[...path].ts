// 上のどれにも当たらないパス → 404 ページ（静的ファイルはこれより先に配信される）
import { defineHandler } from "void";
import { notFoundResponse, siteOrigin } from "../src/pages";

export const GET = defineHandler((c) => notFoundResponse(siteOrigin(c.req.url), c.req.path));
