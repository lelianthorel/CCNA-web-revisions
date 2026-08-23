/* ==========================================================================
   Utilitaires partagés : thème, icônes SVG, progression (localStorage), navbar
   ========================================================================== */

/* Les icônes et la fonction icon() proviennent de js/icons.js (chargé avant app.js). */

/* ---------- Thème ---------- */
const THEME_KEY = "ccna-theme";
function currentTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
}
function applyTheme(t) {
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  else document.documentElement.removeAttribute("data-theme");
}
function toggleTheme() {
  const explicit = currentTheme();
  let next;
  if (explicit === "dark") next = "light";
  else if (explicit === "light") next = "dark";
  else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    next = prefersDark ? "light" : "dark";
  }
  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  applyTheme(next);
}

/* ---------- Progression (localStorage) ---------- */
const PROG_KEY = "ccna-progress";
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROG_KEY)) || {}; } catch (e) { return {}; }
}
function saveModuleResult(ccna, module, score, total) {
  try {
    const p = loadProgress();
    const key = ccna + "/" + module;
    const prev = p[key];
    const pct = total ? Math.round((score / total) * 100) : 0;
    const best = prev ? Math.max(prev.best || 0, pct) : pct;
    p[key] = { score, total, pct, best, attempts: (prev?.attempts || 0) + 1, ts: Date.now() };
    localStorage.setItem(PROG_KEY, JSON.stringify(p));
  } catch (e) {}
}
function getModuleProgress(ccna, module) {
  const p = loadProgress();
  return p[ccna + "/" + module] || null;
}

/* ---------- Navbar + footer partagés ---------- */
function buildNav(active) {
  const links = [
    { href: "ccna1/", label: "CCNA 1", key: "ccna1" },
    { href: "ccna2/", label: "CCNA 2", key: "ccna2" },
    { href: "csna/",  label: "CSNA",  key: "csna" },
    { href: "csne/",  label: "CSNE",  key: "csne" }
  ];
  const base = window.__ROOT__ || "";
  const linksHtml = links.map(l =>
    `<a class="nav__link ${active === l.key ? "is-active" : ""}" href="${base}${l.href}">${l.label}</a>`
  ).join("");
  return `
  <nav class="nav">
    <div class="nav__inner">
      <a class="brand" href="${base}index.html" aria-label="Accueil CCNA Révisions">
        <span class="brand__logo">${icon("network")}</span>
        <span>CCNA Révisions</span>
      </a>
      <div class="nav__spacer"></div>
      <div class="nav__links">${linksHtml}</div>
      <button class="theme-toggle" id="themeToggle" type="button" aria-label="Changer de thème" title="Changer de thème clair / sombre">
        <span class="icon-moon">${icon("moon")}</span>
        <span class="icon-sun">${icon("sun")}</span>
      </button>
    </div>
  </nav>`;
}
function buildFooter() {
  const base = window.__ROOT__ || "";
  return `
  <footer class="footer">
    <div class="footer__inner">
      <div>
        <div class="footer__brand"><span class="brand__logo" style="width:28px;height:28px;border-radius:8px">${icon("network")}</span> CCNA Révisions</div>
        <p style="margin-top:8px">Plateforme gratuite et open-source de quiz et révisions Cisco.</p>
      </div>
      <div class="footer__links">
        <a href="${base}index.html">Accueil</a>
        <a href="https://www.netacad.com/" target="_blank" rel="noopener">Cisco NetAcad</a>
        <a href="https://www.netacad.com/portal/resources/packet-tracer" target="_blank" rel="noopener">Packet Tracer</a>
        <a href="https://ccnareponses.com" target="_blank" rel="noopener">Source des questions</a>
      </div>
    </div>
    <div class="footer__inner" style="padding-top:0">
      <p>&copy; 2025–2026 CCNA Révisions — quiz, exercices et réponses pour la certification Cisco.</p>
    </div>
  </footer>`;
}

function mountChrome(active) {
  const navSlot = document.getElementById("nav-slot");
  const footSlot = document.getElementById("footer-slot");
  if (navSlot) navSlot.innerHTML = buildNav(active);
  if (footSlot) footSlot.innerHTML = buildFooter();
  const tt = document.getElementById("themeToggle");
  if (tt) tt.addEventListener("click", toggleTheme);
}

/* ---------- Toast ---------- */
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}
