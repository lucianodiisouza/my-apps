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

// ---------- theme toggle ----------
// No saved choice => follow the OS (handled by CSS). Clicking flips to the
// opposite of whatever is currently showing and remembers it in localStorage.
const themeToggle = document.getElementById("theme-toggle");

function currentTheme() {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

themeToggle.addEventListener("click", (e) => {
  const next = currentTheme() === "dark" ? "light" : "dark";

  const apply = () => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (err) {}
    track(`theme-${next}`);
  };

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cool bit: a circular wipe from the toggle. Going TO dark, the new theme's
  // circle OPENS (grows from the button); going back to light, the dark theme's
  // circle CLOSES (shrinks to the button) — opposite directions. Falls back to
  // an instant swap where View Transitions aren't supported or motion is reduced.
  if (!document.startViewTransition || reduce) {
    apply();
    return;
  }

  const opening = next === "dark";
  const root = document.documentElement;

  const rect = themeToggle.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const small = `circle(0px at ${x}px ${y}px)`;
  const full = `circle(${radius}px at ${x}px ${y}px)`;

  if (!opening) root.classList.add("theme-closing");

  const transition = document.startViewTransition(apply);
  transition.ready.then(() => {
    root.animate(
      // Opening: grow the new theme. Closing: shrink the old theme.
      { clipPath: opening ? [small, full] : [full, small] },
      {
        duration: 520,
        easing: "ease-in-out",
        pseudoElement: opening
          ? "::view-transition-new(root)"
          : "::view-transition-old(root)",
      }
    );
  });
  transition.finished.finally(() => root.classList.remove("theme-closing"));
});

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

// GoatCounter custom events (no-op if the script hasn't loaded / is blocked).
function track(eventPath) {
  if (window.goatcounter && window.goatcounter.count) {
    window.goatcounter.count({ path: eventPath, event: true });
  }
}

grid.addEventListener("click", async (e) => {
  const action = e.target.closest(".card-actions a");
  if (action) {
    const slug = action.closest(".card").id;
    const label = action.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    track(`click-${slug}-${label}`);
    return; // let the link navigate normally
  }

  const titleLink = e.target.closest("h3 a");
  if (!titleLink) return;
  e.preventDefault();
  const slug = titleLink.getAttribute("href").slice(1);
  const url = `${location.origin}${location.pathname}#${slug}`;
  history.replaceState(null, "", `#${slug}`);
  focusHash();
  track(`copy-link-${slug}`);
  try {
    await navigator.clipboard.writeText(url);
    showToast("🔗 Link copied, paste it anywhere");
  } catch {
    showToast(url); // clipboard unavailable: at least show the link
  }
});
