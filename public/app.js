// Small progressive enhancements on top of the static pages: the pages work
// without this file.

// GoatCounter custom events (no-op if the script hasn't loaded / is blocked).
function track(eventPath) {
  if (window.goatcounter && window.goatcounter.count) {
    window.goatcounter.count({ path: eventPath, event: true });
  }
}

const toast = document.querySelector(".toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}

// Old share links were /#slug. Every app now has its own page at /slug/.
const legacy = location.pathname === "/" && location.hash.slice(1);
if (legacy && /^[a-z0-9-]+$/.test(legacy) && !document.getElementById(legacy)) {
  location.replace(`/${legacy}/`);
}

// ---------- home: category tabs + search filter the list in place ----------
const rows = document.getElementById("rows");
if (rows) {
  const search = document.getElementById("search");
  const tabs = document.querySelectorAll(".tabs a[data-cat]");
  const count = document.getElementById("count");
  const empty = document.getElementById("empty");
  const items = [...rows.querySelectorAll(".row")];
  let cat = "";

  function apply() {
    const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    // Featured apps already have big cards above, so the unfiltered list
    // leaves them out; a category or a search brings them back.
    const browsing = !cat && !words.length;
    let shown = 0;
    for (const el of items) {
      const ok =
        !(browsing && "pinned" in el.dataset) &&
        (!cat || el.dataset.cat === cat) &&
        words.every((w) => el.dataset.q.includes(w));
      el.hidden = !ok;
      if (ok) shown++;
    }
    count.textContent = `${shown} ${shown === 1 ? "app" : "apps"}`;
    empty.hidden = shown > 0;
  }

  for (const tab of tabs) {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      cat = tab.dataset.cat;
      tabs.forEach((t) => t.setAttribute("aria-current", t === tab ? "true" : "false"));
      apply();
    });
  }

  search.addEventListener("input", () => {
    if (search.value && rows.getBoundingClientRect().top > window.innerHeight) {
      document.getElementById("apps").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    apply();
  });

  document.getElementById("clear").addEventListener("click", () => {
    search.value = "";
    tabs[0].click();
  });

  // "/" focuses the search, like most catalogs.
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== search && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      search.focus();
    }
  });
}

// ---------- app page: copy the page link ----------
document.addEventListener("click", async (e) => {
  const copy = e.target.closest(".copy");
  if (copy) {
    track(`copy-link${location.pathname}`);
    try {
      await navigator.clipboard.writeText(copy.dataset.url);
      showToast("Link copiado");
    } catch {
      showToast(copy.dataset.url);
    }
    return;
  }
  const out = e.target.closest("a[href^='http']");
  if (out && !out.href.startsWith(location.origin)) {
    track(`out${location.pathname}${new URL(out.href).hostname}`);
  }
});
