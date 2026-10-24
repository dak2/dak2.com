// GET /profile
import { defineHandler } from "void";
import { profilePage, siteOrigin } from "../src/pages";

export const GET = defineHandler((c) => profilePage(siteOrigin(c.req.url)));
