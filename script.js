document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const root = document.documentElement;

    document.querySelectorAll(".year").forEach((node) => {
        node.textContent = new Date().getFullYear();
    });

    /* 
     * 📱 --- MOBILE MENU LOGIC ---
     * Gère l'ouverture et la fermeture de la navigation sur petits écrans.
     * Emprisonne le focus à l'intérieur du menu pour respecter les normes d'accessibilité .
     */
    const menuToggle = document.querySelector(".menu-toggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const backdrop = document.getElementById("menuBackdrop");
    if (menuToggle && mobileMenu) {
        const closeMenu = () => {
            menuToggle.classList.remove("open");
            mobileMenu.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            body.classList.remove("no-scroll");
            if (backdrop) backdrop.classList.remove("active");
        };

        menuToggle.addEventListener("click", () => {
            const isOpen = mobileMenu.classList.toggle("open");
            menuToggle.classList.toggle("open", isOpen);
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            body.classList.toggle("no-scroll", isOpen);
            if (backdrop) backdrop.classList.toggle("active", isOpen);
        });

        mobileMenu.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        if (backdrop) {
            backdrop.addEventListener("click", closeMenu);
        }

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
                closeMenu();
                menuToggle.focus();
            }
        });

        mobileMenu.addEventListener("keydown", (e) => {
            if (e.key !== "Tab") return;
            const focusable = [menuToggle, ...mobileMenu.querySelectorAll("a, button")];
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 1020) {
                closeMenu();
            }
        });
    }

    /* 
     * 🪄 --- TOPBAR SCROLL EFFECT ---
     * Ajoute une ombre sous la barre de navigation lorsque l'utilisateur scrolle vers le bas.
     */
    const topbar = document.querySelector(".topbar");
    if (topbar) {
        let lastScrolled = false;
        window.addEventListener("scroll", () => {
            const scrolled = window.scrollY > 10;
            if (scrolled !== lastScrolled) {
                topbar.classList.toggle("scrolled", scrolled);
                lastScrolled = scrolled;
            }
        }, { passive: true });
    }

    /* 
     * 🎬 --- SCROLL REVEAL ANIMATIONS ---
     * UTILISATION : Ajoutez la classe "reveal" à n'importe quel élément HTML. 
     * Il apparaîtra progressivement avec une translation vers le haut lors du scroll.
     */
    const revealItems = document.querySelectorAll(".reveal");
    if (revealItems.length) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const parent = entry.target.parentElement;
                        const siblings = parent.querySelectorAll(":scope > .reveal");
                        const index = Array.from(siblings).indexOf(entry.target);
                        entry.target.style.transitionDelay = `${index * 0.1}s`;
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.16 }
        );
        revealItems.forEach((item) => revealObserver.observe(item));
    }

    /* 
     * 🔢 --- ANIMATED NUMBER COUNTERS ---
     * UTILISATION : Ajoutez data-counter="1000" à un élément pour animer le nombre de 0 à 1000.
     * Optionnel : Ajoutez data-suffix="+" pour afficher un suffixe à la fin.
     * Exemple : <p data-counter="94" data-suffix="%">0%</p>
     */
    const counters = document.querySelectorAll("[data-counter]");
    if (counters.length) {
        const animateCounter = (node) => {
            const target = Number(node.dataset.counter || 0);
            const suffix = node.dataset.suffix || "";
            const duration = 1300;
            let startTime = null;

            const update = (now) => {
                if (!startTime) startTime = now;
                const progress = Math.min((now - startTime) / duration, 1);
                const value = Math.floor(progress * target);
                const text = target >= 1000 ? value.toLocaleString() : String(value);
                node.textContent = `${text}${suffix}`;
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    node.textContent = `${target >= 1000 ? target.toLocaleString() : target}${suffix}`;
                }
            };

            requestAnimationFrame(update);
        };

        const counterObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.35 }
        );

        counters.forEach((counter) => counterObserver.observe(counter));
    }

    /* 
     * 📊 --- PROGRESS BARS ---
     * UTILISATION : Ajoutez data-progress="80" à une barre pour animer sa largeur jusqu'à 80%.
     */
    const progressBars = document.querySelectorAll("[data-progress]");
    if (progressBars.length) {
        const progressObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const value = entry.target.dataset.progress || "0";
                        entry.target.style.width = `${value}%`;
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );

        progressBars.forEach((bar) => progressObserver.observe(bar));
    }

    /* 
     * 🔄 --- ROTATING HERO TEXT ---
     * Fait défiler une liste de mots de manière séquentielle dans le titre principal.
     * UTILISATION : <span data-rotating-words="mot1,mot2,mot3">mot1</span>
     */
    const rotator = document.querySelector("[data-rotating-words]");
    if (rotator) {
        const words = (rotator.dataset.rotatingWords || "")
            .split(",")
            .map((word) => word.trim())
            .filter(Boolean);
        if (words.length > 1) {
            let idx = 0;
            let isAnimating = false;

            const swapWord = () => {
                if (isAnimating) return;
                isAnimating = true;
                rotator.classList.remove("word-swap-in");
                rotator.classList.add("word-swap-out");

                setTimeout(() => {
                    idx = (idx + 1) % words.length;
                    rotator.textContent = words[idx];
                    rotator.classList.remove("word-swap-out");
                    rotator.classList.add("word-swap-in");
                }, 220);

                setTimeout(() => {
                    rotator.classList.remove("word-swap-in");
                    isAnimating = false;
                }, 820);
            };

            setInterval(swapWord, 2800);
        }
    }

    /* 
     * 🕹️ --- 3D HERO CARD HOVER ---
     * Suit le mouvement de la souris sur la carte d'accueil pour mettre à jour
     * les coordonnées X/Y et créer un effet d'inclinaison 3D.
     */
    const heroVisual = document.querySelector(".hero-visual");
    if (heroVisual && !body.classList.contains("motion-off")) {
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        let frameId = null;

        const renderHeroMotion = () => {
            currentX += (targetX - currentX) * 0.12;
            currentY += (targetY - currentY) * 0.12;

            heroVisual.style.setProperty("--pointer-rot-x", `${(-currentY * 6.5).toFixed(3)}deg`);
            heroVisual.style.setProperty("--pointer-rot-y", `${(currentX * 9).toFixed(3)}deg`);
            heroVisual.style.setProperty("--sheen-x", `${(-65 + currentX * 22).toFixed(2)}%`);

            const stillMoving = Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002;
            if (stillMoving) {
                frameId = requestAnimationFrame(renderHeroMotion);
            } else {
                frameId = null;
            }
        };

        const queueFrame = () => {
            if (!frameId) {
                frameId = requestAnimationFrame(renderHeroMotion);
            }
        };

        heroVisual.addEventListener("pointerenter", () => {
            heroVisual.classList.add("is-hovering");
        });

        heroVisual.addEventListener("pointermove", (event) => {
            const rect = heroVisual.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;

            targetX = Math.max(-0.5, Math.min(0.5, x - 0.5));
            targetY = Math.max(-0.5, Math.min(0.5, y - 0.5));
            queueFrame();
        });

        const resetHeroMotion = () => {
            targetX = 0;
            targetY = 0;
            heroVisual.classList.remove("is-hovering");
            queueFrame();
        };

        heroVisual.addEventListener("pointerleave", resetHeroMotion);
        heroVisual.addEventListener("pointercancel", resetHeroMotion);
    }


    /* 
     * 🟩 --- GITHUB-STYLE HEATMAP (PROFILE PAGE) ---
     * Génère une grille d'activité factice pour la page de profil.
     */
    const streakGrid = document.getElementById("streakGrid");
    if (streakGrid) {
        for (let i = 0; i < 140; i += 1) {
            const cell = document.createElement("span");
            cell.className = "day";
            const seed = (i * 37 + 19) % 100;
            let level = 0;
            if (seed > 34) level = 1;
            if (seed > 58) level = 2;
            if (seed > 74) level = 3;
            if (seed > 90) level = 4;
            cell.classList.add(`level-${level}`);
            streakGrid.appendChild(cell);
        }
    }

    /* 
     * ⚙️ --- APP THEME & SETTINGS (PARAMETERS PAGE) ---
     * Gère la sauvegarde des préférences utilisateur dans le localStorage 
     * (Mode sombre, Couleur d'accent, Animations) et leur application globale.
     */
    const SETTINGS_KEY = "algoforge-settings";
    const defaultSettings = {
        accent: "sunset",
        theme: "light",
        motion: true
    };

    const accentPalette = {
        sunset: { accent: "#ff6b3d", accent2: "#ff9f1c", soft: "rgba(255, 107, 61, 0.18)" },
        ocean: { accent: "#1f7fff", accent2: "#00b4d8", soft: "rgba(31, 127, 255, 0.2)" },
        mint: { accent: "#14b884", accent2: "#9ad84b", soft: "rgba(20, 184, 132, 0.2)" }
    };

    const readSettings = () => {
        try {
            const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
            return { ...defaultSettings, ...parsed };
        } catch (error) {
            return { ...defaultSettings };
        }
    };

    const applyAccent = (accentName) => {
        const palette = accentPalette[accentName] || accentPalette.sunset;
        root.style.setProperty("--accent", palette.accent);
        root.style.setProperty("--accent-2", palette.accent2);
        root.style.setProperty("--accent-soft", palette.soft);
        document.querySelectorAll(".accent-swatch").forEach((swatch) => {
            swatch.classList.toggle("active", swatch.dataset.accent === accentName);
        });
    };

    const applyTheme = (themeName) => {
        body.classList.toggle("theme-night", themeName === "night");
    };

    const applyMotion = (motionEnabled) => {
        body.classList.toggle("motion-off", !motionEnabled);
    };

    let currentSettings = readSettings();
    applyAccent(currentSettings.accent);
    applyTheme(currentSettings.theme);
    applyMotion(currentSettings.motion);

    const swatches = document.querySelectorAll(".accent-swatch");
    swatches.forEach((swatch) => {
        swatch.addEventListener("click", () => {
            const accentName = swatch.dataset.accent;
            currentSettings.accent = accentName;
            applyAccent(accentName);
        });
    });

    const settingsForm = document.getElementById("settingsForm");
    if (settingsForm) {
        const themeSelect = document.getElementById("themeSelect");
        const motionToggle = document.getElementById("motionToggle");
        const sessionRange = document.getElementById("sessionRange");
        const sessionOut = document.getElementById("sessionOut");
        const saveStatus = document.getElementById("saveStatus");

        if (themeSelect) themeSelect.value = currentSettings.theme;
        if (motionToggle) motionToggle.checked = currentSettings.motion;
        if (sessionRange && sessionOut) {
            sessionOut.textContent = `${sessionRange.value} min`;
            sessionRange.addEventListener("input", () => {
                sessionOut.textContent = `${sessionRange.value} min`;
            });
        }

        themeSelect?.addEventListener("change", () => {
            currentSettings.theme = themeSelect.value;
            applyTheme(currentSettings.theme);
        });

        motionToggle?.addEventListener("change", () => {
            currentSettings.motion = motionToggle.checked;
            applyMotion(currentSettings.motion);
        });

        settingsForm.addEventListener("submit", (event) => {
            event.preventDefault();
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
            if (saveStatus) {
                saveStatus.textContent = "Parametres enregistres.";
                setTimeout(() => {
                    saveStatus.textContent = "";
                }, 1800);
            }
        });
    }

    /* 
     * 🔍 --- PROBLEM SEARCH & FILTERING (PROBLEMS PAGE) ---
     * Filtre les cartes d'exercices en temps réel via la recherche textuelle 
     * ou les boutons de difficulté.
     */
    const searchInput = document.getElementById("problemSearch");
    const filterChips = document.querySelectorAll(".filter-chip");
    const problemCards = document.querySelectorAll(".problem-card");
    const noResults = document.getElementById("noResults");
    const cardCount = document.getElementById("cardCount");
    if (problemCards.length) {
        let activeFilter = "all";

        const applyFilters = () => {
            const query = (searchInput?.value || "").trim().toLowerCase();
            let visibleCount = 0;
            problemCards.forEach((card) => {
                const difficulty = card.dataset.difficulty || "";
                const title = card.dataset.title || "";
                const haystack = `${title} ${card.textContent}`.toLowerCase();
                const diffMatch = activeFilter === "all" || difficulty === activeFilter;
                const queryMatch = query.length === 0 || haystack.includes(query);
                const isVisible = diffMatch && queryMatch;
                card.hidden = !isVisible;
                if (isVisible) visibleCount++;
            });
            if (noResults) noResults.hidden = visibleCount > 0;
            if (cardCount) cardCount.textContent = `${visibleCount} probleme${visibleCount !== 1 ? "s" : ""} trouve${visibleCount !== 1 ? "s" : ""}`;
        };

        filterChips.forEach((chip) => {
            chip.addEventListener("click", () => {
                activeFilter = chip.dataset.filter || "all";
                filterChips.forEach((item) => {
                    item.classList.remove("active");
                    item.setAttribute("aria-pressed", "false");
                });
                chip.classList.add("active");
                chip.setAttribute("aria-pressed", "true");
                applyFilters();
            });
        });

        searchInput?.addEventListener("input", applyFilters);
        applyFilters();
    }
});
