// Builds the static site into dist/ in two languages: pt-BR at the root and
// English under /en/. Each language gets the home, one page per app and one
// per category; the pair is linked with hreflang. Also writes 404.html,
// sitemap.xml, robots.txt and llms.txt. Reads only local files (projects.js,
// data/github.json, public/), so it runs anywhere with Node 18+ and never
// calls the network.
//
// Which language a visitor lands on is decided at the edge (vercel.json:
// country, unless they picked one with the toggle, which sets a `lang` cookie).
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

const LOCALES = ["pt", "en"];
const LOC = {
  pt: { lang: "pt-BR", og: "pt_BR", prefix: "", cat: "categorias", number: "pt-BR", currency: "BRL" },
  en: { lang: "en", og: "en_US", prefix: "/en", cat: "categories", number: "en-US", currency: "USD" },
};

// ---------- strings ----------

const T = {
  pt: {
    site: "Apps do PrimoDev",
    skip: "Pular pro conteúdo",
    nav: "Principal",
    about: "Sobre mim",
    search: "Buscar apps",
    searchPh: "Buscar: teleprompter, finanças…",
    switchLang: "English",
    switchLangLabel: "Read this page in English",
    theme: "Alternar tema claro e escuro",
    homeTitle: "Apps do PrimoDev: todos os apps e projetos do Luciano dii Souza",
    homeDesc:
      "Catálogo de apps e projetos open source do PrimoDev (Luciano dii Souza): utilitários pro Mac, ferramentas pra devs, apps pra criadores e mais, cada um com página própria.",
    eyebrow: "Apps do PrimoDev",
    h1: "Coisas que eu<br>construí.",
    lead: "Viu um app num vídeo ou post meu? Todos os apps e projetos open source que eu lanço estão aqui, cada um com página própria: o que faz, pra quem é, quanto custa e onde baixar.",
    statApps: "Apps e projetos",
    statOss: "Open source",
    statStars: "Estrelas no GitHub",
    spotlight: "Lançamento mais recente",
    featured: "Os que eu uso todo dia",
    featuredSub: "Produtos com site próprio",
    seeApp: "Ver app",
    allApps: "Todos os apps",
    all: "Todos",
    categories: "Categorias",
    empty: 'Nada com esse nome. Tenta outra palavra ou <button type="button" class="linkish" id="clear">limpa a busca</button>.',
    starsTitle: "Estrelas no GitHub",
    isNew: "Novo",
    wip: "Em construção",
    whoEyebrow: "Quem faz",
    whoTitle: "Luciano dii Souza, o PrimoDev.",
    bio: "Eu construo apps de verdade e mostro o processo no canal O Primo Dev: o código, as decisões e o que deu errado. Os apps daqui nasceram de problemas meus, e a maioria é open source.",
    photoAlt: "Foto do Luciano dii Souza",
    watch: "Assistir no YouTube",
    youAreHere: "Você está em",
    open: (l) => `Abrir ${l}`,
    download: (t) => `Baixar ${t}`,
    viewGithub: "Ver no GitHub",
    release: (t) => `Release ${t}`,
    copyLink: "Copiar link",
    appStore: ["Baixar na", "App Store"],
    playStore: ["Disponível no", "Google Play"],
    whatIs: (n) => `O que é o ${n}?`,
    whatItDoes: "O que ele faz",
    onChannel: "Visto no canal",
    videoAlt: (n) => `Vídeo sobre o ${n} no canal O Primo Dev`,
    faq: "Perguntas frequentes",
    guides: "Guias",
    docs: "Documentação",
    readmeNote: (repo) => `README do repositório ${repo}, atualizado a cada deploy. O texto original é em inglês.`,
    specTitle: "Ficha técnica",
    platforms: "Plataformas",
    requirements: "Requisitos",
    price: "Preço",
    freeOss: "Grátis (open source)",
    builtWith: "Feito com",
    code: "Código",
    codeOpen: "Aberto",
    codeClosed: "Fechado",
    languages: "Idiomas",
    category: "Categoria",
    repo: "Repositório",
    stars: "Estrelas",
    forks: "Forks",
    version: "Versão",
    released: "Lançada em",
    language: "Linguagem",
    links: "Links",
    officialSite: "Site oficial",
    source: "Código-fonte",
    feedback: "Sugestões e bugs",
    madeBy: "Feito por",
    madeByNote: "Eu mostro como construo cada app no canal O Primo Dev.",
    seeChannel: "Ver o canal",
    moreIn: (c) => `Mais apps: ${c}`,
    catEyebrow: "Categoria",
    catLead: (n) => `${n === 1 ? "1 app ou projeto" : `${n} apps e projetos`} do PrimoDev nessa categoria.`,
    otherCats: "Outras categorias",
    catTitle: (c) => `${c}: apps do PrimoDev`,
    catDesc: (c, names) => `${c}: ${names}. Apps e projetos do Luciano dii Souza.`,
    footerTag: "Todos os apps e projetos open source que eu construo, num lugar só. Feito no Brasil.",
    catalog: "Catálogo",
    contact: "Contato",
    apps: "Apps",
    morePrimo: "Mais do Primo",
    socials: "Redes",
    rights: (y) => `© ${y} oprimo.dev. Todos os direitos reservados.`,
  },
  en: {
    site: "PrimoDev Apps",
    skip: "Skip to content",
    nav: "Main",
    about: "About me",
    search: "Search apps",
    searchPh: "Search: teleprompter, finance…",
    switchLang: "Português",
    switchLangLabel: "Ler esta página em português",
    theme: "Toggle light and dark theme",
    homeTitle: "PrimoDev Apps: every app and project by Luciano dii Souza",
    homeDesc:
      "Catalog of apps and open-source projects by PrimoDev (Luciano dii Souza): Mac utilities, developer tools, apps for creators and more, each with its own page.",
    eyebrow: "PrimoDev Apps",
    h1: "Stuff I've<br>built.",
    lead: "Saw an app in one of my videos or posts? Every app and open-source project I ship is here, each with its own page: what it does, who it's for, what it costs and where to get it.",
    statApps: "Apps and projects",
    statOss: "Open source",
    statStars: "GitHub stars",
    spotlight: "Latest launch",
    featured: "The ones I use every day",
    featuredSub: "Products with their own site",
    seeApp: "See app",
    allApps: "All apps",
    all: "All",
    categories: "Categories",
    empty: 'Nothing by that name. Try another word or <button type="button" class="linkish" id="clear">clear the search</button>.',
    starsTitle: "GitHub stars",
    isNew: "New",
    wip: "Work in progress",
    whoEyebrow: "Who builds them",
    whoTitle: "Luciano dii Souza, aka PrimoDev.",
    bio: "I build real apps and show the process on my channel, O Primo Dev: the code, the decisions and what went wrong. The apps here came from my own problems, and most of them are open source.",
    photoAlt: "Photo of Luciano dii Souza",
    watch: "Watch on YouTube",
    youAreHere: "You are here",
    open: (l) => `Open ${l}`,
    download: (t) => `Download ${t}`,
    viewGithub: "View on GitHub",
    release: (t) => `Release ${t}`,
    copyLink: "Copy link",
    appStore: ["Download on the", "App Store"],
    playStore: ["Get it on", "Google Play"],
    whatIs: (n) => `What is ${n}?`,
    whatItDoes: "What it does",
    onChannel: "On the channel",
    videoAlt: (n) => `Video about ${n} on the O Primo Dev channel`,
    faq: "FAQ",
    guides: "Guides",
    docs: "Documentation",
    readmeNote: (repo) => `README from the ${repo} repository, refreshed on every deploy.`,
    specTitle: "Spec sheet",
    platforms: "Platforms",
    requirements: "Requirements",
    price: "Price",
    freeOss: "Free (open source)",
    builtWith: "Built with",
    code: "Code",
    codeOpen: "Open",
    codeClosed: "Closed",
    languages: "Languages",
    category: "Category",
    repo: "Repository",
    stars: "Stars",
    forks: "Forks",
    version: "Version",
    released: "Released",
    language: "Language",
    links: "Links",
    officialSite: "Official site",
    source: "Source code",
    feedback: "Ideas and bugs",
    madeBy: "Made by",
    madeByNote: "I show how I build every app on my channel, O Primo Dev.",
    seeChannel: "See the channel",
    moreIn: (c) => `More apps: ${c}`,
    catEyebrow: "Category",
    catLead: (n) => `${n === 1 ? "1 app or project" : `${n} apps and projects`} by PrimoDev in this category.`,
    otherCats: "Other categories",
    catTitle: (c) => `${c}: PrimoDev apps`,
    catDesc: (c, names) => `${c}: ${names}. Apps and projects by Luciano dii Souza.`,
    footerTag: "Every app and open-source project I build, in one place. Made in Brazil.",
    catalog: "Catalog",
    contact: "Contact",
    apps: "Apps",
    morePrimo: "More from Primo",
    socials: "Social",
    rights: (y) => `© ${y} oprimo.dev. All rights reserved.`,
  },
};

const AUTHOR = {
  name: "Luciano dii Souza",
  alt: "PrimoDev",
  photo: "/img/luciano.jpg",
  social: [
    { label: "YouTube", url: "https://youtube.com/@oprimodev" },
    { label: "Instagram", url: "https://instagram.com/oprimo.dev" },
    { label: "LinkedIn", url: "https://linkedin.com/in/lucianodiisouza" },
    { label: "GitHub", url: "https://github.com/lucianodiisouza" },
    { label: "X", url: "https://x.com/oprimodev" },
    { label: "Twitch", url: "https://twitch.tv/oprimodev" },
  ],
};

// ---------- data ----------

const catBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
for (const p of PROJECTS) {
  if (!catBySlug[p.category]) throw new Error(`${p.slug}: unknown category "${p.category}"`);
  if (!p.en?.tagline || !p.en?.summary) console.warn(`${p.slug}: missing English tagline/summary, falling back to Portuguese`);
  p.gh = GH[p.slug] || null;
  p.stars = p.gh?.stars || 0;
}

// The project as seen in one language: the `en` block overrides the
// Portuguese fields, anything it leaves out falls back to them.
const view = (p, loc) => ({ ...p, ...(loc === "en" ? p.en : {}), url: appUrl(p, loc) });

const appUrl = (p, loc) => `${LOC[loc].prefix}/${p.slug}/`;
const homeUrl = (loc) => `${LOC[loc].prefix}/`;
const catUrl = (c, loc) => `${LOC[loc].prefix}/${LOC[loc].cat}/${c.slug}/`;
const catName = (c, loc) => (loc === "en" ? c.en.name : c.name);
const catShort = (c, loc) => (loc === "en" ? c.en.short : c.short);

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

const fmtDate = (d, loc) =>
  new Date(d).toLocaleDateString(LOC[loc].number, { day: "numeric", month: "short", year: "numeric" }).replace(".", "");

const fmtNum = (n, loc) => n.toLocaleString(LOC[loc].number);

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
  videoPlay: `<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  readme: `<svg class="ic" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>`,
  apple: `<svg class="ic" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.65.8-3.33.8-.7 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.1 8.79.74 1.06 1.61 2.25 2.75 2.2 1.11-.04 1.52-.71 2.86-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.08 2.66-2.15.85-1.23 1.2-2.43 1.21-2.49-.03-.01-2.32-.89-2.34-3.52zM14.2 6.13c.6-.74 1.01-1.75.9-2.77-.87.04-1.94.59-2.56 1.32-.55.64-1.04 1.69-.91 2.68.97.08 1.97-.49 2.57-1.23z"/></svg>`,
  play: `<svg class="ic" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L4.7 2.2z"/><path d="M17.1 15.6L14 12.5v-.2l3.1-3.1.1.1 3.7 2.1c1 .6 1 1.6 0 2.2l-3.7 2.1z" opacity=".75"/><path d="M17.2 15.5L14 12.4 4.6 21.7c.4.4.9.4 1.6.1l11-6.3" opacity=".55"/><path d="M17.2 9.3L6.2 3c-.7-.4-1.2-.3-1.6.1l9.4 9.3z" opacity=".9"/></svg>`,
  globe: `<svg class="ic" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`,
  sun: `<svg class="ic icon-sun" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  moon: `<svg class="ic icon-moon" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
};

const appIcon = (p, size, cls = "") =>
  p.icon
    ? `<img class="app-icon ${cls}" src="/icons/${p.icon}" alt="" width="${size}" height="${size}" loading="lazy">`
    : `<span class="app-icon mono ${cls}" style="--s:${size}px" aria-hidden="true">${mono(p.name)}</span>`;

const badges = (p, t) =>
  (p.isNew ? `<span class="badge new">${t.isNew}</span>` : "") + (p.wip ? `<span class="badge wip">${t.wip}</span>` : "");

const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

const personLd = (loc) => ({
  "@type": "Person",
  "@id": `${SITE}/#luciano`,
  name: AUTHOR.name,
  alternateName: AUTHOR.alt,
  description: T[loc].bio,
  image: SITE + AUTHOR.photo,
  url: `${SITE}${homeUrl(loc)}`,
  sameAs: AUTHOR.social.map((s) => s.url),
});

// ---------- layout ----------

// `alt` maps each locale to the same page's path in that locale.
function layout({ loc, title, description, alt, image, body, ld = [], home = false }) {
  const t = T[loc];
  const other = loc === "pt" ? "en" : "pt";
  const canonical = alt[loc];
  const og = image ? SITE + image : null;
  return `<!doctype html>
<html lang="${LOC[loc].lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>
  // Apply a saved theme before first paint; without one, CSS follows the OS.
  try { var th = localStorage.getItem("theme"); if (th === "light" || th === "dark") document.documentElement.dataset.theme = th; } catch (e) {}
</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${canonical}">
<link rel="alternate" hreflang="pt-BR" href="${SITE}${alt.pt}">
<link rel="alternate" hreflang="en" href="${SITE}${alt.en}">
<link rel="alternate" hreflang="x-default" href="${SITE}${alt.en}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${t.site}">
<meta property="og:locale" content="${LOC[loc].og}">
<meta property="og:locale:alternate" content="${LOC[other].og}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${canonical}">
${og ? `<meta property="og:image" content="${og}">\n<meta name="twitter:card" content="summary_large_image">` : `<meta name="twitter:card" content="summary">`}
<meta name="twitter:site" content="@oprimodev">
<meta name="theme-color" content="#080E14" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#F5F5F5" media="(prefers-color-scheme: light)">
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
<a class="skip" href="#conteudo">${t.skip}</a>
${header(loc, home, alt[other])}
<div id="conteudo">
${body}
</div>
${footer(loc)}
<div class="toast" role="status" aria-live="polite"></div>
<script src="${JS}" defer></script>
<script>window.goatcounter = { path: () => location.pathname + location.hash };</script>
<script data-goatcounter="https://oprimodev.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
`;
}

function header(loc, home, otherUrl) {
  const t = T[loc];
  const other = loc === "pt" ? "en" : "pt";
  return `<header class="topbar">
<div class="wrap topbar-in">
<a class="brand" href="${homeUrl(loc)}">PrimoDev<span>/ apps</span></a>
<nav class="topnav" aria-label="${t.nav}">
<a href="${homeUrl(loc)}#apps">Apps</a>
<a href="${homeUrl(loc)}#sobre">${t.about}</a>
<a href="${AUTHOR.social[0].url}" rel="me">YouTube</a>
</nav>
<div class="top-tools">
${home ? `<label class="search">
<span class="sr">${t.search}</span>
${I.search}
<input id="search" type="search" placeholder="${t.searchPh}" autocomplete="off">
</label>` : ""}
<a class="tool lang" href="${otherUrl}" hreflang="${LOC[other].lang}" lang="${LOC[other].lang}" data-lang="${other}" aria-label="${t.switchLangLabel}">${I.globe}<span>${t.switchLang}</span></a>
<button class="tool theme" type="button" aria-label="${t.theme}" title="${t.theme}">${I.moon}${I.sun}</button>
</div>
</div>
</header>`;
}

// Same footer as dock.oprimo.dev and engine.oprimo.dev (brand · columns ·
// more from Primo · socials · rights), so every oprimo.dev site reads as one
// family. "Mais do Primo" and the socials mirror MORE_FROM_PRIMO and SOCIALS in
// primoengine-landing/src/config.ts: keep them in sync.
const FOOTER_APPS = [
  ["PrimoDock", "primodock", "Um Dock por mesa", "A Dock per workspace"],
  ["PrimoEngine", "primoengine", "Wallpapers vivos no Mac e no PC", "Living wallpapers on Mac and PC"],
  ["PrimoRec", "primorec", "Câmera para creators no iPhone", "A camera for creators on iPhone"],
  ["criador.studio", "criador-studio", "Programa de criadores com cupom", "Coupon-based creator programs"],
  ["FDBK", "fdbk", "Feedback boards para times de produto", "Feedback boards for product teams"],
  ["Recta", "recta", "Finanças pessoais", "Personal finance"],
];
const MORE_FROM_PRIMO = [
  ["Media Kit", "Media Kit", "https://media.oprimo.dev", "Media kit e brand book", "Media kit and brand book"],
  ["Primo Academy", "Primo Academy", "https://aprenda.oprimo.dev", "Roadmaps de programação em português", "Coding roadmaps in Portuguese"],
  ["Censo de IA", "AI Census", "https://ai.oprimo.dev", "Uso de IA no Brasil", "How Brazil uses AI"],
  ["Pokerface", "Pokerface", "https://poker.oprimo.dev", "Planning poker open source", "Open-source planning poker"],
  ["Portfólio", "Portfolio", "https://oprimo.dev", "O Primo Dev", "O Primo Dev"],
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

function footer(loc) {
  const t = T[loc];
  const en = loc === "en";
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
<p class="footer-tagline">${t.footerTag}</p>
</div>
${col(t.catalog, [[t.allApps, `${homeUrl(loc)}#apps`], ...CATEGORIES.map((c) => [catName(c, loc), catUrl(c, loc)]), [t.about, `${homeUrl(loc)}#sobre`], [t.contact, "mailto:apps@oprimo.dev"]])}
${col(t.apps, FOOTER_APPS.map(([name, slug, pt, enBlurb]) => [name, `${LOC[loc].prefix}/${slug}/`, en ? enBlurb : pt]))}
${col(t.morePrimo, MORE_FROM_PRIMO.map(([pt, enName, href, ptB, enB]) => [en ? enName : pt, href, en ? enB : ptB]))}
</div>
<div class="wrap footer-rights">
<ul class="footer-social" aria-label="${t.socials}">${SOCIALS.map(([name, href]) => `<li><a href="${href}" target="_blank" rel="noopener me">${name}</a></li>`).join("")}</ul>
<p>${t.rights(new Date().getFullYear())}</p>
</div>
</footer>`;
}

function authorBlock(loc) {
  const t = T[loc];
  return `<section id="sobre" class="about wrap" aria-labelledby="sobre-h">
<img class="about-photo" src="${AUTHOR.photo}" alt="${t.photoAlt}" width="280" height="280" loading="lazy">
<div class="about-text">
<p class="eyebrow">${t.whoEyebrow}</p>
<h2 id="sobre-h" class="h-xl">${t.whoTitle}</h2>
<p class="lead muted">${esc(t.bio)}</p>
<div class="btn-row">
<a class="btn primary" href="${AUTHOR.social[0].url}" rel="me">${t.watch}</a>
${AUTHOR.social.slice(1, 4).map((s) => `<a class="btn ghost" href="${s.url}" rel="me">${s.label}</a>`).join("")}
</div>
</div>
</section>`;
}

function row(p, loc) {
  const v = view(p, loc);
  const t = T[loc];
  const hay = [v.name, v.tagline, v.summary, catName(catBySlug[p.category], loc), ...(v.platforms || []), ...v.tech]
    .join(" ")
    .toLowerCase();
  return `<a class="row card" href="${v.url}" data-cat="${p.category}" data-q="${esc(hay)}">
${appIcon(p, 56)}
<span class="row-text">
<span class="row-title"><span class="name">${esc(v.name)}</span>${badges(p, t)}</span>
<span class="row-tag">${esc(v.tagline)}</span>
<span class="row-meta">${esc([...v.platforms, ...v.tech.slice(0, 2)].join(" · "))}</span>
</span>
${p.stars ? `<span class="row-stars" title="${t.starsTitle}">${I.star}${fmtNum(p.stars, loc)}</span>` : ""}
</a>`;
}

// ---------- home ----------

function homePage(loc) {
  const t = T[loc];
  const featured = sorted.filter((p) => p.pinned).map((p) => view(p, loc));
  const spotP = PROJECTS.find((p) => p.spotlight);
  // The big bento card needs a hero image; the rest use their cover.
  const lead = featured.find((p) => p.hero && p.slug !== spotP?.slug);
  // The spotlight card already shows the latest launch, so it skips the bento.
  const rest = featured.filter((p) => p !== lead && p.slug !== spotP?.slug);
  const spot = spotP && view(spotP, loc);

  const body = `<main>
<section class="hero wrap">
<div class="hero-text">
<p class="eyebrow">${t.eyebrow}</p>
<h1 class="h-hero">${t.h1}</h1>
<p class="lead muted">${t.lead}</p>
<dl class="stats">
<div><dt>${t.statApps}</dt><dd>${PROJECTS.length}</dd></div>
<div><dt>${t.statOss}</dt><dd>${ossCount}</dd></div>
<div><dt>${t.statStars}</dt><dd>${fmtNum(totalStars, loc)}</dd></div>
</dl>
</div>
${spot ? `<a class="spot card" href="${spot.url}">
<img src="/img/${spot.cover}" alt="" width="1200" height="630">
<span class="spot-body">
<span class="eyebrow sm">${t.spotlight}</span>
<span class="spot-title"><span class="h-md">${esc(spot.name)}</span>${I.arrow}</span>
<span class="muted">${esc(spot.tagline)}</span>
</span>
</a>` : ""}
</section>

<section class="wrap featured" aria-labelledby="dest">
<div class="sec-head"><h2 id="dest" class="h-lg">${t.featured}</h2><span class="muted">${t.featuredSub}</span></div>
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
<span class="btn primary">${t.seeApp}</span>
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
<div class="sec-head"><h2 id="todos" class="h-lg">${t.allApps}</h2><span class="muted" id="count">${sorted.length} apps</span></div>
<nav class="tabs" aria-label="${t.categories}">
<a href="${homeUrl(loc)}#apps" data-cat="" aria-current="true">${t.all} <span>${sorted.length}</span></a>
${CATEGORIES.map((c) => {
  const n = PROJECTS.filter((p) => p.category === c.slug).length;
  return n ? `<a href="${catUrl(c, loc)}" data-cat="${c.slug}">${esc(catShort(c, loc))} <span>${n}</span></a>` : "";
}).join("\n")}
</nav>
<div class="rows" id="rows">
${sorted.map((p) => row(p, loc)).join("\n")}
</div>
<p class="empty" id="empty" hidden>${t.empty}</p>
</div>
</section>

${authorBlock(loc)}
</main>`;

  return layout({
    loc,
    title: t.homeTitle,
    description: t.homeDesc,
    alt: { pt: homeUrl("pt"), en: homeUrl("en") },
    image: `/img/${spotP?.cover || "primoengine-cover.jpg"}`,
    home: true,
    body,
    ld: [
      {
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", "@id": `${SITE}/#site`, url: `${SITE}${homeUrl(loc)}`, name: t.site, inLanguage: LOC[loc].lang, publisher: { "@id": `${SITE}/#luciano` } },
          personLd(loc),
          {
            "@type": "ItemList",
            name: t.site,
            itemListElement: sorted.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + appUrl(p, loc), name: p.name })),
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

function primaryAction(p, t) {
  if (p.site) return { label: t.open(p.site.label), url: p.site.url, icon: I.out };
  if (p.gh?.release) return { label: t.download(p.gh.release.tag), url: p.gh.release.url, icon: I.down };
  return { label: t.viewGithub, url: p.github, icon: I.out };
}

function appPage(src, loc) {
  const t = T[loc];
  const p = view(src, loc);
  const cat = catBySlug[p.category];
  const cName = catName(cat, loc);
  const gh = p.gh;
  const main = primaryAction(p, t);
  const secondary = [];
  if (p.github && main.url !== p.github) secondary.push({ label: t.viewGithub, url: p.github });
  if (gh?.release && !main.url.includes("/releases/")) secondary.push({ label: t.release(gh.release.tag), url: gh.release.url });
  for (const l of p.links) if (l.url !== p.github) secondary.push(l);
  const stores = [
    p.stores?.appStore && { url: p.stores.appStore, label: t.appStore, icon: I.apple },
    p.stores?.playStore && { url: p.stores.playStore, label: t.playStore, icon: I.play },
  ].filter(Boolean);
  const related = sorted.filter((x) => x.category === p.category && x !== src).slice(0, 4);
  const license = gh?.license;
  // The price chip must stay short; long prices only go in the spec sheet.
  const priceChip = p.priceChip ?? (p.price && p.price.length <= 42 ? p.price.replace(/\s*\(open source\)/i, "") : null);
  const chips = [
    ...p.platforms,
    priceChip,
    p.github ? (license ? `Open source · ${license}` : "Open source") : null,
    gh?.release?.tag,
  ].filter(Boolean);

  const spec = [
    [t.platforms, p.platforms.join(", ")],
    [t.requirements, p.requirements],
    [t.price, p.price || (p.github ? t.freeOss : null)],
    [t.builtWith, p.tech.join(", ")],
    [t.code, p.github ? `${t.codeOpen}${license ? ` · ${license}` : ""}` : t.codeClosed],
    [t.languages, p.languages?.join(", ")],
  ].filter(([, v]) => v);

  const links = [
    p.site && { label: t.officialSite, hint: p.site.label, url: p.site.url },
    ...stores.map((s) => ({ label: s.label[1], hint: s.label[1] === "App Store" ? "iOS" : "Android", url: s.url })),
    p.github && { label: t.source, hint: "GitHub", url: p.github },
    p.feedback && { label: t.feedback, hint: "FDBK", url: p.feedback },
    ...p.links.filter((l) => l.url !== p.github).map((l) => ({ label: l.label, hint: new URL(l.url).hostname.replace(/^www\./, ""), url: l.url })),
  ].filter(Boolean);

  const body = `<main class="wrap app">
<nav class="crumbs" aria-label="${t.youAreHere}">
<ol><li><a href="${homeUrl(loc)}">Apps</a></li><li><a href="${catUrl(cat, loc)}">${esc(cName)}</a></li><li aria-current="page">${esc(p.name)}</li></ol>
</nav>

<section class="app-head">
<div class="app-id">
${appIcon(p, 120, "xl")}
<div>
<h1 class="h-app">${esc(p.name)}${badges(p, t)}</h1>
<p class="app-tag">${esc(p.tagline)}</p>
<ul class="chips">${chips.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
</div>
</div>
<div class="app-cta">
<a class="btn primary lg" href="${main.url}">${esc(main.label)} ${main.icon}</a>
<div class="btn-row">
${secondary.slice(0, 2).map((l) => `<a class="btn ghost" href="${l.url}">${esc(l.label)}</a>`).join("")}
<button class="btn ghost copy" type="button" data-url="${SITE}${p.url}">${I.link} ${t.copyLink}</button>
</div>
${stores.length ? `<div class="stores">${stores
  .map((s) => `<a class="store" href="${s.url}">${s.icon}<span><span class="store-pre">${s.label[0]}</span><span class="store-name">${s.label[1]}</span></span></a>`)
  .join("")}</div>` : ""}
</div>
</section>

${p.hero ? `<figure class="app-hero">
<img src="/img/${p.hero}" alt="${esc(p.heroAlt || p.name)}" width="1400" height="875">
${p.heroCaption ? `<figcaption class="muted">${esc(p.heroCaption)}</figcaption>` : ""}
</figure>` : ""}

<div class="app-body">
<div class="app-main">

<section aria-labelledby="oque">
<h2 id="oque" class="h-lg">${esc(t.whatIs(p.name))}</h2>
<p class="answer">${esc(p.summary)}</p>
${p.details ? `<p class="lead muted">${esc(p.details)}</p>` : ""}
</section>

${p.features?.length ? `<section aria-labelledby="faz">
<h2 id="faz" class="h-lg">${t.whatItDoes}</h2>
<ol class="numbered">${p.features.map((f, i) => `<li><span class="num">${String(i + 1).padStart(2, "0")}</span><span>${esc(f)}</span></li>`).join("")}</ol>
</section>` : ""}

${p.youtube ? `<section aria-labelledby="yt">
<h2 id="yt" class="h-lg">${t.onChannel}</h2>
<a class="video" href="https://www.youtube.com/watch?v=${esc(p.youtube)}">
<img src="https://i.ytimg.com/vi/${esc(p.youtube)}/maxresdefault.jpg" alt="${esc(t.videoAlt(p.name))}" width="1280" height="720" loading="lazy">
<span class="play">${I.videoPlay}</span>
</a>
</section>` : ""}

${p.faq?.length ? `<section aria-labelledby="faq">
<h2 id="faq" class="h-lg">${t.faq}</h2>
<dl class="faq">${p.faq.map((f) => `<div><dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd></div>`).join("")}</dl>
</section>` : ""}

${p.guides?.length ? `<section aria-labelledby="guias">
<h2 id="guias" class="h-lg">${t.guides}</h2>
<div class="guides">${p.guides
  .map((g) => `<a class="card guide" href="${g.url}"><span class="small muted">${esc(new URL(g.url).hostname)}</span><span class="name">${esc(g.title)}</span></a>`)
  .join("")}</div>
</section>` : ""}

${gh?.readme ? `<section aria-labelledby="docs">
<h2 id="docs" class="h-lg">${t.docs}</h2>
<p class="note">${I.readme}<span>${t.readmeNote(`<a href="https://github.com/${gh.repo}">${esc(gh.repo)}</a>`)}</span></p>
<div class="readme" lang="en">${readmeHtml(p)}</div>
</section>` : ""}
</div>

<aside class="app-side" aria-label="${t.specTitle}">
<div class="panel">
<h2 class="eyebrow sm">${t.specTitle}</h2>
<dl class="spec">${spec.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}<dt>${t.category}</dt><dd><a href="${catUrl(cat, loc)}">${esc(cName)}</a></dd></dl>
</div>
${gh ? `<div class="panel">
<h2 class="eyebrow sm">${t.repo}</h2>
<div class="repo-stats"><div><span class="small muted">${t.stars}</span><span class="h-md">${fmtNum(gh.stars, loc)}</span></div><div><span class="small muted">${t.forks}</span><span class="h-md">${fmtNum(gh.forks, loc)}</span></div></div>
<dl class="spec">
${gh.release ? `<dt>${t.version}</dt><dd>${esc(gh.release.tag)}</dd><dt>${t.released}</dt><dd>${fmtDate(gh.release.date, loc)}</dd>` : ""}
${gh.language ? `<dt>${t.language}</dt><dd>${esc(gh.language)}</dd>` : ""}
</dl>
</div>` : ""}
${links.length ? `<div class="panel">
<h2 class="eyebrow sm">${t.links}</h2>
<ul class="links">${links.map((l) => `<li><a href="${l.url}"><span>${esc(l.label)}</span><span class="muted">${esc(l.hint)}</span></a></li>`).join("")}</ul>
</div>` : ""}
<div class="panel byline">
<div class="byline-id"><img src="${AUTHOR.photo}" alt="" width="56" height="56" loading="lazy"><span><span class="small muted">${t.madeBy}</span><a class="name" href="${homeUrl(loc)}#sobre">${AUTHOR.name}</a></span></div>
<p class="small muted">${t.madeByNote}</p>
<a class="btn ghost block" href="${AUTHOR.social[0].url}" rel="me">${t.seeChannel}</a>
</div>
</aside>
</div>

${related.length ? `<section class="related" aria-labelledby="rel">
<h2 id="rel" class="h-md">${esc(t.moreIn(cName))}</h2>
<div class="rows compact">${related.map((x) => row(x, loc)).join("\n")}</div>
</section>` : ""}
</main>`;

  const free = p.github || /^(Grátis|Free)/.test(p.price || "");
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
      ...(free && { offers: { "@type": "Offer", price: "0", priceCurrency: LOC[loc].currency } }),
      ...(license && { license: `https://spdx.org/licenses/${license}.html` }),
      inLanguage: LOC[loc].lang,
      author: { "@id": `${SITE}/#luciano` },
      sameAs: [p.site?.url, p.stores?.appStore, p.stores?.playStore, p.github].filter(Boolean),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Apps", item: `${SITE}${homeUrl(loc)}` },
        { "@type": "ListItem", position: 2, name: cName, item: SITE + catUrl(cat, loc) },
        { "@type": "ListItem", position: 3, name: p.name, item: SITE + p.url },
      ],
    },
    personLd(loc),
  ];
  if (p.faq?.length)
    graph.push({
      "@type": "FAQPage",
      mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });

  return layout({
    loc,
    title: `${p.name}: ${p.tagline} · ${t.site}`,
    description: clip(p.summary, 158),
    alt: { pt: appUrl(src, "pt"), en: appUrl(src, "en") },
    image: p.cover ? `/img/${p.cover}` : null,
    body,
    ld: [{ "@context": "https://schema.org", "@graph": graph }],
  });
}

// ---------- category page ----------

function categoryPage(c, loc) {
  const t = T[loc];
  const name = catName(c, loc);
  const list = sorted.filter((p) => p.category === c.slug);
  const body = `<main class="wrap catpage">
<nav class="crumbs" aria-label="${t.youAreHere}"><ol><li><a href="${homeUrl(loc)}">Apps</a></li><li aria-current="page">${esc(name)}</li></ol></nav>
<p class="eyebrow">${t.catEyebrow}</p>
<h1 class="h-hero sm">${esc(name)}</h1>
<p class="lead muted">${t.catLead(list.length)}</p>
<div class="rows">${list.map((x) => row(x, loc)).join("\n")}</div>
<nav class="tabs other" aria-label="${t.otherCats}">${CATEGORIES.filter((x) => x !== c).map((x) => `<a href="${catUrl(x, loc)}">${esc(catName(x, loc))}</a>`).join("")}</nav>
</main>`;
  return layout({
    loc,
    title: t.catTitle(name),
    description: t.catDesc(name, list.map((p) => p.name).join(", ")).slice(0, 158),
    alt: { pt: catUrl(c, "pt"), en: catUrl(c, "en") },
    body,
    ld: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name,
        url: SITE + catUrl(c, loc),
        inLanguage: LOC[loc].lang,
        mainEntity: { "@type": "ItemList", itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + appUrl(p, loc), name: p.name })) },
      },
    ],
  });
}

// One 404 for both languages: the host serves it for any missing path.
function notFoundPage() {
  return layout({
    loc: "pt",
    title: "Página não encontrada · Page not found",
    description: "Essa página não existe. This page doesn't exist.",
    alt: { pt: "/404", en: "/en/" },
    body: `<main class="wrap catpage"><p class="eyebrow">404</p><h1 class="h-hero sm">Esse app não está aqui.</h1><p class="lead muted">Pode ter mudado de nome. Dá uma olhada no <a href="/#apps">catálogo completo</a>.</p>
<p class="lead muted" lang="en">This app isn't here. It may have been renamed: see the <a href="/en/#apps">full catalog</a>.</p></main>`,
  });
}

// ---------- llms.txt, sitemap, robots ----------

// In English for assistants, with the Portuguese page next to each English one.
function llmsTxt() {
  const lines = [
    "# PrimoDev Apps",
    "",
    `> Catalog of apps and open-source projects built by ${AUTHOR.name} (PrimoDev, the O Primo Dev channel on YouTube). Every app has a page in English and in Brazilian Portuguese with what it does, platforms, price, FAQ and official links.`,
    "",
    `Full content of every app in one file: ${SITE}/llms-full.txt`,
    "",
  ];
  for (const c of CATEGORIES) {
    const list = sorted.filter((p) => p.category === c.slug);
    if (!list.length) continue;
    lines.push(`## ${c.en.name}`, "");
    for (const p of list) {
      const v = view(p, "en");
      lines.push(`- [${p.name}](${SITE}${appUrl(p, "en")}) ([pt-BR](${SITE}${appUrl(p, "pt")})): ${v.summary}`);
    }
    lines.push("");
  }
  lines.push("## Author", "", `- ${AUTHOR.name}: ${T.en.bio}`, ...AUTHOR.social.map((s) => `- ${s.label}: ${s.url}`), "");
  return lines.join("\n");
}

// Everything an assistant needs in one file: every app's full English page
// as Markdown, with the pt-BR URL next to it.
function llmsFullTxt() {
  const lines = [
    "# PrimoDev Apps: full catalog",
    "",
    `> Every app and open-source project by ${AUTHOR.name} (PrimoDev), with what it does, platforms, price, requirements, features and FAQ. Each app also has a page in English and in Brazilian Portuguese. Short index: ${SITE}/llms.txt`,
    "",
  ];
  for (const p of sorted) {
    const v = view(p, "en");
    lines.push(`## ${v.name}`, "");
    lines.push(`- Page: ${SITE}${appUrl(p, "en")} (pt-BR: ${SITE}${appUrl(p, "pt")})`);
    lines.push(`- Category: ${catName(catBySlug[p.category], "en")}`);
    lines.push(`- Platforms: ${v.platforms.join(", ")}`);
    if (v.price) lines.push(`- Price: ${v.price}`);
    if (v.requirements) lines.push(`- Requirements: ${v.requirements}`);
    if (v.site) lines.push(`- Official site: ${v.site.url}`);
    if (v.stores?.appStore) lines.push(`- App Store: ${v.stores.appStore}`);
    if (v.stores?.playStore) lines.push(`- Google Play: ${v.stores.playStore}`);
    if (v.github) lines.push(`- Source code: ${v.github}${p.gh?.license ? ` (${p.gh.license})` : ""}${p.stars ? `, ${p.stars} GitHub stars` : ""}`);
    lines.push("", v.summary);
    if (v.details) lines.push("", v.details);
    if (v.features?.length) lines.push("", "### Features", "", ...v.features.map((f) => `- ${f}`));
    if (v.faq?.length) lines.push("", "### FAQ", "", ...v.faq.flatMap((f) => [`**${f.q}**`, f.a, ""]));
    lines.push("");
  }
  lines.push("## Author", "", `${AUTHOR.name}: ${T.en.bio}`, "", ...AUTHOR.social.map((s) => `- ${s.label}: ${s.url}`), "");
  return lines.join("\n");
}

function sitemap() {
  const pairs = [
    { pt: homeUrl("pt"), en: homeUrl("en") },
    ...sorted.map((p) => ({ pt: appUrl(p, "pt"), en: appUrl(p, "en") })),
    ...CATEGORIES.map((c) => ({ pt: catUrl(c, "pt"), en: catUrl(c, "en") })),
  ];
  const today = new Date().toISOString().slice(0, 10);
  const entry = (u, pair) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod>
<xhtml:link rel="alternate" hreflang="pt-BR" href="${SITE}${pair.pt}"/><xhtml:link rel="alternate" hreflang="en" href="${SITE}${pair.en}"/><xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${pair.en}"/></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pairs.flatMap((pair) => [entry(pair.pt, pair), entry(pair.en, pair)]).join("\n")}
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
for (const loc of LOCALES) {
  const dir = LOC[loc].prefix.slice(1);
  write(path.join(dir, "index.html"), homePage(loc));
  for (const p of PROJECTS) write(path.join(dir, p.slug, "index.html"), appPage(p, loc));
  for (const c of CATEGORIES) write(path.join(dir, LOC[loc].cat, c.slug, "index.html"), categoryPage(c, loc));
}
write("404.html", notFoundPage());
write("llms.txt", llmsTxt());
write("llms-full.txt", llmsFullTxt());
write("sitemap.xml", sitemap());
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${PROJECTS.length} app pages and ${CATEGORIES.length} category pages in ${LOCALES.length} languages into dist/`);
