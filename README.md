# 🧠 Leetcode Like App

![Bannière du projet](https://github.com/CGI-Cellule-Projets/.github/blob/main/assets/leetcode-like-app.jpg?raw=true)

## 💡 Idée du projet
Une plateforme web inspirée de LeetCode, conçue pour héberger et gérer des compétitions de programmation au sein du club. Elle permet aux organisateurs de créer des défis techniques et aux participants de résoudre ces problèmes en temps réel dans un environnement structuré et interactif.

## 🧰 Technologies
- **Frontend (pages statiques)** : HTML, CSS pur (glassmorphism), JavaScript vanilla
- **Éditeur de code** : React 19, Vite 7, Monaco Editor (le moteur de VS Code)
- **Base de données** : PostgreSQL (schéma dans `DataStructure/`)

## ⏰ Deadline
**8 Avril 2026**


# 🚀 AlgoForge : le nom est temporaire.

## ⚡ Installation & Lancement

### Prérequis
- [Node.js](https://nodejs.org/) installé sur votre machine (v18 ou plus récent)
- Un terminal (Git Bash, PowerShell, ou le terminal intégré de VS Code)

### Première fois (après avoir cloné le repo)

**Étape 1** — Ouvrir un terminal à la racine du projet, puis entrer dans le dossier de l'éditeur :
```bash
cd CodeEditorIntegration
```

**Étape 2** — Télécharger les librairies nécessaires (React, Monaco Editor, etc.) :
```bash
npm install
```
> Ça va créer un dossier `node_modules/` (c'est normal, il est ignoré par git).

**Étape 3** — Compiler l'éditeur pour qu'il soit utilisable dans le site :
```bash
npm run build
```
> Ça va créer un dossier `editor/` à la racine du projet.

**Étape 4** — Revenir à la racine et lancer un serveur local :
```bash
cd ..
npx serve . -l 3000
```

**Étape 5** — Ouvrir `http://localhost:3000` dans le navigateur. C'est tout !

### Les fois suivantes

Si vous n'avez **rien modifié** dans `CodeEditorIntegration/`, il suffit de :
```bash
npx serve . -l 3000
```

Si vous avez **modifié le code de l'éditeur** (`CodeEditorIntegration/src/`), il faut recompiler avant :
```bash
cd CodeEditorIntegration
npm run build
cd ..
npx serve . -l 3000
```

### Alternative sans terminal
Si vous avez l'extension **Live Server** dans VS Code : clic droit sur `index.html` → "Open with Live Server". Pas besoin de `npx serve`.

## 📂 Structure du Projet

```
LEETCODE-LIKE-APP/
├── assets/
│   ├── css/
│   │   └── styles.css              ← Système UI global (glassmorphism, cartes, boutons)
│   └── js/
│       └── script.js               ← Logique front-end (menu, animations, localStorage, filtres)
├── CodeEditorIntegration/           ← Code source React de l'éditeur
│   ├── src/
│   │   ├── App.jsx                  ← Composant principal (éditeur Monaco + panel problème)
│   │   ├── App.css                  ← Styles de l'éditeur
│   │   ├── index.css                ← Variables CSS + thème sombre
│   │   └── main.jsx                 ← Point d'entrée React
│   ├── package.json
│   └── vite.config.js
├── DataStructure/                   ← Schéma BDD PostgreSQL
│   ├── coding_platform_db.sql
│   ├── coding_platform_ea.png
│   └── update_stats.py
├── editor/                          ← Build output (généré, gitignored)
├── index.html                       ← Page d'accueil (Hero, roadmap, FAQ)
├── problems.html                    ← Bibliothèque d'exercices (recherche + filtres)
├── profile.html                     ← Tableau de bord utilisateur (stats, badges, heatmap)
├── parameters.html                  ← Paramètres (thème, couleur d'accent, animations)
├── .gitignore
├── package.json
└── README.md
```

## 🆕 Fonctionnalités récentes

### Éditeur de code intégré
- **Monaco Editor** (le moteur de VS Code) avec support de 9 langages : JavaScript, Python, Java, C++, C, C#, TypeScript, Go, Rust
- **Code de démarrage** automatique selon le langage sélectionné
- **Panel problème** : affiche le titre, la difficulté, les tags et l'énoncé complet du problème sélectionné
- **Console de sortie** avec indicateurs de statut (idle, running, success, error)
- **Simulation d'exécution** du code (backend à venir)

### Navigation connectée
- Cliquer sur **"Résoudre"** dans la page problèmes ouvre l'éditeur avec le problème chargé automatiquement
- Navigation retour vers le site depuis l'éditeur (logo AlgoForge + flèche retour)
- Les **paramètres du site** (thème sombre, couleur d'accent, animations) sont synchronisés avec l'éditeur via localStorage

### Thèmes et personnalisation
- **Mode Nuit** : appliqué partout, y compris dans l'éditeur Monaco (bascule `vs-dark` / `light`)
- **3 palettes d'accent** : Sunset (orange), Ocean (bleu), Mint (vert)
- **Désactivation des animations** pour l'accessibilité

## 📝 Pages du site

* **`/index.html`** : La page d'accueil (Hero section, roadmap, FAQ). Hadi hya lfirst page li hadi tban normalement fsite
* **`/problems.html`** : La bibliothèque d'exercices avec recherche et filtres de difficulté fonctionnels. Chaque problème a un bouton "Résoudre" qui ouvre l'éditeur.
* **`/profile.html`** : Le tableau de bord utilisateur (statistiques de base, badges et heatmap d'activité).
* **`/parameters.html`** : Page des paramètres pour changer le thème global du site (Mode Nuit, Couleur d'accentuation, etc).
* **`/editor/`** : L'éditeur de code (React, généré par `npm run build`).

IMPORTANT !!!!!!!!!!!!!!!!
* **`assets/css/styles.css`** : Le cœur de notre design ! Tout notre système UI (glassmorphism, cartes, boutons) s'y trouve.
Machi darori tkhdemo bihom kamlin, le plus important howa la fonctionnalité, oula task li mkelfin biha tkon tzadt, tal mbe3d o ngado l'apparence dial kola 7aja jdida tzadt fsite, mhm concentrez vous 3la l'implémentation dial task dialkom.
lte7t kayn explication dial lminimum ila bghito tzido page etc...
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


* **`assets/js/script.js`** : Gère la logique front-end (menu mobile, animations au scroll, sauvegarde des préférences dans le localStorage, navigation vers l'éditeur).

## 💡 Comment contribuer ?

### Ajouter une nouvelle page

Si tu dois créer une nouvelle page pour la plateforme (exemple : `login.html` ou `leaderboard.html`), tu n'as pas besoin de recréer du CSS à partir de zéro !

1. Copie la structure de base (la `<nav>` en haut et le `<footer>` en bas) depuis une page existante.
2. Pour votre contenu principal, utilise nos éléments réutilisables. Voici un exemple rapide :

```html
<main id="main-content">
    <section class="section">
        <div class="container">
            <!-- Une section avec un titre standard -->
            <div class="section-head">
                <p class="section-subtitle">Exemple de Sous-titre </p>
                <h2>Titre Principal</h2>
            </div>

            <!-- Une carte en glassmorphism -->
            <article class="panel">
                <p>Contenu de ta carte.</p>
                <button class="btn btn-primary">Mon Bouton</button>
            </article>
        </div>
    </section>
</main>
```

### Modifier l'éditeur de code

Le code source de l'éditeur est dans `CodeEditorIntegration/src/`. Après chaque modification :

```bash
cd CodeEditorIntegration
npm run build
```

### Le système CSS

Notre CSS est architecturé de manière modulaire à l'intérieur de `assets/css/styles.css`.
Il contient de nombreux commentaires explicatifs (notamment les blocs **`UTILISATION :`**) pour t'apprendre à utiliser nos classes.

Les choses principales à retenir :
- **`.panel`** : Pour créer une belle carte avec bordure et effet verre poli.
- **`.btn`, `.btn-primary`, `.btn-ghost`** : Pour tous les boutons.
- **`.reveal`** : Ajoute cette classe à un élément HTML pour qu'il apparaisse en douceur quand l'utilisateur scrolle (géré par `script.js`).

wlk kifma glt likom 9bl, design machi darori, task first.
