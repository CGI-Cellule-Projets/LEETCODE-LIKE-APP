# 🧠 Leetcode Like App

![Bannière du projet](https://github.com/CGI-Cellule-Projets/.github/blob/main/assets/leetcode-like-app.jpg?raw=true)

## 💡 Idée du projet
Une plateforme web inspirée de LeetCode, conçue pour héberger et gérer des compétitions de programmation au sein du club. Elle permet aux organisateurs de créer des défis techniques et aux participants de résoudre ces problèmes en temps réel dans un environnement structuré et interactif.

## 🧰 Technologies
(à définir par les membres de l'équipe) 

## ⏰ Deadline
**8 Avril 2026**


# 🚀 AlgoForge : le nom est temporaire.

Ceci est un projet statique développé en HTML, CSS pur sans framework et Javascript .

## 📂 Structure du Projet

Le projet contient actuellement les éléments suivants :

* **`/index.html`** : La page d'accueil (Hero section, roadmap, FAQ). Hadi hya lfirst page li hadi tban normalement fsite
* **`/problems.html`** : La bibliothèque d'exercices avec recherche et filtres de difficulté fonctionnels.
* **`/profile.html`** : Le tableau de bord utilisateur (statistiques de base, badges et heatmap d'activité).
* **`/parameters.html`** : Page des paramètres pour changer le thème global du site (Mode Nuit, Couleur d'accentuation, etc).

IMPORTANT !!!!!!!!!!!!!!!!
* **`/styles.css`** : Le cœur de notre design ! Tout notre système UI (glassmorphism, cartes, boutons) s'y trouve.
Machi darori tkhdemo bihom kamlin, le plus important howa la fonctionnalité, oula task li mkelfin biha tkon tzadt, tal mbe3d o ngado l'apparence dial kola 7aja jdida tzadt fsite, mhm concentrez vous 3la l'implémentation dial task dialkom.
lte7t kayn explication dial lminimum ila bghito tzido page etc... 
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


* **`/script.js`** : Gère la logique front-end (menu mobile, animations au scroll, sauvegarde des préférences dans le localStorage, fausse heatmap).

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
                <button class="btn btn-primary">Mon Bouton</button>  <!-- btn hya button >
            </article>
        </div>
    </section>
</main>
```

### Le système CSS

Notre CSS est architecturé de manière modulaire à l'intérieur de `styles.css`.
Il contient de nombreux commentaires explicatifs (notamment les blocs **`UTILISATION :`**) pour t'apprendre à utiliser nos classes.

Les choses principales à retenir :
- **`.panel`** : Pour créer une belle carte avec bordure et effet verre poli.
- **`.btn`, `.btn-primary`, `.btn-ghost`** : Pour tous les boutons.
- **`.reveal`** : Ajoute cette classe à un élément HTML pour qu'il apparaisse en douceur quand l'utilisateur scrolle (géré par `script.js`).

wlk kifma glt likom 9bl, design machi darori, task first.

