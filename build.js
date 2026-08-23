/* Générateur statique : pages HTML crawlables + données structurées + sitemap. */
const fs = require("fs");
const path = require("path");

global.window = global;
require("./js/curriculum.js");
const C = global.CURRICULUM;

const ROOT = __dirname;
const SITE = "https://ccna-revision.fr";
const VERSION = Date.now().toString(36); // cache-busting des assets

// Vérifie les compteurs réels de questions
for (const k of Object.keys(C)) {
  for (const m of C[k].modules) {
    const p = path.join(ROOT, "data", k, m.id + ".json");
    try {
      const n = JSON.parse(fs.readFileSync(p, "utf8")).length;
      if (n !== m.count) { console.warn(`⚠ ${k}/${m.id}: curriculum=${m.count} réel=${n} → corrigé`); m.count = n; }
    } catch (e) { console.warn("⚠ illisible:", p); }
  }
}

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const trackTotal = k => C[k].modules.reduce((s, m) => s + m.count, 0);
const grandTotal = Object.keys(C).reduce((s, k) => s + trackTotal(k), 0);

const HEAD_FONTS = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">`;

const ANTIFOUC = `  <script>
    window.__ROOT__ = "/";
    (function(){ try { var t = localStorage.getItem("ccna-theme"); if (t) document.documentElement.setAttribute("data-theme", t); } catch(e){} })();
  </script>`;

function jsonld(obj) {
  return `  <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n  </script>`;
}

/* ---------------- ICÔNES (mêmes que app.js, pour le rendu statique) ---------------- */
const ICONS = require("./js/icons.js");
const icon = n => ICONS[n] || ICONS.book;

/* ---------------- PAGE D'ACCUEIL ---------------- */
function buildHome() {
  const tracks = Object.keys(C).map(k => {
    const t = C[k], n = t.modules.length, tot = trackTotal(k);
    return `        <a class="track" href="/${k}/" data-track="${k}">
          <div class="track__head">
            <span class="track__icon">${icon(t.icon)}</span>
            <div><div class="track__label">${t.label}</div><h3>${esc(t.title)}</h3></div>
          </div>
          <p class="track__desc">${esc(t.desc)}</p>
          <div class="track__meta">
            <span class="track__stat">${n} module${n > 1 ? "s" : ""} · ${tot} questions</span>
            <span class="track__go">Réviser ${icon("arrow")}</span>
          </div>
        </a>`;
  }).join("\n");

  const features = [
    ["bolt", "Correction immédiate", "Chaque réponse est corrigée sur-le-champ, avec la bonne réponse mise en évidence."],
    ["chart", "Suivi de progression", "Ton meilleur score par module est conservé dans ton navigateur, sans compte à créer."],
    ["target", "Entraînement ciblé", "Rejoue uniquement les questions ratées à la fin d’un quiz pour combler tes lacunes."],
    ["search", "Recherche de modules", "Retrouve rapidement un module par mot-clé pour réviser une notion précise."],
    ["cards", "Questions mélangées", "L’ordre des questions et l’enchaînement changent à chaque tentative."],
    ["book", "Aligné sur le programme", "Questions organisées par module officiel : CCNA 1, CCNA 2, CSNA et CSNE."]
  ].map(([ic, t, d]) => `        <div class="feature card">
          <span class="feature__ic">${icon(ic)}</span>
          <div><h3>${t}</h3><p>${d}</p></div>
        </div>`).join("\n");

  const faqs = [
    ["Le site CCNA Révisions est-il gratuit ?", "Oui, CCNA Révisions est 100 % gratuit et sans inscription. Tous les quiz des parcours CCNA 1, CCNA 2, CSNA et CSNE sont accessibles librement."],
    ["Quelles certifications puis-je réviser ?", "Deux univers : côté Cisco, le CCNA 1 (Introduction aux réseaux) et le CCNA 2 (Commutation, routage et sans-fil) ; côté Stormshield, le CSNA (administration des firewalls SNS) et le CSNE (niveau expert). Les quiz sont organisés par module."],
    ["Les questions correspondent-elles aux examens officiels ?", "Les quiz CCNA suivent les modules du cursus Cisco Networking Academy, et les quiz CSNA/CSNE les thèmes des certifications Stormshield. Ils servent d’entraînement : vérifie toujours avec tes cours et des sources fiables."],
    ["Comment suivre ma progression ?", "Ton meilleur score par module est enregistré automatiquement dans ton navigateur, sans compte à créer. Tu peux aussi rejouer uniquement les questions ratées."]
  ];

  const ld = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "CCNA Révisions",
      alternateName: ["CCNA Révision", "CCNA Revisions", "ccna-revision.fr"], url: SITE + "/",
      description: "Quiz interactifs gratuits pour réviser les certifications Cisco CCNA (1 et 2) et Stormshield (CSNA, CSNE).",
      inLanguage: "fr", publisher: { "@type": "Organization", name: "CCNA Révisions", url: SITE + "/" } },
    { "@context": "https://schema.org", "@type": "EducationalOrganization", name: "CCNA Révisions",
      alternateName: "CCNA Révision", url: SITE + "/", logo: SITE + "/img/routeur.png",
      description: "Plateforme gratuite de quiz et de révisions pour les certifications Cisco (CCNA 1, CCNA 2) et Stormshield (CSNA, CSNE).",
      sameAs: ["https://ccnareponses.com"] },
    { "@context": "https://schema.org", "@type": "ItemList", name: "Parcours de révision réseau et sécurité",
      itemListElement: Object.keys(C).map((k, i) => ({ "@type": "ListItem", position: i + 1, name: `${C[k].label} — ${C[k].title}`, url: `${SITE}/${k}/` })) },
    { "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
  ];

  return page({
    lang: "fr",
    title: "CCNA Révisions – Quiz gratuits Cisco CCNA & Stormshield CSNA/CSNE",
    desc: `Révise le CCNA 1, CCNA 2 (Cisco) et le CSNA, CSNE (Stormshield) avec ${grandTotal} questions de quiz corrigées et gratuites. Correction immédiate, suivi de progression et entraînement ciblé pour réussir tes certifications réseau et sécurité.`,
    canonical: SITE + "/",
    ogUrl: SITE + "/",
    ld,
    body: `  <div id="nav-slot"></div>

  <main class="container page">
    <section class="hero">
      <span class="eyebrow">Révisions Cisco &amp; Stormshield</span>
      <h1>Réussis tes certifications <span class="accent">Cisco &amp; Stormshield</span></h1>
      <p class="lead">Entraîne-toi gratuitement aux examens Cisco CCNA et Stormshield CSNA/CSNE avec ${grandTotal} questions de quiz corrigées, réparties par module officiel. Correction immédiate, suivi de ta progression et rejeu des questions ratées.</p>
      <div class="hero__cta">
        <a href="/ccna1/" class="btn btn--primary btn--lg">Commencer par le CCNA 1</a>
        <a href="#parcours" class="btn btn--ghost btn--lg">Voir tous les parcours</a>
      </div>
    </section>

    <section class="section" id="progress-panel" style="display:none">
      <div class="card">
        <div class="pbar__row"><span style="font-size:.95rem;color:var(--text)">Ta progression</span><span id="progress-count"></span></div>
        <div class="pbar"><div class="pbar__fill" id="global-fill"></div></div>
        <p style="margin:12px 0 0;color:var(--text-muted);font-size:.88rem" id="progress-hint"></p>
      </div>
    </section>

    <section class="section" id="parcours">
      <div class="section-head">
        <h2>Choisis ton parcours de révision</h2>
        <p>Chaque parcours regroupe les modules officiels et leurs quiz corrigés.</p>
      </div>
      <div class="grid grid--2" id="tracks">
${tracks}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Une méthode de révision efficace</h2>
        <p>Tout ce qu’il faut pour transformer tes révisions en points le jour de l’examen.</p>
      </div>
      <div class="grid grid--3">
${features}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Questions fréquentes</h2>
        <p>Tout savoir sur CCNA Révisions et la préparation aux certifications réseau et sécurité.</p>
      </div>
      <div class="faq">
${faqs.map(([q, a]) => `        <details class="faq__item">
          <summary>${esc(q)}</summary>
          <p>${esc(a)}</p>
        </details>`).join("\n")}
      </div>
    </section>

    <section class="section">
      <div class="card">
        <h2 style="font-size:1.25rem;margin-bottom:6px">À propos de CCNA Révisions</h2>
        <p style="color:var(--text-muted);margin:0 0 14px">CCNA Révisions est une plateforme pédagogique gratuite et open-source destinée aux étudiants en informatique, réseaux et cybersécurité. Les quiz couvrent les modules du cursus Cisco Networking Academy (CCNA 1 et 2) — introduction aux réseaux, commutation, routage, réseaux sans fil et sécurité — ainsi que les certifications Stormshield (CSNA et CSNE) sur l’administration et l’exploitation des firewalls Network Security.</p>
        <h2 style="font-size:1.25rem;margin:18px 0 10px">Ressources officielles</h2>
        <div class="grid grid--2">
          <a class="feature" href="https://www.netacad.com/" target="_blank" rel="noopener" style="padding:14px;border:1px solid var(--border);border-radius:12px">
            <span class="feature__ic">${icon("external")}</span>
            <div><h3>Cisco NetAcad</h3><p>La plateforme officielle de la Networking Academy.</p></div>
          </a>
          <a class="feature" href="https://www.netacad.com/portal/resources/packet-tracer" target="_blank" rel="noopener" style="padding:14px;border:1px solid var(--border);border-radius:12px">
            <span class="feature__ic">${icon("download")}</span>
            <div><h3>Packet Tracer</h3><p>Le simulateur réseau de Cisco à télécharger.</p></div>
          </a>
        </div>
        <p style="margin:14px 0 0;color:var(--text-faint);font-size:.85rem">Les questions proviennent de <a href="https://ccnareponses.com" target="_blank" rel="noopener">ccnareponses.com</a>, une base d’entraînement aux certifications réseau et sécurité.</p>
      </div>
    </section>
  </main>

  <div id="footer-slot"></div>

  <script src="/js/curriculum.js"></script>
  <script src="/js/icons.js"></script>
  <script src="/js/app.js"></script>
  <script src="/js/home.js"></script>`
  });
}

/* ---------------- PAGE DE PARCOURS ---------------- */
function buildCourse(k) {
  const t = C[k], n = t.modules.length, tot = trackTotal(k);
  const modules = t.modules.map(m => `        <a class="module" href="/quiz/?ccna=${k}&amp;module=${m.id}" data-module="${m.id}">
          <div class="module__top">
            <span class="module__badge">${icon(m.icon)}</span>
            <h3>${esc(m.name)}</h3>
          </div>
          <p class="module__desc">${esc(m.topic)}</p>
          <div class="module__foot">
            <span class="chip" data-chip>${m.count} questions</span>
            <span class="track__go" style="font-size:.85rem">Réviser ${icon("chevron")}</span>
          </div>
        </a>`).join("\n");

  const showSearch = n > 2;

  const ld = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: t.label, item: `${SITE}/${k}/` }
    ]},
    { "@context": "https://schema.org", "@type": "Course", name: `${t.label} — ${t.title}`,
      description: t.desc, url: `${SITE}/${k}/`, inLanguage: "fr", isAccessibleForFree: true,
      provider: { "@type": "Organization", name: "CCNA Révisions", url: SITE + "/" },
      hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${Math.round(tot * 1.2)}M` } },
    { "@context": "https://schema.org", "@type": "ItemList", name: `Modules ${t.label}`,
      itemListElement: t.modules.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: `${m.name} — ${m.topic}`, url: `${SITE}/quiz/?ccna=${k}&module=${m.id}` })) }
  ];

  return page({
    lang: "fr",
    title: `${t.label} — ${t.title} · Quiz par module | CCNA Révisions`,
    desc: `Révise le ${t.label} (${t.title}) : ${n > 1 ? n + " modules de quiz interactifs" : "quiz interactif"}, ${tot} questions corrigées gratuites. ${t.desc}`,
    canonical: `${SITE}/${k}/`,
    ogUrl: `${SITE}/${k}/`,
    ld,
    body: `  <div id="nav-slot"></div>

  <main class="container page">
    <header class="page-head">
      <nav class="breadcrumb" aria-label="Fil d’Ariane">
        <a href="/index.html">Accueil</a> <span class="sep"></span> <span>${t.label}</span>
      </nav>
      <span class="eyebrow">${t.label}</span>
      <h1>${esc(t.title)}</h1>
      <p>${esc(t.desc)}</p>
      <p class="track__stat" id="course-stat">${n} module${n > 1 ? "s" : ""} · ${tot} questions</p>
    </header>
${t.warning ? `
    <div class="notice notice--warn" role="note">
      <span class="notice__ic">${icon("alert")}</span>
      <p><strong>À noter —</strong> ${esc(t.warning)}</p>
    </div>
` : ""}${showSearch ? `
    <div class="toolbar" id="search-wrap">
      <label class="search">
        <span id="search-ic"></span>
        <input type="search" id="module-search" placeholder="Rechercher un module…" aria-label="Rechercher un module">
      </label>
    </div>
` : ""}
    <section class="grid grid--3" id="modules" style="margin-top:22px" aria-label="Modules ${t.label}">
${modules}
    </section>
  </main>

  <div id="footer-slot"></div>

  <script src="/js/curriculum.js"></script>
  <script src="/js/icons.js"></script>
  <script src="/js/app.js"></script>
  <script src="/js/course.js"></script>`
  });
}

/* ---------------- GABARIT ---------------- */
function page({ lang, title, desc, canonical, ogUrl, ld, body, noindex }) {
  const ldBlocks = (ld || []).map(jsonld).join("\n");
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${esc(desc)}">
  ${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
  <meta name="theme-color" content="#1657c7">
  <meta name="application-name" content="CCNA Révisions">
  <meta name="apple-mobile-web-app-title" content="CCNA Révisions">
  <meta name="author" content="CCNA Révisions">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CCNA Révisions">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${ogUrl}">
  <meta property="og:image" content="${SITE}/img/routeur.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <link rel="icon" href="/img/routeur.png" type="image/png">
${HEAD_FONTS}
  <link rel="stylesheet" href="/css/style.css">
${ANTIFOUC}
${ldBlocks}
</head>
<body>
${body}
</body>
</html>
`;
}

/* ---------------- ÉCRITURE ---------------- */
fs.writeFileSync(path.join(ROOT, "index.html"), buildHome());
console.log("✓ index.html");
for (const k of Object.keys(C)) {
  fs.writeFileSync(path.join(ROOT, k, "index.html"), buildCourse(k));
  console.log(`✓ ${k}/index.html`);
}

// sitemap.xml
const urls = [SITE + "/", ...Object.keys(C).map(k => `${SITE}/${k}/`)];
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${u === SITE + "/" ? "1.0" : "0.8"}</priority>\n  </url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);
console.log("✓ sitemap.xml");

// robots.txt
fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *
Allow: /
Disallow: /quiz/

Sitemap: ${SITE}/sitemap.xml
`);
console.log("✓ robots.txt");

// Cache-busting : appose ?v=VERSION sur les assets locaux (css/js) de toutes les pages HTML
const htmlFiles = ["index.html", "quiz/index.html", ...Object.keys(C).map(k => `${k}/index.html`)];
const assetRe = /((?:href|src)=")(\/(?:css|js|script)\/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"/g;
for (const rel of htmlFiles) {
  const fp = path.join(ROOT, rel);
  let html = fs.readFileSync(fp, "utf8");
  html = html.replace(assetRe, (m, pre, url) => `${pre}${url}?v=${VERSION}"`);
  fs.writeFileSync(fp, html);
}
console.log(`✓ cache-busting v=${VERSION} sur ${htmlFiles.length} pages`);
console.log(`Total questions: ${grandTotal}`);
