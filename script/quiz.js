/* ==========================================================================
   Moteur de quiz — deux modes :
   • entraînement : toutes les questions, correction immédiate, sans limite ;
   • examen blanc : tirage aléatoire, chronomètre, corrigé seulement à la fin.
   Stats live, raccourcis clavier, sauvegarde du score, rejeu des erreurs.
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
  const setupEl = $("setup");
  const qText = $("q-text"), qTag = $("q-tag"), qMulti = $("q-multi"), qImage = $("q-image"), choicesBox = $("q-choices");
  const validateWrap = $("q-validate"), btnValidate = $("btn-validate");
  const feedbackBox = $("q-feedback"), feedbackTxt = $("feedback-txt"), btnNext = $("btn-next");
  const examNav = $("exam-nav"), btnExamNext = $("btn-exam-next");
  const timerEl = $("quiz-timer");
  const fill = $("quiz-fill"), countEl = $("quiz-count");
  const statOk = $("stat-ok"), statKo = $("stat-ko"), statLeft = $("stat-left"), statAnswered = $("stat-answered");
  const qstatOk = $("qstat-ok"), qstatKo = $("qstat-ko"), qstatAnswered = $("qstat-answered");

  const LETTERS = "ABCDEFGHIJ";
  const SECONDS_PER_Q = 90;   // ~1 min 30 par question, comme les examens Cisco
  const PASS_MARK = 70;       // seuil de réussite affiché sur le récapitulatif

  // État
  let all = [];        // toutes les questions (jeu complet mélangé)
  let questions = [];  // jeu de travail courant
  let current = 0, score = 0;
  let wrong = [];      // { q, given, correct }
  let selected = [];
  let answered = false;

  // Mode examen
  let mode = "train";       // "train" | "exam"
  let examLength = 0;       // nombre de questions tirées
  let timerId = null, deadline = 0, timeUsed = 0, timedOut = false;

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
      showSetup();
    })
    .catch(() => {
      loader.style.display = "none";
      errorBox.style.display = "";
    });

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // ---------- Écran de choix du mode ----------
  const examLengths = [20, 30, 50];
  let chosenLength = 0;

  function fmtDuration(sec) {
    const m = Math.round(sec / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h} h ${String(r).padStart(2, "0")}` : `${h} h`;
  }

  function showSetup() {
    loader.style.display = "none";
    errorBox.style.display = "none";
    quizEl.style.display = "none";
    recapEl.style.display = "none";
    setupEl.style.display = "";
    stopTimer();

    $("setup-title").textContent = `${label} · ${moduleName}`;
    $("setup-count").textContent = `${all.length} question${all.length > 1 ? "s" : ""}`;
    const bcS = $("bc-course-setup");
    if (bcS && courseMeta) { bcS.textContent = label; bcS.href = `/${ccna}/`; }
    $("bc-module-setup").textContent = moduleName;
    $("mode-train-ic").innerHTML = icon("book");
    $("mode-exam-ic").innerHTML = icon("trophy");
    $("mode-train-desc").textContent =
      `Les ${all.length} questions du module, correction immédiate, sans limite de temps.`;

    // Longueurs proposées : uniquement celles qui tiennent dans le module,
    // plus le module entier s'il dépasse la plus grande.
    const opts = examLengths.filter(n => n < all.length);
    opts.push(all.length);
    chosenLength = opts.includes(30) ? 30 : opts[Math.min(1, opts.length - 1)];

    const box = $("exam-lengths");
    box.innerHTML = "";
    opts.forEach(n => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opt-chip" + (n === chosenLength ? " is-on" : "");
      b.textContent = n === all.length ? `Tout (${n})` : n;
      b.setAttribute("aria-pressed", n === chosenLength ? "true" : "false");
      b.addEventListener("click", () => {
        chosenLength = n;
        [...box.children].forEach(c => {
          const on = c === b;
          c.classList.toggle("is-on", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        updateExamSummary();
      });
      box.appendChild(b);
    });
    updateExamSummary();
    $("mode-exam-desc").textContent =
      `Questions tirées au sort, chronométré (${SECONDS_PER_Q / 60} min 30 par question), corrigé à la fin.`;
  }

  function updateExamSummary() {
    $("exam-summary").textContent =
      `${chosenLength} questions tirées au sort · ${fmtDuration(chosenLength * SECONDS_PER_Q)} · réussite à ${PASS_MARK} %`;
  }

  $("mode-train").addEventListener("click", () => { mode = "train"; startQuiz(all.slice()); });
  $("mode-exam").addEventListener("click", () => {
    const box = $("exam-opts");
    const open = box.style.display === "none";
    box.style.display = open ? "" : "none";
    $("mode-exam").setAttribute("aria-expanded", open ? "true" : "false");
    $("mode-exam").classList.toggle("is-on", open);
    if (open) $("btn-start-exam").focus();
  });
  $("btn-start-exam").addEventListener("click", () => {
    mode = "exam";
    examLength = Math.min(chosenLength, all.length);
    startQuiz(shuffle(all.slice()).slice(0, examLength));
  });
  $("btn-change-mode").addEventListener("click", showSetup);

  // ---------- Chronomètre ----------
  let examTotal = 0;
  function startTimer(seconds) {
    stopTimer();
    examTotal = seconds;
    deadline = Date.now() + seconds * 1000;
    timerEl.style.display = "";
    tick();
    timerId = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    timerEl.style.display = "none";
    timerEl.classList.remove("is-low");
  }

  function tick() {
    const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
    const m = Math.floor(left / 60), s = left % 60;
    timerEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
    timerEl.classList.toggle("is-low", left <= 60);
    if (left <= 0) { timedOut = true; finishExam(); }
  }

  // Temps écoulé : on comptabilise les questions non traitées comme ratées.
  function finishExam() {
    stopTimer();
    for (let i = current; i < questions.length; i++) {
      const q = questions[i];
      if (i === current && answered) continue;
      wrong.push({
        question: q.question,
        image: q.image || null,
        choices: q.choices,
        answers: q.answers,
        given: "(pas de réponse)",
        correct: [...q.answers].sort((a, b) => a - b).map(i2 => q.choices[i2]).join(" · ")
      });
    }
    current = questions.length;
    showRecap();
  }

  function startQuiz(set) {
    questions = shuffle(set.slice());
    current = 0; score = 0; wrong = [];
    timedOut = false; timeUsed = 0;
    loader.style.display = "none";
    errorBox.style.display = "none";
    setupEl.style.display = "none";
    recapEl.style.display = "none";
    quizEl.style.display = "";

    const exam = mode === "exam";
    // En examen, masquer réussies/ratées : ce serait un corrigé déguisé.
    qstatOk.style.display = exam ? "none" : "";
    qstatKo.style.display = exam ? "none" : "";
    qstatAnswered.style.display = exam ? "" : "none";
    if (exam) startTimer(questions.length * SECONDS_PER_Q); else stopTimer();

    updateStats();
    loadQuestion();
  }

  function updateStats() {
    statOk.textContent = score;
    statKo.textContent = wrong.length;
    statAnswered.textContent = current + (answered ? 1 : 0);
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

    const exam = mode === "exam";
    // En examen, un seul bouton « suivant » qui enregistre la réponse sans la corriger.
    validateWrap.style.display = (!exam && multi) ? "" : "none";
    btnValidate.disabled = true;
    feedbackBox.style.display = "none";
    feedbackBox.className = "qfeedback";
    examNav.style.display = exam ? "" : "none";
    if (exam) {
      const last = current === questions.length - 1;
      btnExamNext.innerHTML = last
        ? `Terminer l’examen <span class="kbd">Entrée</span>`
        : `Question suivante <span class="kbd">Entrée</span>`;
      btnExamNext.disabled = true;
      $("exam-nav-hint").textContent = multi
        ? `Choisis ${q.answers.length} réponses. Aucune correction avant la fin.`
        : "Aucune correction avant la fin de l’examen.";
    }

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

    // Examen : on sélectionne librement, rien n'est corrigé ni révélé.
    if (mode === "exam") {
      if (multi) {
        if (selected.includes(index)) { selected = selected.filter(i => i !== index); btn.classList.remove("is-selected"); }
        else { selected.push(index); btn.classList.add("is-selected"); }
      } else {
        selected = [index];
        choicesBox.querySelectorAll(".choice").forEach(b => b.classList.toggle("is-selected", b === btn));
      }
      btnExamNext.disabled = selected.length === 0;
      return;
    }

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

  // Note la question courante et journalise l'erreur éventuelle.
  function grade() {
    const q = questions[current];
    const correct = [...q.answers].sort((a, b) => a - b);
    const user = [...selected].sort((a, b) => a - b);
    const ok = JSON.stringify(correct) === JSON.stringify(user);
    if (ok) score++;
    else wrong.push({
      question: q.question,
      image: q.image || null,
      choices: q.choices,
      answers: q.answers,
      given: user.map(i => q.choices[i]).join(" · ") || "(aucune)",
      correct: correct.map(i => q.choices[i]).join(" · ")
    });
    return { ok, correct, user };
  }

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

    const { ok } = grade();
    if (ok) {
      feedbackBox.className = "qfeedback ok";
      feedbackTxt.innerHTML = `${icon("check")} Bonne réponse !`;
    } else {
      feedbackBox.className = "qfeedback ko";
      feedbackTxt.innerHTML = `${icon("x")} Mauvaise réponse`;
    }
    feedbackBox.style.display = "";
    updateStats();
    btnNext.focus();
  }

  // Examen : enregistre la réponse en silence et enchaîne.
  btnExamNext.addEventListener("click", examNext);
  function examNext() {
    if (mode !== "exam" || !selected.length) return;
    grade();
    current++;
    updateStats();
    if (current < questions.length) loadQuestion();
    else { stopTimer(); showRecap(); }
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
    const exam = mode === "exam";
    if (exam) {
      timeUsed = Math.min(examTotal, Math.max(0, examTotal - Math.round((deadline - Date.now()) / 1000)));
      stopTimer();
    }
    quizEl.style.display = "none";
    recapEl.style.display = "";
    fill.style.width = "100%";

    const total = questions.length;
    const pct = total ? Math.round(score / total * 100) : 0;

    // Sauvegarde du meilleur score (uniquement sur un tour complet du module)
    if (total === all.length) saveModuleResult(ccna, moduleId, score, total);

    const ring = $("score-ring");
    const color = exam
      ? (pct >= PASS_MARK ? "var(--success)" : "var(--danger)")
      : (pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--primary)" : "var(--danger)");
    ring.style.setProperty("--ring-color", color);
    $("ring-val").innerHTML = `${pct}<small>%</small>`;
    requestAnimationFrame(() => ring.style.setProperty("--p", pct));

    let msg, sub;
    if (exam) {
      const passed = pct >= PASS_MARK;
      msg = passed ? "Examen réussi" : "Examen non validé";
      const mm = Math.floor(timeUsed / 60), ss = timeUsed % 60;
      const chrono = `${mm} min ${String(ss).padStart(2, "0")} s`;
      sub = timedOut
        ? `Temps écoulé — les questions non traitées comptent comme fausses. Temps : ${chrono}.`
        : `Terminé en ${chrono}. Seuil de réussite : ${PASS_MARK} %.`;
    } else if (pct >= 90) { msg = "Excellent"; sub = "Tu maîtrises ce module."; }
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

  // Recommencer : nouveau tirage en examen, module entier en entraînement.
  $("btn-restart").addEventListener("click", () => {
    if (mode === "exam") startQuiz(shuffle(all.slice()).slice(0, examLength));
    else startQuiz(all.slice());
  });

  // Rejouer ses erreurs se fait toujours en entraînement : on veut la correction.
  $("btn-retry-wrong").addEventListener("click", () => {
    const set = wrong.map(w => ({ question: w.question, choices: w.choices, answers: w.answers, image: w.image }));
    if (!set.length) return;
    mode = "train";
    toast("Révision des " + set.length + " question(s) ratée(s)");
    startQuiz(set);
  });

  // ---------- Raccourcis clavier ----------
  document.addEventListener("keydown", e => {
    if (recapEl.style.display !== "none" || quizEl.style.display === "none") return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    // Laisse passer les raccourcis du navigateur (Ctrl+C, Cmd+V, AltGr…) :
    // sans ce garde, Ctrl+C sélectionnerait la réponse C.
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Suivant : Espace / Entrée quand la réponse est validée
    if (answered && (e.code === "Space" || e.key === "Enter")) { e.preventDefault(); next(); return; }
    if (answered) return;

    const q = questions[current];
    const multi = q.answers.length > 1;

    // Examen : Entrée / Espace enregistre la réponse et passe à la suite
    if (mode === "exam") {
      if ((e.key === "Enter" || e.code === "Space") && selected.length) { e.preventDefault(); examNext(); return; }
    } else if (multi && e.key === "Enter" && selected.length) {
      // Valider (multi) avec Entrée
      e.preventDefault(); check(); return;
    }

    // Sélection par lettre (A, B, …) ou chiffre (1, 2, …)
    let idx = -1;
    const up = e.key.toUpperCase();
    if (LETTERS.includes(up) && up.charCodeAt(0) - 65 < q.choices.length) idx = up.charCodeAt(0) - 65;
    else if (/^[1-9]$/.test(e.key) && +e.key <= q.choices.length) idx = +e.key - 1;
    if (idx >= 0) { e.preventDefault(); onChoice(idx); }
  });
})();
