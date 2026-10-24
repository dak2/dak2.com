# dak2.com

Personal site built with Vite + [Void](https://void.cloud), running on Cloudflare Workers.

Requires Node.js >= 24.21.

```sh
npm install
npm run dev      # fetch OGP, start dev server
npm run deploy   # fetch OGP, build, deploy to Cloudflare
```

## Content

| Section | Source |
| --- | --- |
| Profile | `content/profile.md` |
| Posts | `content/posts/<slug>.md` |
| Notes | `content/notes/<slug>.md` (scrap-style: split comments with `@YYYY-MM-DD HH:MM` lines, `closed: true` to close) |
| Slides | `content/slides.json` |

Posts and Notes take frontmatter (`title`, `date`, `description`, `image`). A line containing only a URL becomes a link card, or an embed for X posts. Refresh OGP data with `npm run ogp:refresh`.

## Deploy

Pushing to `main` runs `.github/workflows/void-deploy.yml`.

1. Run `npm run deploy` once locally and commit `void.lock.json`.
2. Add the `CLOUDFLARE_API_TOKEN` repository secret (Workers Scripts: Edit). Add `CLOUDFLARE_ACCOUNT_ID` too if the token covers multiple accounts.
