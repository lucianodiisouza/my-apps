# my-apps

The catalog for everything I build: open-source projects and apps I've talked about on my social media content, all in one place, at **https://apps.oprimo.dev**.

**Not** a dev portfolio. It's an app directory, and every app gets its own static page (`/primoengine/`, `/semaphore/`…) built for search engines and AI assistants: a direct "O que é o X?" answer, features, FAQ, a spec sheet and JSON-LD (`SoftwareApplication`, `FAQPage`, `BreadcrumbList`, `Person`).

Copy is in pt-BR. Look and type follow the PrimoDev brand book (Ink + Primo Cyan, Clash Display).

## Editing the catalog

All content lives in [`projects.js`](projects.js); the comment at the top lists every field. The short version:

```js
{
  slug: "semaphore",            // the page lives at /semaphore/. Don't change it once published
  name: "Semaphore",
  icon: "semaphore.png",        // optional, in public/icons (128px). Without one the page uses the initial
  cover: "semaphore-cover.jpg", // optional 1200x630 in public/img: home card + og:image
  tagline: "One line",
  summary: "O que é o Semaphore? in two sentences. The bit Google and AI assistants quote.",
  category: "dev-tools",        // one of CATEGORIES
  platforms: ["macOS"],
  tech: ["Rust"],
  github: "https://github.com/...",
  features: [...], faq: [{ q, a }], guides: [{ title, url }], youtube: "videoId",
}
```

Open-source projects need almost nothing else: stars, forks, license, latest release and the README come from GitHub.

## How it builds

- `scripts/fetch-github.mjs` pulls GitHub data into `data/github.json` (committed). A GitHub Action runs it every 6 hours and commits changes, which triggers a deploy.
- `scripts/build.mjs` reads `projects.js`, `data/github.json` and `public/`, and writes the whole site to `dist/`: home, one page per app, one per category, `404.html`, `sitemap.xml`, `robots.txt` and `llms.txt`. No dependencies, no network.

Old share links (`/#semaphore`) redirect to the app's page.

## Running locally

```sh
node scripts/build.mjs && npx serve dist
```

To refresh GitHub data by hand: `GITHUB_TOKEN=$(gh auth token) node scripts/fetch-github.mjs`.

## Deploying

Vercel, configured by [`vercel.json`](vercel.json): build command `node scripts/build.mjs`, output `dist`. Domain: `apps.oprimo.dev`.
