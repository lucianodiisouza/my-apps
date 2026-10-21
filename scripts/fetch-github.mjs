// Refreshes data/github.json from the GitHub API: stars, forks, license,
// latest release and the rendered README of every project with a repo.
// The build reads only this file, so deploys never hit the API.
//
// Stars rule (unchanged from the old update-stars script): sum stargazers of
// every unique github.com repo a project references (its `github` field plus
// any github.com URL in `links`). Everything else comes from the main repo.
//
// Run: node scripts/fetch-github.mjs   (uses $GITHUB_TOKEN if set for rate limit)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "github.json");

const src = fs.readFileSync(path.join(ROOT, "projects.js"), "utf8");
const PROJECTS = eval(`${src}\nPROJECTS`); // projects.js is a plain script, not a module

const repoOf = (url) => {
  const m = /github\.com\/([^/]+)\/([^/#?]+)/.exec(url || "");
  return m ? `${m[1]}/${m[2].replace(/\.git$/, "")}` : null;
};

const token = process.env.GITHUB_TOKEN;
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "apps-oprimo-dev",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function api(p, accept) {
  const res = await fetch(`https://api.github.com/${p}`, {
    headers: accept ? { ...headers, Accept: accept } : headers,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${p}`);
  return accept ? res.text() : res.json();
}

const repoCache = new Map();
const repo = async (r) => {
  if (!repoCache.has(r)) repoCache.set(r, await api(`repos/${r}`));
  return repoCache.get(r);
};

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const out = {};

for (const p of PROJECTS) {
  const repos = [
    ...new Set([p.github, ...(p.links || []).map((l) => l.url)].map(repoOf).filter(Boolean)),
  ];
  if (repos.length === 0) continue;
  const main = repos[0];
  try {
    const info = await repo(main);
    if (!info) throw new Error(`repo ${main} not found`);
    let stars = 0;
    for (const r of repos) stars += (await repo(r))?.stargazers_count ?? 0;
    const release = await api(`repos/${main}/releases/latest`);
    const readme = await api(`repos/${main}/readme`, "application/vnd.github.html+json");
    out[p.slug] = {
      repo: main,
      stars,
      forks: info.forks_count,
      license: info.license?.spdx_id && info.license.spdx_id !== "NOASSERTION" ? info.license.spdx_id : null,
      language: info.language,
      branch: info.default_branch,
      release: release
        ? { tag: release.tag_name, date: release.published_at, url: release.html_url }
        : null,
      readme,
    };
  } catch (err) {
    // Keep the last good snapshot rather than dropping the project's data.
    console.warn(`${p.slug}: ${err.message}`);
    if (previous[p.slug]) out[p.slug] = previous[p.slug];
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(
  "Updated:",
  Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.stars]))
);
