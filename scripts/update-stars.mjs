// Refreshes the `stars` field of each project in projects.js from the GitHub API.
// Rule: sum stargazers of every unique github.com repo referenced by a project
// (its `github` field plus any github.com URL in `links`). Projects without a
// GitHub repo (e.g. closed source) are left untouched.
//
// Run: node scripts/update-stars.mjs   (uses $GITHUB_TOKEN if set for rate limit)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "..", "projects.js");

const src = fs.readFileSync(FILE, "utf8");
const PROJECTS = eval(`${src}\nPROJECTS`); // projects.js is a plain script, not a module

const repoOf = (url) => {
  const m = /github\.com\/([^/]+)\/([^/#?]+)/.exec(url || "");
  return m ? `${m[1]}/${m[2].replace(/\.git$/, "")}` : null;
};

const token = process.env.GITHUB_TOKEN;
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "update-stars-script",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const cache = new Map();
async function stars(repo) {
  if (cache.has(repo)) return cache.get(repo);
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${repo}`);
  const count = (await res.json()).stargazers_count ?? 0;
  cache.set(repo, count);
  return count;
}

const newStars = {};
for (const p of PROJECTS) {
  const repos = new Set(
    [p.github, ...(p.links || []).map((l) => l.url)].map(repoOf).filter(Boolean)
  );
  if (repos.size === 0) continue; // no GitHub repo -> leave stars as-is
  let total = 0;
  for (const repo of repos) total += await stars(repo);
  newStars[p.slug] = total;
}

// Minimal-diff rewrite: replace the `stars:` line inside each project block,
// keyed by the preceding `slug:` line.
let currentSlug = null;
const out = src.split("\n").map((line) => {
  const slugMatch = /^\s*slug:\s*"([^"]+)"/.exec(line);
  if (slugMatch) currentSlug = slugMatch[1];
  const starsMatch = /^(\s*)stars:\s*.+,\s*$/.exec(line);
  if (starsMatch && currentSlug && newStars[currentSlug] !== undefined) {
    return `${starsMatch[1]}stars: ${newStars[currentSlug]},`;
  }
  return line;
});

fs.writeFileSync(FILE, out.join("\n"));
console.log("Updated stars:", newStars);
