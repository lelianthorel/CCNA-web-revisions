# CCNA Révisions

Site de révision gratuit pour les certifications Cisco (CCNA 1, CCNA 2, CSNA, CSNE).
Quiz interactifs avec correction immédiate, suivi de progression et rejeu des questions ratées.
Hébergé via GitHub Pages sur https://ccna-revision.fr

## Structure

- `index.html`, `ccna1/`, `ccna2/`, `csna/`, `csne/` — pages générées (voir `build.js`)
- `quiz/` — moteur de quiz (paramètres `?ccna=…&module=…`)
- `data/` — questions au format JSON, un fichier par module
- `css/style.css` — design system (thème clair/sombre, aucune dépendance externe)
- `js/curriculum.js` — source unique des parcours et modules
- `js/icons.js` — icônes SVG partagées (navigateur + build Node)
- `js/app.js` — thème, navigation, progression (localStorage)
- `js/home.js`, `js/course.js` — enrichissement des pages statiques
- `script/quiz.js` — logique du quiz
- `build.js` — génère les pages HTML, `sitemap.xml` et `robots.txt` depuis `js/curriculum.js`

## Régénérer les pages

Après une modification de `js/curriculum.js` ou du contenu :

```bash
node build.js
```

Les pages de contenu sont statiques (crawlables pour le SEO) et enrichies côté client
(progression, recherche). Le JS ne fait qu'ajouter des fonctionnalités par-dessus.
