/* Page de parcours : enrichit les cartes statiques (progression) + recherche. */
(function () {
  const seg = location.pathname.split("/").filter(Boolean)[0] || "";
  const track = window.CURRICULUM[seg] ? seg : null;
  mountChrome(track);
  if (!track) return;

  const C = window.CURRICULUM[track];
  const prog = loadProgress();

  // Badges de progression sur les cartes existantes
  let done = 0;
  document.querySelectorAll(".module[data-module]").forEach(card => {
    const p = prog[track + "/" + card.dataset.module];
    if (!p) return;
    done++;
    const chip = card.querySelector("[data-chip]");
    if (chip) {
      const ok = p.best >= 80;
      chip.className = "chip " + (ok ? "chip--done" : "chip--progress");
      chip.innerHTML = `${icon(ok ? "check" : "target")} Meilleur ${p.best}%`;
    }
  });
  if (done) {
    const stat = document.getElementById("course-stat");
    if (stat) stat.innerHTML += ` · <strong style="color:var(--primary)">${done} travaillé${done > 1 ? "s" : ""}</strong>`;
  }

  // Recherche
  const input = document.getElementById("module-search");
  if (input) {
    const icEl = document.getElementById("search-ic");
    if (icEl) icEl.innerHTML = icon("search");
    const cards = [...document.querySelectorAll(".module[data-module]")];
    const grid = document.getElementById("modules");
    let empty = null;
    input.addEventListener("input", e => {
      const f = e.target.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach(card => {
        const txt = (card.querySelector("h3").textContent + " " + card.querySelector(".module__desc").textContent).toLowerCase();
        const match = !f || txt.includes(f);
        card.style.display = match ? "" : "none";
        if (match) shown++;
      });
      if (!shown) {
        if (!empty) { empty = document.createElement("p"); empty.style.cssText = "grid-column:1/-1;text-align:center;color:var(--text-muted);padding:30px"; grid.appendChild(empty); }
        empty.textContent = `Aucun module ne correspond à « ${e.target.value} ».`;
        empty.style.display = "";
      } else if (empty) { empty.style.display = "none"; }
    });
  }
})();
