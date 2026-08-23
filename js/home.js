/* Accueil : enrichit les cartes statiques avec la progression enregistrée. */
(function () {
  mountChrome("home");

  const C = window.CURRICULUM;
  const keys = Object.keys(C);
  const prog = loadProgress();
  const doneKeys = Object.keys(prog);

  // Panneau de progression globale
  if (doneKeys.length) {
    const totalModules = keys.reduce((s, k) => s + C[k].modules.length, 0);
    const avg = Math.round(doneKeys.reduce((s, k) => s + (prog[k].best || 0), 0) / doneKeys.length);
    const panel = document.getElementById("progress-panel");
    if (panel) {
      panel.style.display = "";
      document.getElementById("progress-count").innerHTML =
        `<strong style="color:var(--text)">${doneKeys.length}</strong> / ${totalModules} modules travaillés`;
      requestAnimationFrame(() => { document.getElementById("global-fill").style.width = (doneKeys.length / totalModules * 100) + "%"; });
      document.getElementById("progress-hint").innerHTML =
        `Moyenne de tes meilleurs scores : <strong style="color:var(--primary)">${avg}%</strong>.`;
    }
  }

  // Barre de progression sur chaque parcours travaillé
  document.querySelectorAll(".track[data-track]").forEach(card => {
    const k = card.dataset.track;
    const mods = C[k].modules;
    const done = mods.filter(m => prog[k + "/" + m.id]);
    if (!done.length) return;
    const bestAvg = Math.round(done.reduce((s, m) => s + prog[k + "/" + m.id].best, 0) / done.length);
    const pct = Math.round(done.length / mods.length * 100);
    const div = document.createElement("div");
    div.className = "track__progress";
    div.innerHTML = `<div class="pbar__row"><span>${done.length}/${mods.length} modules · meilleur ${bestAvg}%</span></div><div class="pbar"><div class="pbar__fill" style="width:${pct}%"></div></div>`;
    const meta = card.querySelector(".track__meta");
    card.insertBefore(div, meta);
  });
})();
