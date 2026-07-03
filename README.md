# my-apps

The catalog page for everything I build: open-source projects and apps I've talked about on my social media content, all in one place.

**Not** a dev portfolio. It's an app directory: search it, filter it, share it.

## Editing the catalog

All content lives in [`projects.js`](projects.js). Each entry looks like:

```js
{
  slug: "semaphore",            // stable anchor → share https://your.site/#semaphore
  name: "Semaphore",
  emoji: "🚦",                  // used as the app "icon"
  tagline: "One-line pitch",
  description: "Longer blurb shown on the card.",
  category: "Dev Tools",        // filter chips are generated from these
  platforms: ["macOS"],
  tech: ["Rust"],
  stars: 36,                    // snapshot, update whenever
  github: "https://github.com/...",
  links: [                      // any extra links: demo, App Store, video…
    { label: "Try it", url: "https://..." },
  ],
  featured: true,               // featured cards sort first
}
```

No build step. Edit, refresh, done.

## Running locally

Open `index.html` directly, or:

```sh
npx serve .
```

## Deploying

Lives at **https://apps.oprimo.dev** (Vercel). It's plain static files: no build step, no framework.

First deploy:

```sh
npx vercel --prod
```

(or import the repo in the Vercel dashboard: framework preset "Other", no build command, output dir `.`)

Then add the subdomain: Vercel → Project → Settings → Domains → add `apps.oprimo.dev`. Since `oprimo.dev` DNS setup: add a CNAME record `apps → cname.vercel-dns.com`, or if the apex domain is already on Vercel, the domain just needs to be assigned to this project.
