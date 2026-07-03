const grid = document.getElementById("grid");
const searchInput = document.getElementById("search");
const filtersEl = document.getElementById("filters");
const countEl = document.getElementById("count");
const emptyEl = document.getElementById("empty");

let activeCategory = "All";

const categories = ["All", ...new Set(PROJECTS.map((p) => p.category))];

function starLabel(n) {
  return `★ ${n}`;
}

function cardHTML(p) {
  const links = [
    p.github
      ? `<a class="primary" href="${p.github}" target="_blank" rel="noopener">GitHub</a>`
      : "",
    ...p.links.map((l, i) =>
      `<a${!p.github && i === 0 ? ' class="primary"' : ""} href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`
    ),
  ].join("");

  const tags = [
    `<span class="tag cat">${p.category}</span>`,
    ...p.platforms.map((t) => `<span class="tag">${t}</span>`),
    ...p.tech.map((t) => `<span class="tag">${t}</span>`),
    ...(p.github ? [] : [`<span class="tag">Closed source</span>`]),
  ].join("");

  const starsBadge =
    p.stars > 0
      ? `<span class="stars" title="GitHub stars">${starLabel(p.stars)}</span>`
      : "";

  return `
    <article class="card" id="${p.slug}">
      <div class="card-top">
        <span class="card-icon" aria-hidden="true">${p.emoji}</span>
        ${starsBadge}
      </div>
      <h3><a href="#${p.slug}" title="Copy link to this project">${p.name}</a></h3>
      <p class="tagline">${p.tagline}</p>
      <p class="desc">${p.description}</p>
      <div class="tags">${tags}</div>
      <div class="card-actions">${links}</div>
    </article>`;
}

function matches(p, query) {
  if (activeCategory !== "All" && p.category !== activeCategory) return false;
  if (!query) return true;
  const haystack = [
    p.name, p.tagline, p.description, p.category,
    ...p.platforms, ...p.tech,
  ].join(" ").toLowerCase();
  return query.toLowerCase().split(/\s+/).every((w) => haystack.includes(w));
}

function render() {
  const query = searchInput.value.trim();
  const visible = PROJECTS
    .filter((p) => matches(p, query))
    .sort((a, b) => (b.featured - a.featured) || ((b.stars || 0) - (a.stars || 0)));

  grid.innerHTML = visible.map(cardHTML).join("");
  emptyEl.hidden = visible.length > 0;
  countEl.textContent =
    visible.length === PROJECTS.length
      ? `${PROJECTS.length} projects`
      : `${visible.length} of ${PROJECTS.length} projects`;
}

function renderFilters() {
  filtersEl.innerHTML = categories
    .map(
      (c) =>
        `<button aria-pressed="${c === activeCategory}" data-cat="${c}">${c}</button>`
    )
    .join("");
}

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cat]");
  if (!btn) return;
  activeCategory = btn.dataset.cat;
  renderFilters();
  render();
});

searchInput.addEventListener("input", render);

document.getElementById("clear").addEventListener("click", () => {
  searchInput.value = "";
  activeCategory = "All";
  renderFilters();
  render();
});

renderFilters();
render();

// Deep link support: /#slug scrolls to and highlights that card,
// so a social post can point straight at one project.
function focusHash() {
  const slug = location.hash.slice(1);
  if (!slug) return;
  const card = document.getElementById(slug);
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("highlight");
  setTimeout(() => card.classList.remove("highlight"), 2400);
}

window.addEventListener("hashchange", focusHash);
focusHash();

// Clicking a project title copies its shareable deep link.
const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
document.body.appendChild(toast);
let toastTimer;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}

grid.addEventListener("click", async (e) => {
  const titleLink = e.target.closest("h3 a");
  if (!titleLink) return;
  e.preventDefault();
  const slug = titleLink.getAttribute("href").slice(1);
  const url = `${location.origin}${location.pathname}#${slug}`;
  history.replaceState(null, "", `#${slug}`);
  focusHash();
  try {
    await navigator.clipboard.writeText(url);
    showToast("🔗 Link copied, paste it anywhere");
  } catch {
    showToast(url); // clipboard unavailable: at least show the link
  }
});
