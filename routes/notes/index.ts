// GET /notes  メモ一覧（本文まで表示）
import { defineHandler } from "void";
import { notesIndexPage, siteOrigin } from "../../src/pages";

export const GET = defineHandler((c) => notesIndexPage(siteOrigin(c.req.url)));
