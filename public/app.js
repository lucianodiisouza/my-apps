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

const en = document.documentElement.lang === "en";

// ---------- theme toggle ----------
// No saved choice: follow the OS (CSS does that). A click flips to the other
// theme and remembers it.
const themeBtn = document.querySelector(".tool.theme");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const root = document.documentElement;
    const current =
      root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = current === "dark" ? "light" : "dark";

    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
      track(`theme-${next}`);
    };

    // Same circular wipe as the previous site: going TO dark the new theme's
    // circle OPENS from the button; going back to light the dark theme's
    // circle CLOSES into it. Falls back to an instant swap where View
    // Transitions aren't supported or motion is reduced.
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Still suppress the elements' own transitions for a frame so the
      // theme flips cleanly instead of every color crossfading.
      root.classList.add("theme-switching");
      apply();
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
      return;
    }

    const opening = next === "dark";
    const rect = themeBtn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const small = `circle(0px at ${x}px ${y}px)`;
    const full = `circle(${radius}px at ${x}px ${y}px)`;

    root.classList.add("theme-switching");
    if (!opening) root.classList.add("theme-closing");

    const transition = document.startViewTransition(apply);
    transition.ready.then(() => {
      const anim = root.animate(
        { clipPath: opening ? [small, full] : [full, small] },
        {
          duration: 800,
          easing: "ease-in-out",
          // Hold the final clip until the snapshot is torn down, otherwise the
          // old theme blinks for one frame at the end of a close.
          fill: "forwards",
          pseudoElement: opening ? "::view-transition-new(root)" : "::view-transition-old(root)",
        }
      );
      // fill:forwards keeps the animation alive; cancel it once the real DOM
      // shows the final theme so repeated toggles don't pile up.
      transition.finished.finally(() => anim.cancel());
    });
    transition.finished.finally(() => {
      root.classList.remove("theme-closing", "theme-switching");
    });
  });
}

// ---------- language toggle ----------
// The edge sends visitors to pt-BR or English by country (vercel.json) unless
// a `lang` cookie says otherwise; choosing a language here sets that cookie.
const langLink = document.querySelector(".tool.lang");
if (langLink) {
  langLink.addEventListener("click", () => {
    document.cookie = `lang=${langLink.dataset.lang}; path=/; max-age=31536000; samesite=lax`;
    track(`lang-${langLink.dataset.lang}`);
  });
}

// Old share links were /#slug. Every app now has its own page at /slug/.
const legacy = (location.pathname === "/" || location.pathname === "/en/") && location.hash.slice(1);
if (legacy && /^[a-z0-9-]+$/.test(legacy) && !document.getElementById(legacy)) {
  location.replace(`${location.pathname}${legacy}/`);
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
    let shown = 0;
    for (const el of items) {
      const ok =
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
      showToast(en ? "Link copied" : "Link copiado");
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
