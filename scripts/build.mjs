// Builds the static site into dist/: the home, one page per app, one page per
// category, plus sitemap.xml, robots.txt and llms.txt. Reads only local files
// (projects.js, data/github.json, public/), so it runs anywhere with Node 18+
// and never calls the network.
//
// Run: node scripts/build.mjs        then: npx serve dist
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SITE = "https://apps.oprimo.dev";

const { PROJECTS, CATEGORIES } = createRequire(import.meta.url)(path.join(ROOT, "projects.js"));
const GH = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "github.json"), "utf8"));

const AUTHOR = {
  name: "Luciano dii Souza",
  alt: "PrimoDev",
  photo: "/img/luciano.jpg",
  bio: "Eu construo apps de verdade e mostro o processo no canal O Primo Dev: o código, as decisões e o que deu errado. Os apps daqui nasceram de problemas meus, e a maioria é open source.",
  social: [
    { label: "YouTube", url: "https://youtube.com/c/OPrimoDev" },
    { label: "Instagram", url: "https://instagram.com/oprimo.dev" },
    { label: "LinkedIn", url: "https://linkedin.com/in/lucianodiisouza" },
    { label: "GitHub", url: "https://github.com/lucianodiisouza" },
    { label: "X", url: "https://twitter.com/oprimodev" },
    { label: "Twitch", url: "https://twitch.tv/oprimodev" },
  ],
};

// ---------- data ----------

const catBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
for (const p of PROJECTS) {
  if (!catBySlug[p.category]) throw new Error(`${p.slug}: unknown category "${p.category}"`);
  p.gh = GH[p.slug] || null;
  p.stars = p.gh?.stars || 0;
  p.url = `/${p.slug}/`;
}

// Featured first, then new, then by stars; work in progress sinks.
const rank = (a, b) =>
  !!b.pinned - !!a.pinned || !!b.isNew - !!a.isNew || !!a.wip - !!b.wip || b.stars - a.stars;
const sorted = [...PROJECTS].sort(rank);

const totalStars = PROJECTS.reduce((n, p) => n + p.stars, 0);
const ossCount = PROJECTS.filter((p) => p.github).length;

// ---------- helpers ----------

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)).replace(/[,.:;]$/, "") + "…");

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");

const fmtNum = (n) => n.toLocaleString("pt-BR");

const plural = (n, one, many) => `${fmtNum(n)} ${n === 1 ? one : many}`;

const mono = (name) => name.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();

// Content-hashed asset URLs, so a deploy never serves a stale stylesheet.
const hashed = (file) => {
  const h = crypto.createHash("sha1").update(fs.readFileSync(path.join(ROOT, "public", file))).digest("hex");
  return `/${file}?v=${h.slice(0, 8)}`;
};
const CSS = hashed("styles.css");
const JS = hashed("app.js");

const I = {
  arrow: `<svg class="ic" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  out: `<svg class="ic" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>`,
  star: `<svg class="ic" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>`,
  down: `<svg class="ic" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 10l6 6 6-6M5 20h14"/></svg>`,
  link: `<svg class="ic" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>`,
  search: `<svg class="ic" aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
  play: `<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  readme: `<svg class="ic" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>`,
};

const appIcon = (p, size, cls = "") =>
  p.icon
    ? `<img class="app-icon ${cls}" src="/icons/${p.icon}" alt="" width="${size}" height="${size}" loading="lazy">`
    : `<span class="app-icon mono ${cls}" style="--s:${size}px" aria-hidden="true">${mono(p.name)}</span>`;

const badges = (p) =>
  (p.isNew ? `<span class="badge new">Novo</span>` : "") + (p.wip ? `<span class="badge wip">Em construção</span>` : "");

const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

const personLd = {
  "@type": "Person",
  "@id": `${SITE}/#luciano`,
  name: AUTHOR.name,
  alternateName: AUTHOR.alt,
  image: SITE + AUTHOR.photo,
  url: `${SITE}/`,
  sameAs: AUTHOR.social.map((s) => s.url),
};

// ---------- layout ----------

function layout({ title, description, canonical, image, body, ld = [], home = false }) {
  const og = image ? SITE + image : null;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Apps do PrimoDev">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${canonical}">
${og ? `<meta property="og:image" content="${og}">\n<meta name="twitter:card" content="summary_large_image">` : `<meta name="twitter:card" content="summary">`}
<meta name="twitter:site" content="@oprimodev">
<meta name="theme-color" content="#080E14">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${CSS}">
<link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt">
${ld.map(jsonLd).join("\n")}
</head>
<body${home ? ' class="home"' : ""}>
<a class="skip" href="#conteudo">Pular pro conteúdo</a>
${header(home)}
<div id="conteudo">
${body}
</div>
${footer()}
<div class="toast" role="status" aria-live="polite"></div>
<script src="${JS}" defer></script>
<script>window.goatcounter = { path: () => location.pathname + location.hash };</script>
<script data-goatcounter="https://oprimodev.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
`;
}

function header(home) {
  return `<header class="topbar">
<div class="wrap topbar-in">
<a class="brand" href="/">PrimoDev<span>/ apps</span></a>
<nav class="topnav" aria-label="Principal">
<a href="/#apps">Apps</a>
<a href="/#sobre">Sobre mim</a>
<a href="${AUTHOR.social[0].url}" rel="me">YouTube</a>
</nav>
${home ? `<label class="search">
<span class="sr">Buscar apps</span>
${I.search}
<input id="search" type="search" placeholder="Buscar: teleprompter, finanças…" autocomplete="off">
</label>` : ""}
</div>
</header>`;
}

// Same footer as dock.oprimo.dev and engine.oprimo.dev (brand · columns ·
// more from Primo · socials · rights), so every oprimo.dev site reads as one
// family. "Mais do Primo" and the socials mirror MORE_FROM_PRIMO and SOCIALS in
// primoengine-landing/src/config.ts: keep them in sync.
const FOOTER_APPS = [
  ["PrimoDock", "/primodock/", "Um Dock por mesa"],
  ["PrimoEngine", "/primoengine/", "Wallpapers vivos no Mac e no PC"],
  ["PrimoRec", "/primorec/", "Câmera para creators no iPhone"],
  ["criador.studio", "/criador-studio/", "Programa de criadores com cupom"],
  ["FDBK", "/fdbk/", "Feedback boards para times de produto"],
  ["Recta", "/recta/", "Finanças pessoais"],
];
const MORE_FROM_PRIMO = [
  ["Media Kit", "https://media.oprimo.dev", "Media kit e brand book"],
  ["Primo Academy", "https://aprenda.oprimo.dev", "Roadmaps de programação em português"],
  ["Censo de IA", "https://ai.oprimo.dev", "Uso de IA no Brasil"],
  ["Pokerface", "https://poker.oprimo.dev", "Planning poker open source"],
  ["Portfólio", "https://oprimo.dev", "O Primo Dev"],
];
const SOCIALS = [
  ["YouTube", "https://youtube.com/@oprimodev"],
  ["Instagram", "https://instagram.com/oprimo.dev"],
  ["LinkedIn", "https://linkedin.com/in/lucianodiisouza"],
  ["X", "https://x.com/oprimodev"],
  ["TikTok", "https://tiktok.com/@oprimodev"],
  ["Bluesky", "https://bsky.app/profile/oprimo.dev"],
  ["Twitch", "https://twitch.tv/oprimodev"],
  ["Threads", "https://threads.net/@oprimo.dev"],
];

function footer() {
  const col = (title, items) => `<nav aria-label="${title}">
<h2>${title}</h2>
<ul>${items
    .map(([name, href, blurb]) => {
      const ext = href.startsWith("http") ? ' target="_blank" rel="noopener"' : "";
      return `<li><a href="${href}"${ext}>${esc(name)}</a>${blurb ? `<span class="footer-blurb">${esc(blurb)}</span>` : ""}</li>`;
    })
    .join("")}</ul>
</nav>`;
  return `<footer class="footer">
<div class="wrap footer-grid">
<div>
<p class="footer-brand"><img src="/favicon.svg" alt="" width="18" height="18"><span>PrimoDev<span class="muted"> / apps</span></span></p>
<p class="footer-tagline">Todos os apps e projetos open source que eu construo, num lugar só. Feito no Brasil.</p>
</div>
${col("Catálogo", [["Todos os apps", "/#apps"], ...CATEGORIES.map((c) => [c.name, `/categorias/${c.slug}/`]), ["Sobre mim", "/#sobre"], ["Contato", "mailto:apps@oprimo.dev"]])}
${col("Apps", FOOTER_APPS)}
${col("Mais do Primo", MORE_FROM_PRIMO)}
</div>
<div class="wrap footer-rights">
<ul class="footer-social" aria-label="Redes">${SOCIALS.map(([name, href]) => `<li><a href="${href}" target="_blank" rel="noopener me">${name}</a></li>`).join("")}</ul>
<p>© ${new Date().getFullYear()} oprimo.dev. Todos os direitos reservados.</p>
</div>
</footer>`;
}

function authorBlock() {
  return `<section id="sobre" class="about wrap" aria-labelledby="sobre-h">
<img class="about-photo" src="${AUTHOR.photo}" alt="Foto do Luciano dii Souza" width="280" height="280" loading="lazy">
<div class="about-text">
<p class="eyebrow">Quem faz</p>
<h2 id="sobre-h" class="h-xl">Luciano dii Souza, o PrimoDev.</h2>
<p class="lead muted">${esc(AUTHOR.bio)}</p>
<div class="btn-row">
<a class="btn primary" href="${AUTHOR.social[0].url}" rel="me">Assistir no YouTube</a>
${AUTHOR.social.slice(1, 4).map((s) => `<a class="btn ghost" href="${s.url}" rel="me">${s.label}</a>`).join("")}
</div>
</div>
</section>`;
}

// On the home, featured apps already have big cards, so their rows start
// hidden and app.js shows them when a category or search is active.
function row(p, home = false) {
  const hay = [p.name, p.tagline, p.summary, catBySlug[p.category].name, ...p.platforms, ...p.tech]
    .join(" ")
    .toLowerCase();
  return `<a class="row card" href="${p.url}" data-cat="${p.category}" data-q="${esc(hay)}"${home && p.pinned ? " data-pinned hidden" : ""}>
${appIcon(p, 56)}
<span class="row-text">
<span class="row-title"><span class="name">${esc(p.name)}</span>${badges(p)}</span>
<span class="row-tag">${esc(p.tagline)}</span>
<span class="row-meta">${esc([...p.platforms, ...p.tech.slice(0, 2)].join(" · "))}</span>
</span>
${p.stars ? `<span class="row-stars" title="Estrelas no GitHub">${I.star}${fmtNum(p.stars)}</span>` : ""}
</a>`;
}

// ---------- home ----------

function homePage() {
  const featured = sorted.filter((p) => p.pinned);
  // The big bento card needs a hero image; the rest use their cover.
  const lead = featured.find((p) => p.hero);
  const rest = featured.filter((p) => p !== lead);
  const spot = PROJECTS.find((p) => p.spotlight);
  const others = sorted.filter((p) => !p.pinned);

  const body = `<main>
<section class="hero wrap">
<div class="hero-text">
<p class="eyebrow">Apps do PrimoDev</p>
<h1 class="h-hero">Coisas que eu<br>construí.</h1>
<p class="lead muted">Viu um app num vídeo ou post meu? Todos os apps e projetos open source que eu lanço estão aqui, cada um com página própria: o que faz, pra quem é, quanto custa e onde baixar.</p>
<dl class="stats">
<div><dt>Apps e projetos</dt><dd>${PROJECTS.length}</dd></div>
<div><dt>Open source</dt><dd>${ossCount}</dd></div>
<div><dt>Estrelas no GitHub</dt><dd>${fmtNum(totalStars)}</dd></div>
</dl>
</div>
${spot ? `<a class="spot card" href="${spot.url}">
<img src="/img/${spot.cover}" alt="" width="1200" height="630">
<span class="spot-body">
<span class="eyebrow sm">Lançamento mais recente</span>
<span class="spot-title"><span class="h-md">${esc(spot.name)}</span>${I.arrow}</span>
<span class="muted">${esc(spot.tagline)}</span>
</span>
</a>` : ""}
</section>

<section class="wrap featured" aria-labelledby="dest">
<div class="sec-head"><h2 id="dest" class="h-lg">Os que eu uso todo dia</h2><span class="muted">Produtos com site próprio</span></div>
<div class="bento">
<a class="bento-lead card" href="${lead.url}">
<img class="bento-bg" src="/img/${lead.hero}" alt="" width="1400" height="875">
<span class="bento-scrim" aria-hidden="true"></span>
<span class="bento-body">
${appIcon(lead, 84)}
<span class="bento-text">
<span class="small">${esc(lead.platforms.join(" · "))}</span>
<span class="h-lg">${esc(lead.name)}</span>
<span>${esc(lead.tagline)}</span>
</span>
<span class="btn primary">Ver app</span>
</span>
</a>
${rest
  .map(
    (p) => `<a class="bento-item card" href="${p.url}">
<img class="cover" src="/img/${p.cover}" alt="" width="1200" height="630" loading="lazy">
<span class="bento-meta">
${appIcon(p, 48)}
<span class="bento-meta-text"><span class="name">${esc(p.name)}</span><span class="muted ellipsis">${esc(p.tagline)}</span></span>
${I.arrow}
</span>
</a>`
  )
  .join("\n")}
</div>
</section>

<section id="apps" class="all" aria-labelledby="todos">
<div class="wrap">
<div class="sec-head"><h2 id="todos" class="h-lg">Todos os apps</h2><span class="muted" id="count">${plural(others.length, "app", "apps")}</span></div>
<nav class="tabs" aria-label="Categorias">
<a href="/#apps" data-cat="" aria-current="true">Todos <span>${others.length}</span></a>
${CATEGORIES.map((c) => {
  const n = PROJECTS.filter((p) => p.category === c.slug).length;
  return n ? `<a href="/categorias/${c.slug}/" data-cat="${c.slug}">${esc(c.short)} <span>${n}</span></a>` : "";
}).join("\n")}
</nav>
<div class="rows" id="rows">
${sorted.map((p) => row(p, true)).join("\n")}
</div>
<p class="empty" id="empty" hidden>Nada com esse nome. Tenta outra palavra ou <button type="button" class="linkish" id="clear">limpa a busca</button>.</p>
</div>
</section>

${authorBlock()}
</main>`;

  return layout({
    title: "Apps do PrimoDev: todos os apps e projetos do Luciano dii Souza",
    description:
      "Catálogo de apps e projetos open source do PrimoDev (Luciano dii Souza): utilitários pro Mac, ferramentas pra devs, apps pra criadores e mais, cada um com página própria.",
    canonical: "/",
    image: `/img/${PROJECTS.find((p) => p.spotlight)?.cover || "primoengine-cover.jpg"}`,
    home: true,
    body,
    ld: [
      {
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", "@id": `${SITE}/#site`, url: `${SITE}/`, name: "Apps do PrimoDev", inLanguage: "pt-BR", publisher: { "@id": personLd["@id"] } },
          personLd,
          {
            "@type": "ItemList",
            name: "Apps do PrimoDev",
            itemListElement: sorted.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + p.url, name: p.name })),
          },
        ],
      },
    ],
  });
}

// ---------- app page ----------

const appCategory = {
  "dev-tools": "DeveloperApplication",
  conteudo: "MultimediaApplication",
  mac: "UtilitiesApplication",
  produtividade: "BusinessApplication",
  educacao: "EducationalApplication",
  negocios: "BusinessApplication",
};

// GitHub's rendered README puts each heading's id on a sibling permalink
// (<a id="user-content-x" class="anchor">) and leaves relative paths relative
// to the repo. Move the ids onto the headings, prefixed so they can't clash
// with the page's own (#faq, #readme…), and make paths absolute.
function readmeHtml(p) {
  const { repo, branch, readme } = p.gh;
  const raw = `https://raw.githubusercontent.com/${repo}/${branch}/`;
  const blob = `https://github.com/${repo}/blob/${branch}/`;
  const abs = (base, u) => (/^([a-z]+:|#|\/\/)/i.test(u) ? u : base + u.replace(/^\.?\//, ""));
  return readme
    .replace(
      /<div class="markdown-heading"[^>]*>\s*<(h[1-6])[^>]*>([\s\S]*?)<\/\1>\s*<a id="user-content-([^"]*)" class="anchor"[\s\S]*?<\/a>\s*<\/div>/g,
      '<$1 id="readme-$3">$2</$1>'
    )
    .replace(/<\/?markdown-accessiblity-table>/g, "")
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/, "") // the repo name: already the page's h1
    .replace(/ id="user-content-/g, ' id="readme-')
    .replace(/ id=""/g, "")
    .replace(/<img([^>]*?) src="([^"]+)"/g, (_, a, u) => `<img${a} loading="lazy" src="${abs(raw, u)}"`)
    .replace(/<a([^>]*?) href="([^"]+)"/g, (_, a, u) => `<a${a} href="${abs(blob, u)}"`)
    .replace(/<a([^>]*?) href="#(?:user-content-)?/g, '<a$1 href="#readme-');
}

function primaryAction(p) {
  if (p.site) return { label: `Abrir ${p.site.label}`, url: p.site.url, icon: I.out };
  if (p.gh?.release) return { label: `Baixar ${p.gh.release.tag}`, url: p.gh.release.url, icon: I.down };
  return { label: "Ver no GitHub", url: p.github, icon: I.out };
}

function appPage(p) {
  const cat = catBySlug[p.category];
  const gh = p.gh;
  const main = primaryAction(p);
  const secondary = [];
  if (p.github && main.url !== p.github) secondary.push({ label: "Ver no GitHub", url: p.github });
  if (gh?.release && !main.url.includes("/releases/")) secondary.push({ label: `Release ${gh.release.tag}`, url: gh.release.url });
  for (const l of p.links) if (l.url !== p.github) secondary.push(l);
  const related = sorted.filter((x) => x.category === p.category && x !== p).slice(0, 4);
  const license = gh?.license;
  const chips = [
    ...p.platforms,
    p.price,
    p.github ? (license ? `Open source · ${license}` : "Open source") : null,
    gh?.release?.tag,
  ].filter(Boolean);

  const spec = [
    ["Plataformas", p.platforms.join(", ")],
    ["Requisitos", p.requirements],
    ["Preço", p.price || (p.github ? "Grátis (open source)" : null)],
    ["Feito com", p.tech.join(", ")],
    ["Código", p.github ? `Aberto${license ? ` · ${license}` : ""}` : "Fechado"],
    ["Idiomas", p.languages?.join(", ")],
  ].filter(([, v]) => v);

  const links = [
    p.site && { label: "Site oficial", hint: p.site.label, url: p.site.url },
    p.github && { label: "Código-fonte", hint: "GitHub", url: p.github },
    p.feedback && { label: "Sugestões e bugs", hint: "FDBK", url: p.feedback },
    ...p.links.filter((l) => l.url !== p.github).map((l) => ({ label: l.label, hint: new URL(l.url).hostname.replace(/^www\./, ""), url: l.url })),
  ].filter(Boolean);

  const body = `<main class="wrap app">
<nav class="crumbs" aria-label="Você está em">
<ol><li><a href="/">Apps</a></li><li><a href="/categorias/${cat.slug}/">${esc(cat.name)}</a></li><li aria-current="page">${esc(p.name)}</li></ol>
</nav>

<section class="app-head">
<div class="app-id">
${appIcon(p, 120, "xl")}
<div>
<h1 class="h-app">${esc(p.name)}${badges(p)}</h1>
<p class="app-tag">${esc(p.tagline)}</p>
<ul class="chips">${chips.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
</div>
</div>
<div class="app-cta">
<a class="btn primary lg" href="${main.url}">${esc(main.label)} ${main.icon}</a>
<div class="btn-row">
${secondary.slice(0, 2).map((l) => `<a class="btn ghost" href="${l.url}">${esc(l.label)}</a>`).join("")}
<button class="btn ghost copy" type="button" data-url="${SITE}${p.url}">${I.link} Copiar link</button>
</div>
</div>
</section>

${p.hero ? `<figure class="app-hero">
<img src="/img/${p.hero}" alt="${esc(p.heroAlt || p.name)}" width="1400" height="875">
${p.heroCaption ? `<figcaption class="muted">${esc(p.heroCaption)}</figcaption>` : ""}
</figure>` : ""}

<div class="app-body">
<div class="app-main">

<section aria-labelledby="oque">
<h2 id="oque" class="h-lg">O que é o ${esc(p.name)}?</h2>
<p class="answer">${esc(p.summary)}</p>
${p.details ? `<p class="lead muted">${esc(p.details)}</p>` : ""}
</section>

${p.features?.length ? `<section aria-labelledby="faz">
<h2 id="faz" class="h-lg">O que ele faz</h2>
<ol class="numbered">${p.features.map((f, i) => `<li><span class="num">${String(i + 1).padStart(2, "0")}</span><span>${esc(f)}</span></li>`).join("")}</ol>
</section>` : ""}

${p.youtube ? `<section aria-labelledby="yt">
<h2 id="yt" class="h-lg">Visto no canal</h2>
<a class="video" href="https://www.youtube.com/watch?v=${esc(p.youtube)}">
<img src="https://i.ytimg.com/vi/${esc(p.youtube)}/maxresdefault.jpg" alt="Vídeo sobre o ${esc(p.name)} no canal O Primo Dev" width="1280" height="720" loading="lazy">
<span class="play">${I.play}</span>
</a>
</section>` : ""}

${p.faq?.length ? `<section aria-labelledby="faq">
<h2 id="faq" class="h-lg">Perguntas frequentes</h2>
<dl class="faq">${p.faq.map((f) => `<div><dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd></div>`).join("")}</dl>
</section>` : ""}

${p.guides?.length ? `<section aria-labelledby="guias">
<h2 id="guias" class="h-lg">Guias</h2>
<div class="guides">${p.guides
  .map((g) => `<a class="card guide" href="${g.url}"><span class="small muted">${esc(new URL(g.url).hostname)}</span><span class="name">${esc(g.title)}</span></a>`)
  .join("")}</div>
</section>` : ""}

${gh?.readme ? `<section aria-labelledby="docs">
<h2 id="docs" class="h-lg">Documentação</h2>
<p class="note">${I.readme}<span>README do repositório <a href="https://github.com/${gh.repo}">${esc(gh.repo)}</a>, atualizado a cada deploy. O texto original é em inglês.</span></p>
<div class="readme">${readmeHtml(p)}</div>
</section>` : ""}
</div>

<aside class="app-side" aria-label="Ficha técnica">
<div class="panel">
<h2 class="eyebrow sm">Ficha técnica</h2>
<dl class="spec">${spec.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}<dt>Categoria</dt><dd><a href="/categorias/${cat.slug}/">${esc(cat.name)}</a></dd></dl>
</div>
${gh ? `<div class="panel">
<h2 class="eyebrow sm">Repositório</h2>
<div class="repo-stats"><div><span class="small muted">Estrelas</span><span class="h-md">${fmtNum(gh.stars)}</span></div><div><span class="small muted">Forks</span><span class="h-md">${fmtNum(gh.forks)}</span></div></div>
<dl class="spec">
${gh.release ? `<dt>Versão</dt><dd>${esc(gh.release.tag)}</dd><dt>Lançada em</dt><dd>${fmtDate(gh.release.date)}</dd>` : ""}
${gh.language ? `<dt>Linguagem</dt><dd>${esc(gh.language)}</dd>` : ""}
</dl>
</div>` : ""}
${links.length ? `<div class="panel">
<h2 class="eyebrow sm">Links</h2>
<ul class="links">${links.map((l) => `<li><a href="${l.url}"><span>${esc(l.label)}</span><span class="muted">${esc(l.hint)}</span></a></li>`).join("")}</ul>
</div>` : ""}
<div class="panel byline">
<div class="byline-id"><img src="${AUTHOR.photo}" alt="" width="56" height="56" loading="lazy"><span><span class="small muted">Feito por</span><a class="name" href="/#sobre">${AUTHOR.name}</a></span></div>
<p class="small muted">Eu mostro como construo cada app no canal O Primo Dev.</p>
<a class="btn ghost block" href="${AUTHOR.social[0].url}" rel="me">Ver o canal</a>
</div>
</aside>
</div>

${related.length ? `<section class="related" aria-labelledby="rel">
<h2 id="rel" class="h-md">Mais apps: ${esc(cat.name)}</h2>
<div class="rows compact">${related.map((x) => row(x)).join("\n")}</div>
</section>` : ""}
</main>`;

  const offer = p.price?.startsWith("Grátis") || p.github ? { "@type": "Offer", price: "0", priceCurrency: "BRL" } : undefined;
  const graph = [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}${p.url}#app`,
      name: p.name,
      description: p.summary,
      url: SITE + p.url,
      applicationCategory: appCategory[p.category],
      operatingSystem: p.platforms.join(", "),
      ...(p.icon && { image: `${SITE}/icons/${p.icon}` }),
      ...(p.cover && { screenshot: `${SITE}/img/${p.cover}` }),
      ...(gh?.release && { softwareVersion: gh.release.tag }),
      ...(offer && { offers: offer }),
      ...(license && { license: `https://spdx.org/licenses/${license}.html` }),
      inLanguage: "pt-BR",
      author: { "@id": personLd["@id"] },
      sameAs: [p.site?.url, p.github].filter(Boolean),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Apps", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: cat.name, item: `${SITE}/categorias/${cat.slug}/` },
        { "@type": "ListItem", position: 3, name: p.name, item: SITE + p.url },
      ],
    },
    personLd,
  ];
  if (p.faq?.length)
    graph.push({
      "@type": "FAQPage",
      mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });

  return layout({
    title: `${p.name}: ${p.tagline} · Apps do PrimoDev`,
    description: clip(p.summary, 158),
    canonical: p.url,
    image: p.cover ? `/img/${p.cover}` : null,
    body,
    ld: [{ "@context": "https://schema.org", "@graph": graph }],
  });
}

// ---------- category page ----------

function categoryPage(c) {
  const list = sorted.filter((p) => p.category === c.slug);
  const url = `/categorias/${c.slug}/`;
  const body = `<main class="wrap catpage">
<nav class="crumbs" aria-label="Você está em"><ol><li><a href="/">Apps</a></li><li aria-current="page">${esc(c.name)}</li></ol></nav>
<p class="eyebrow">Categoria</p>
<h1 class="h-hero sm">${esc(c.name)}</h1>
<p class="lead muted">${plural(list.length, "app ou projeto", "apps e projetos")} do PrimoDev nessa categoria.</p>
<div class="rows">${list.map((x) => row(x)).join("\n")}</div>
<nav class="tabs other" aria-label="Outras categorias">${CATEGORIES.filter((x) => x !== c).map((x) => `<a href="/categorias/${x.slug}/">${esc(x.name)}</a>`).join("")}</nav>
</main>`;
  return layout({
    title: `${c.name}: apps do PrimoDev`,
    description: `${c.name}: ${list.map((p) => p.name).join(", ")}. Apps e projetos do Luciano dii Souza.`.slice(0, 158),
    canonical: url,
    body,
    ld: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: c.name,
        url: SITE + url,
        mainEntity: { "@type": "ItemList", itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + p.url, name: p.name })) },
      },
    ],
  });
}

function notFoundPage() {
  return layout({
    title: "Página não encontrada · Apps do PrimoDev",
    description: "Essa página não existe.",
    canonical: "/404",
    body: `<main class="wrap catpage"><p class="eyebrow">404</p><h1 class="h-hero sm">Esse app não está aqui.</h1><p class="lead muted">Pode ter mudado de nome. Dá uma olhada no <a href="/#apps">catálogo completo</a>.</p></main>`,
  });
}

// ---------- llms.txt, sitemap, robots ----------

function llmsTxt() {
  const lines = [
    "# Apps do PrimoDev",
    "",
    `> Catálogo de apps e projetos open source criados por ${AUTHOR.name} (PrimoDev, canal O Primo Dev no YouTube). Cada app tem uma página com o que faz, plataformas, preço, FAQ e links oficiais.`,
    "",
  ];
  for (const c of CATEGORIES) {
    const list = sorted.filter((p) => p.category === c.slug);
    if (!list.length) continue;
    lines.push(`## ${c.name}`, "");
    for (const p of list) lines.push(`- [${p.name}](${SITE}${p.url}): ${p.summary}`);
    lines.push("");
  }
  lines.push("## Autor", "", `- ${AUTHOR.name}: ${AUTHOR.bio}`, ...AUTHOR.social.map((s) => `- ${s.label}: ${s.url}`), "");
  return lines.join("\n");
}

function sitemap() {
  const urls = ["/", ...sorted.map((p) => p.url), ...CATEGORIES.map((c) => `/categorias/${c.slug}/`)];
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
}

// ---------- write ----------

function write(rel, content) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "public"), DIST, { recursive: true });
write("index.html", homePage());
for (const p of PROJECTS) write(`${p.slug}/index.html`, appPage(p));
for (const c of CATEGORIES) write(`categorias/${c.slug}/index.html`, categoryPage(c));
write("404.html", notFoundPage());
write("llms.txt", llmsTxt());
write("sitemap.xml", sitemap());
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${PROJECTS.length} app pages and ${CATEGORIES.length} category pages into dist/`);
