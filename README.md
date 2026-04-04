# 🧠 Leetcode Like App

![Bannière du projet](https://github.com/CGI-Cellule-Projets/.github/blob/main/assets/leetcode-like-app.jpg?raw=true)

## 💡 Idée du projet
Une plateforme web inspirée de LeetCode, conçue pour héberger et gérer des compétitions de programmation au sein du club. Elle permet aux organisateurs de créer des défis techniques et aux participants de résoudre ces problèmes en temps réel dans un environnement structuré et interactif.

## 🧰 Technologies
- **Frontend (pages statiques)** : HTML, CSS pur (glassmorphism), JavaScript vanilla
- **Éditeur de code** : React 19, Vite 7, Monaco Editor (le moteur de VS Code)
- **Base de données** : PostgreSQL (schéma dans `database/`)

## ⏰ Deadline
**8 Avril 2026**


# 🚀 AlgoForge : le nom est temporaire.

## ⚡ Installation & Lancement

### Prérequis
- [Node.js](https://nodejs.org/) installé sur votre machine (v18 ou plus récent)

### Première fois (après avoir cloné le repo)

**Étape 1** — Ouvrir un terminal à la racine du projet, puis entrer dans le dossier de l'éditeur :
```bash
cd apps/editor
```

**Étape 2** — Télécharger les librairies nécessaires (React, Monaco Editor, etc.) :
```bash
npm install
```
> Ça va créer un dossier `node_modules/` (c'est normal, il est ignoré par git).

**Étape 3** — Compiler l'éditeur pour qu'il soit utilisable dans le site :
```bash
cd ../..
npm run build
```
> Ça va générer l'éditeur dans `apps/web/editor/`.

**Étape 4** — Revenir à la racine et lancer l'application complète :
```bash
npm run dev:full
```

**Étape 5** — Ouvrir `http://localhost:3000` dans le navigateur. C'est tout !

### Important : portée de sécurité de l'exécution
- L'API d'exécution actuelle est prévue pour une **démo locale** sur la machine du développeur.
- Le serveur s'attache par défaut à `127.0.0.1` et l'exécution est limitée aux requêtes locales.
- Cette implémentation **n'est pas un sandbox de production**. Ne pas exposer cette route publiquement tant qu'une vraie isolation (conteneurs/VM/judge dédié) n'est pas ajoutée.

### Les fois suivantes

Si vous n'avez **rien modifié** dans `apps/editor/`, il suffit de :
```bash
npm run serve
```

Si vous avez **modifié le code de l'éditeur** (`apps/editor/src/`), il faut recompiler avant :
```bash
npm run dev:full
```

### Alternative sans terminal
Si vous avez l'extension **Live Server** dans VS Code : clic droit sur `apps/web/index.html` → "Open with Live Server".
Attention : cela fonctionne pour l'affichage statique, mais **pas** pour l'exécution du code. Pour utiliser le bouton **Run**, il faut lancer `npm run dev:full` ou `npm run serve` depuis la racine.

## 📂 Structure du Projet

> Source unique de l'éditeur: `apps/editor/`.

```
LEETCODE-LIKE-APP/
├── apps/
│   ├── web/                         ← Application web statique (site principal)
│   │   ├── index.html               ← Page d'accueil (Hero, roadmap, FAQ)
│   │   ├── problems.html            ← Bibliothèque d'exercices
│   │   ├── profile.html             ← Tableau de bord utilisateur
│   │   ├── parameters.html          ← Paramètres (thème, accent, animations)
│   │   ├── assets/
│   │   │   ├── css/styles.css       ← Système UI global
│   │   │   └── js/script.js         ← Logique front-end
│   │   └── editor/                  ← Build output de l'éditeur React
│   ├── editor/                      ← Code source React de l'éditeur
│   │   ├── src/
│   │   │   ├── App.jsx              ← Composant principal
│   │   │   ├── App.css              ← Styles de l'éditeur
│   │   │   ├── index.css            ← Variables CSS + thème sombre
│   │   │   └── main.jsx             ← Point d'entrée React
│   │   ├── package.json
│   │   └── vite.config.js
│   └── server/                      ← Serveur NodeJS local d'exécution
│       ├── runtime/                 ← Scripts exécuteurs (python, js)
│       └── server.mjs               ← Serveur API & fichiers statiques
├── database/                        ← Schéma BDD PostgreSQL
│   ├── coding_platform_db.sql
│   ├── coding_platform_ea.png
│   └── update_stats.py
├── .gitignore
├── package.json
└── README.md
```

## 🆕 Fonctionnalités récentes

### Éditeur de code intégré
- **Monaco Editor** (le moteur de VS Code) avec support de 2 langages dans cette première version d'exécution : JavaScript et Python
- **Code de démarrage** automatique selon le langage sélectionné
- **Panel problème** : affiche le titre, la difficulté, les tags et l'énoncé complet du problème sélectionné
- **Console de sortie** avec indicateurs de statut (idle, running, success, runtime error, timeout)
- **Exécution réelle** du code via une API locale (`/api/execute`) avec `stdin`, `timeLimit`, `stdout`, `stderr`, `exitCode`, `executionTime`, `memory` et `status`

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
* **`apps/web/assets/css/styles.css`** : Le cœur de notre design ! Tout notre système UI (glassmorphism, cartes, boutons) s'y trouve.
Machi darori tkhdemo bihom kamlin, le plus important howa la fonctionnalité, oula task li mkelfin biha tkon tzadt, tal mbe3d o ngado l'apparence dial kola 7aja jdida tzadt fsite, mhm concentrez vous 3la l'implémentation dial task dialkom.
lte7t kayn explication dial lminimum ila bghito tzido page etc...
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


* **`apps/web/assets/js/script.js`** : Gère la logique front-end (menu mobile, animations au scroll, sauvegarde des préférences dans le localStorage, navigation vers l'éditeur).

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

Le code source de l'éditeur est dans `apps/editor/src/`. Après chaque modification :

```bash
cd apps/editor
npm run build
```

### Le système CSS

Notre CSS est architecturé de manière modulaire à l'intérieur de `apps/web/assets/css/styles.css`.
Il contient de nombreux commentaires explicatifs (notamment les blocs **`UTILISATION :`**) pour t'apprendre à utiliser nos classes.

Les choses principales à retenir :
- **`.panel`** : Pour créer une belle carte avec bordure et effet verre poli.
- **`.btn`, `.btn-primary`, `.btn-ghost`** : Pour tous les boutons.
- **`.reveal`** : Ajoute cette classe à un élément HTML pour qu'il apparaisse en douceur quand l'utilisateur scrolle (géré par `script.js`).

wlk kifma glt likom 9bl, design machi darori, task first.
