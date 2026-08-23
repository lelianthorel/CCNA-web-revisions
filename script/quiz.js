/* ==========================================================================
   Moteur de quiz — feedback immédiat, stats live, raccourcis clavier,
   sauvegarde du score, rejeu des questions ratées.
   ========================================================================== */
(function () {
  mountChrome();

  const params = new URLSearchParams(location.search);
  const ccna = params.get("ccna");
  const moduleId = params.get("module");

  const meta = (window.CURRICULUM[ccna]?.modules || []).find(m => m.id === moduleId);
  const courseMeta = window.CURRICULUM[ccna];
  const label = courseMeta ? courseMeta.label : (ccna || "").toUpperCase();
  const moduleName = meta ? meta.name : moduleId;

  // Éléments
  const $ = id => document.getElementById(id);
  const loader = $("loader"), errorBox = $("error-box"), quizEl = $("quiz"), recapEl = $("recap");
  const qText = $("q-text"), qTag = $("q-tag"), qMulti = $("q-multi"), qImage = $("q-image"), choicesBox = $("q-choices");
  const validateWrap = $("q-validate"), btnValidate = $("btn-validate");
  const feedbackBox = $("q-feedback"), feedbackTxt = $("feedback-txt"), btnNext = $("btn-next");
  const fill = $("quiz-fill"), countEl = $("quiz-count");
  const statOk = $("stat-ok"), statKo = $("stat-ko"), statLeft = $("stat-left");

  const LETTERS = "ABCDEFGHIJ";

  // État
  let all = [];        // toutes les questions (jeu complet mélangé)
  let questions = [];  // jeu de travail courant
  let current = 0, score = 0;
  let wrong = [];      // { q, given, correct }
  let selected = [];
  let answered = false;

  // Titre / fil d'ariane
  $("quiz-title").textContent = `${label} · ${moduleName}`;
  document.title = `Quiz ${label} — ${moduleName} · CCNA Révisions`;
  const bcCourse = $("bc-course");
  if (bcCourse && courseMeta) { bcCourse.textContent = label; bcCourse.href = `/${ccna}/`; }
  $("bc-module").textContent = moduleName;
  $("btn-back").href = courseMeta ? `/${ccna}/` : "/index.html";
  $("btn-next").innerHTML = `Suivant <span class="kbd">Espace</span>`;

  // Avertissement éventuel du parcours (CSNA/CSNE)
  if (courseMeta && courseMeta.warning) {
    const note = document.createElement("div");
    note.className = "notice notice--warn";
    note.setAttribute("role", "note");
    note.style.margin = "0 0 16px";
    note.innerHTML = `<span class="notice__ic">${icon("alert")}</span><p><strong>À noter —</strong> ${courseMeta.warning}</p>`;
    const qcard = $("qcard");
    qcard.parentNode.insertBefore(note, qcard);
  }

  // ---------- Chargement ----------
  fetch(`/data/${ccna}/${moduleId}.json`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      all = data.filter(q => q && q.choices && q.answers);
      if (!all.length) throw new Error("vide");
      startQuiz(all.slice());
    })
    .catch(() => {
      loader.style.display = "none";
      errorBox.style.display = "";
    });

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function startQuiz(set) {
    questions = shuffle(set.slice());
    current = 0; score = 0; wrong = [];
    loader.style.display = "none";
    errorBox.style.display = "none";
    recapEl.style.display = "none";
    quizEl.style.display = "";
    updateStats();
    loadQuestion();
  }

  function updateStats() {
    statOk.textContent = score;
    statKo.textContent = wrong.length;
    statLeft.textContent = questions.length - current;
  }

  function loadQuestion() {
    const q = questions[current];
    selected = [];
    answered = false;
    const multi = q.answers.length > 1;

    qTag.innerHTML = `${icon("book")} ${moduleName} · ${label}`;
    qText.innerHTML = q.question;

    if (multi) {
      qMulti.style.display = "";
      qMulti.innerHTML = `${icon("target")} Plusieurs bonnes réponses — choisis-en ${q.answers.length}, puis valide.`;
    } else {
      qMulti.style.display = "none";
    }

    if (q.image) { qImage.src = q.image; qImage.style.display = ""; qImage.alt = "Illustration : " + (q.question || "").replace(/<[^>]*>/g, "").slice(0, 80); }
    else { qImage.style.display = "none"; qImage.removeAttribute("src"); }

    choicesBox.innerHTML = "";
    q.choices.forEach((choice, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.index = index;
      btn.innerHTML = `<span class="choice__mark"><span class="mk-letter">${LETTERS[index] || (index + 1)}</span><span class="mk-check">${icon("check")}</span></span><span class="choice__label">${choice}</span>`;
      btn.addEventListener("click", () => onChoice(index));
      choicesBox.appendChild(btn);
    });

    // Bouton valider seulement pour le multi
    validateWrap.style.display = multi ? "" : "none";
    btnValidate.disabled = true;
    feedbackBox.style.display = "none";
    feedbackBox.className = "qfeedback";

    // Progression
    countEl.textContent = `Question ${current + 1} / ${questions.length}`;
    fill.style.width = (current / questions.length * 100) + "%";
    updateStats();

    // refocus card pour l'accessibilité
    $("qcard").classList.remove("fade-in"); void $("qcard").offsetWidth; $("qcard").classList.add("fade-in");
  }

  function onChoice(index) {
    if (answered) return;
    const q = questions[current];
    const multi = q.answers.length > 1;
    const btn = choicesBox.querySelector(`[data-index="${index}"]`);

    if (!multi) {
      selected = [index];
      check();
    } else {
      if (selected.includes(index)) { selected = selected.filter(i => i !== index); btn.classList.remove("is-selected"); }
      else { selected.push(index); btn.classList.add("is-selected"); }
      btnValidate.disabled = selected.length === 0;
    }
  }

  btnValidate.addEventListener("click", () => { if (!answered && selected.length) check(); });

  function check() {
    answered = true;
    const q = questions[current];
    const correct = [...q.answers].sort((a, b) => a - b);
    const user = [...selected].sort((a, b) => a - b);

    choicesBox.querySelectorAll(".choice").forEach(btn => {
      btn.disabled = true;
      const idx = +btn.dataset.index;
      btn.classList.remove("is-selected");
      if (correct.includes(idx)) btn.classList.add("correct");
      else if (user.includes(idx)) btn.classList.add("wrong");
    });

    validateWrap.style.display = "none";

    const ok = JSON.stringify(correct) === JSON.stringify(user);
    if (ok) {
      score++;
      feedbackBox.className = "qfeedback ok";
      feedbackTxt.innerHTML = `${icon("check")} Bonne réponse !`;
    } else {
      feedbackBox.className = "qfeedback ko";
      feedbackTxt.innerHTML = `${icon("x")} Mauvaise réponse`;
      wrong.push({
        question: q.question,
        image: q.image || null,
        choices: q.choices,
        answers: q.answers,
        given: user.map(i => q.choices[i]).join(" · ") || "(aucune)",
        correct: correct.map(i => q.choices[i]).join(" · ")
      });
    }
    feedbackBox.style.display = "";
    updateStats();
    btnNext.focus();
  }

  btnNext.addEventListener("click", next);
  function next() {
    if (!answered) return;
    current++;
    if (current < questions.length) loadQuestion();
    else showRecap();
  }

  // ---------- Récapitulatif ----------
  function showRecap() {
    quizEl.style.display = "none";
    recapEl.style.display = "";
    fill.style.width = "100%";

    const total = questions.length;
    const pct = total ? Math.round(score / total * 100) : 0;

    // Sauvegarde du meilleur score (uniquement sur un tour complet du module)
    if (total === all.length) saveModuleResult(ccna, moduleId, score, total);

    const ring = $("score-ring");
    const color = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--primary)" : "var(--danger)";
    ring.style.setProperty("--ring-color", color);
    $("ring-val").innerHTML = `${pct}<small>%</small>`;
    requestAnimationFrame(() => ring.style.setProperty("--p", pct));

    let msg, sub;
    if (pct >= 90) { msg = "Excellent"; sub = "Tu maîtrises ce module."; }
    else if (pct >= 70) { msg = "Bien joué"; sub = "Encore un petit effort sur les erreurs."; }
    else if (pct >= 50) { msg = "Continue comme ça"; sub = "Revois les questions ratées pour progresser."; }
    else { msg = "À retravailler"; sub = "Rejoue les erreurs pour t’améliorer."; }
    $("recap-msg").textContent = msg;
    $("recap-sub").textContent = `${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""} sur ${total}. ${sub}`;

    // Liste des erreurs
    const mistakesEl = $("mistakes");
    if (wrong.length) {
      mistakesEl.innerHTML =
        `<h2>${icon("x")} Questions à revoir (${wrong.length})</h2>` +
        wrong.map(w => `
          <div class="mistake">
            <p class="mistake__q">${w.question}</p>
            <div class="mistake__line"><b>Ta réponse :</b> <span class="mistake__given">${w.given}</span></div>
            <div class="mistake__line"><b>Bonne réponse :</b> <span class="mistake__correct">${w.correct}</span></div>
          </div>`).join("");
      $("btn-retry-wrong").style.display = "";
    } else {
      mistakesEl.innerHTML = `<div class="empty-good">${icon("check")} Aucune erreur sur ce quiz.</div>`;
      $("btn-retry-wrong").style.display = "none";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $("btn-restart").addEventListener("click", () => startQuiz(all.slice()));
  $("btn-retry-wrong").addEventListener("click", () => {
    const set = wrong.map(w => ({ question: w.question, choices: w.choices, answers: w.answers, image: w.image }));
    if (set.length) { toast("Révision des " + set.length + " question(s) ratée(s)"); startQuiz(set); }
  });

  // ---------- Raccourcis clavier ----------
  document.addEventListener("keydown", e => {
    if (recapEl.style.display !== "none" || quizEl.style.display === "none") return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    // Suivant : Espace / Entrée quand la réponse est validée
    if (answered && (e.code === "Space" || e.key === "Enter")) { e.preventDefault(); next(); return; }
    if (answered) return;

    const q = questions[current];
    const multi = q.answers.length > 1;

    // Valider (multi) avec Entrée
    if (multi && e.key === "Enter" && selected.length) { e.preventDefault(); check(); return; }

    // Sélection par lettre (A, B, …) ou chiffre (1, 2, …)
    let idx = -1;
    const up = e.key.toUpperCase();
    if (LETTERS.includes(up) && up.charCodeAt(0) - 65 < q.choices.length) idx = up.charCodeAt(0) - 65;
    else if (/^[1-9]$/.test(e.key) && +e.key <= q.choices.length) idx = +e.key - 1;
    if (idx >= 0) { e.preventDefault(); onChoice(idx); }
  });
})();
