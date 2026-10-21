// Tells Bing, Yandex and the other IndexNow engines about every page in the
// live sitemap, so new or changed pages get crawled in days instead of weeks.
// Run it after a deploy that adds or changes pages. The key is public by
// design: the site serves it at /indexnow.txt to prove it owns the host.
//
// Run: node scripts/indexnow.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://apps.oprimo.dev";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const key = fs.readFileSync(path.join(ROOT, "public", "indexnow.txt"), "utf8").trim();

const xml = await fetch(`${SITE}/sitemap.xml`).then((r) => r.text());
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation: `${SITE}/indexnow.txt`, urlList: urls }),
});
console.log(`indexnow: ${urls.length} URLs, response ${res.status}`);
