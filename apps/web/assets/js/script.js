document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const root = document.documentElement;
    const PROGRESS_KEY = "algoforge-progress";
    const USER_INFO_KEY = "user_info";

    document.querySelectorAll(".year").forEach((node) => {
        node.textContent = new Date().getFullYear();
    });

    const readUserInfo = () => {
        try {
            return JSON.parse(localStorage.getItem(USER_INFO_KEY) || "{}");
        } catch (error) {
            return {};
        }
    };

    const isAdminUser = () => {
        const userInfo = readUserInfo();
        if (!userInfo || typeof userInfo !== "object") return false;
        return userInfo.is_admin === true || userInfo.role === "admin" || userInfo.level === "admin";
    };

    const hasAuthSession = () => {
        const token = localStorage.getItem("auth_token")
            || localStorage.getItem("token")
            || localStorage.getItem("adminToken");
        const userInfo = readUserInfo();
        const hasUserInfo = Boolean(userInfo && (userInfo.email || userInfo.username || userInfo.role || userInfo.is_admin));
        return Boolean(token || hasUserInfo);
    };

    const enforceProfileAccess = () => {
        const currentPath = window.location.pathname.toLowerCase();
        const isProfilePage = currentPath.endsWith("/profile.html") || currentPath.endsWith("profile.html");
        if (isProfilePage && !hasAuthSession()) {
            window.location.replace("login.html");
            return false;
        }
        return true;
    };

    if (!enforceProfileAccess()) return;

    const setNodeVisibility = (node, isVisible) => {
        if (!node) return;
        node.hidden = !isVisible;
        if (isVisible) {
            node.removeAttribute("aria-hidden");
            return;
        }
        node.setAttribute("aria-hidden", "true");
    };

    const syncAuthVisibility = () => {
        const isLoggedIn = hasAuthSession();
        document.querySelectorAll(".requires-auth").forEach((node) => setNodeVisibility(node, isLoggedIn));
        document.querySelectorAll(".guest-only").forEach((node) => setNodeVisibility(node, !isLoggedIn));
    };

    const syncAdminLayoutState = () => {
        const shouldUseAdminLayout = hasAuthSession() && isAdminUser();
        body.classList.toggle("is-admin-user", shouldUseAdminLayout);
    };

    const injectAdminShortcuts = () => {
        if (!hasAuthSession() || !isAdminUser()) return;

        const dashboardHref = "../../admin/dashboard.html";
        const navActions = document.querySelector(".nav-actions");
        if (navActions && !document.getElementById("adminDashboardShortcut")) {
            const adminButton = document.createElement("a");
            adminButton.id = "adminDashboardShortcut";
            adminButton.className = "btn btn-ghost";
            adminButton.href = dashboardHref;
            adminButton.textContent = "Espace Admin";
            navActions.appendChild(adminButton);
        }

        const mobileMenu = document.getElementById("mobileMenu");
        if (mobileMenu && !document.getElementById("adminMobileShortcut")) {
            const adminLink = document.createElement("a");
            adminLink.id = "adminMobileShortcut";
            adminLink.className = "mobile-link";
            adminLink.href = dashboardHref;
            adminLink.textContent = "Espace Admin";
            mobileMenu.appendChild(adminLink);
        }
    };

    injectAdminShortcuts();

    const syncHomeAuthButtons = () => {
        const registerButton = document.getElementById("openRegisterModal");
        const loginButton = document.getElementById("homeLoginButton");
        const mobileLoginButton = document.getElementById("homeMobileLoginButton");
        const ctaLoginButton = document.getElementById("homeCtaLoginButton");
        const isLoggedIn = hasAuthSession();

        [registerButton, loginButton, mobileLoginButton, ctaLoginButton].forEach((node) => {
            setNodeVisibility(node, !isLoggedIn);
        });
    };

    syncHomeAuthButtons();
    syncAuthVisibility();
    syncAdminLayoutState();

    const bindUserLogout = () => {
        const logoutButtons = document.querySelectorAll("[data-logout='user']");
        if (!logoutButtons.length) return;

        logoutButtons.forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                localStorage.removeItem("auth_token");
                localStorage.removeItem("token");
                localStorage.removeItem("adminToken");
                localStorage.removeItem("user_info");
                syncHomeAuthButtons();
                syncAuthVisibility();
                syncAdminLayoutState();
                window.location.href = "index.html";
            });
        });
    };

    bindUserLogout();

    const toDateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const createDefaultProgress = () => ({
        attempts: 0,
        solvedCount: 0,
        contestsCompleted: 0,
        totalRuntimePercentile: 0,
        runtimeSamples: 0,
        totalPracticeMinutes: 0,
        activeStreakDays: 0,
        problemOpenCount: 0,
        solvedProblems: {},
        solvedByDifficulty: { easy: 0, medium: 0, hard: 0 },
        solvedByTag: {},
        activityByDate: {}
    });

    const readProgress = () => {
        try {
            const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
            const defaults = createDefaultProgress();
            return {
                ...defaults,
                ...parsed,
                solvedByDifficulty: { ...defaults.solvedByDifficulty, ...(parsed.solvedByDifficulty || {}) },
                solvedByTag: { ...(parsed.solvedByTag || {}) },
                solvedProblems: { ...(parsed.solvedProblems || {}) },
                activityByDate: { ...(parsed.activityByDate || {}) }
            };
        } catch (error) {
            return createDefaultProgress();
        }
    };

    const writeProgress = (progress) => {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    };

    const touchActivity = (progress, dateKey, amount = 1) => {
        const current = Number(progress.activityByDate[dateKey] || 0);
        progress.activityByDate[dateKey] = current + amount;
    };

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
            if (window.innerWidth > 1160) {
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

    const hydrateProfileAnalytics = () => {
        const solvedNode = document.getElementById("statSolved");
        if (!solvedNode) return;

        const progress = readProgress();
        const solved = Number(progress.solvedCount || 0);
        const contests = Number(progress.contestsCompleted || 0);
        const avgRuntime = progress.runtimeSamples > 0
            ? Math.round(progress.totalRuntimePercentile / progress.runtimeSamples)
            : 0;
        const hours = Math.max(0, Math.round((Number(progress.totalPracticeMinutes || 0) / 60) * 10) / 10);
        const streak = Number(progress.activeStreakDays || 0);
        const level = Math.floor(solved / 3);
        const rankEstimate = Math.max(1, 1200 - solved * 17 - contests * 10);
        const topPercent = Math.max(1, Math.round(100 - Math.min(95, solved * 2 + contests * 3)));

        solvedNode.dataset.counter = String(solved);
        const contestsNode = document.getElementById("statContests");
        if (contestsNode) contestsNode.dataset.counter = String(contests);
        const runtimeNode = document.getElementById("statRuntime");
        if (runtimeNode) runtimeNode.dataset.counter = String(avgRuntime);
        const hoursNode = document.getElementById("statHours");
        if (hoursNode) {
            hoursNode.dataset.counter = String(Math.floor(hours));
            hoursNode.textContent = String(hours);
        }

        const rankNode = document.getElementById("profileRank");
        if (rankNode) rankNode.textContent = `#${rankEstimate}`;
        const rankDeltaNode = document.getElementById("profileRankDelta");
        if (rankDeltaNode) {
            const delta = Math.max(0, Math.round((solved + contests) * 0.7));
            rankDeltaNode.textContent = `+${delta} place${delta > 1 ? "s" : ""} cette semaine`;
        }

        const streakTag = document.getElementById("profileStreakTag");
        if (streakTag) streakTag.textContent = `Serie: ${streak} jour${streak > 1 ? "s" : ""}`;
        const levelTag = document.getElementById("profileLevelTag");
        if (levelTag) levelTag.textContent = `Niveau: ${level}`;
        const topTag = document.getElementById("profileTopTag");
        if (topTag) topTag.textContent = `Top ${topPercent}%`;

        const solvedByDifficulty = progress.solvedByDifficulty || {};
        const totalSolved = Math.max(1, solved);
        const goals = [
            {
                labelId: "goalLabelA",
                pctId: "goalPctA",
                barId: "goalBarA",
                label: "Facile",
                value: Math.round((Number(solvedByDifficulty.easy || 0) / totalSolved) * 100)
            },
            {
                labelId: "goalLabelB",
                pctId: "goalPctB",
                barId: "goalBarB",
                label: "Moyen",
                value: Math.round((Number(solvedByDifficulty.medium || 0) / totalSolved) * 100)
            },
            {
                labelId: "goalLabelC",
                pctId: "goalPctC",
                barId: "goalBarC",
                label: "Difficile",
                value: Math.round((Number(solvedByDifficulty.hard || 0) / totalSolved) * 100)
            }
        ];

        goals.forEach((goal) => {
            const labelNode = document.getElementById(goal.labelId);
            if (labelNode) labelNode.textContent = goal.label;
            const pctNode = document.getElementById(goal.pctId);
            if (pctNode) pctNode.textContent = `${goal.value}%`;
            const barNode = document.getElementById(goal.barId);
            if (barNode) barNode.dataset.progress = String(goal.value);
        });

        const binaryCount = Number(progress.solvedByTag["Binary Search"] || 0);
        const contestBadge = document.getElementById("badgeContest");
        const binaryBadge = document.getElementById("badgeBinary");
        const runtimeBadge = document.getElementById("badgeRuntime");
        if (binaryBadge) binaryBadge.textContent = `${binaryCount} probleme${binaryCount > 1 ? "s" : ""} de recherche binaire valide.`;
        if (contestBadge) contestBadge.textContent = `${contests} concours consecutif${contests > 1 ? "s" : ""} termine${contests > 1 ? "s" : ""} dans le top ${topPercent}%.`;
        if (runtimeBadge) runtimeBadge.textContent = `${avgRuntime}% de percentile moyen sur les solutions executees.`;
    };

    hydrateProfileAnalytics();

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
        const progress = readProgress();
        const today = new Date();

        for (let i = 139; i >= 0; i -= 1) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateKey = toDateKey(date);
            const count = Number(progress.activityByDate[dateKey] || 0);

            const cell = document.createElement("span");
            cell.className = "day";
            cell.title = `${dateKey}: ${count} activite${count > 1 ? "s" : ""}`;

            let level = 0;
            if (count >= 1) level = 1;
            if (count >= 2) level = 2;
            if (count >= 4) level = 3;
            if (count >= 6) level = 4;
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

    /*
     * 🔗 --- PROBLEM → CODE EDITOR NAVIGATION ---
     * Stores selected problem data in localStorage and navigates to the code editor.
     */
    const buildEditorUrl = (problemData) => {
        const problemParam = encodeURIComponent(JSON.stringify(problemData));
        return new URL(`editor/indexcodeeditor.html?problem=${problemParam}`, window.location.href).toString();
    };

    const solveButtons = document.querySelectorAll(".solve-btn");
    solveButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const card = btn.closest(".problem-card");
            if (!card) return;

            const problemData = {
                title: card.dataset.title || "",
                difficulty: card.dataset.difficulty || "",
                description: card.dataset.description || "",
                tags: card.dataset.tags || ""
            };

            const progress = readProgress();
            const todayKey = toDateKey(new Date());
            progress.problemOpenCount += 1;
            touchActivity(progress, todayKey);
            writeProgress(progress);

            localStorage.setItem("algoforge-current-problem", JSON.stringify(problemData));
            window.location.href = buildEditorUrl(problemData);
        });
    });

    /*
     * 👤 --- REGISTRATION MODAL LOGIC ---
     * Handles opening, closing, and submitting the registration form.
     */
    const registerModal = document.getElementById("registerModal");
    const openRegisterModalBtn = document.getElementById("openRegisterModal");
    const closeRegisterModalBtn = document.getElementById("closeRegisterModal");
    const registerForm = document.getElementById("registerForm");
    const registerError = document.getElementById("registerError");

    if (registerModal && openRegisterModalBtn && closeRegisterModalBtn && registerForm) {
        
        const openModal = () => {
            registerModal.hidden = false;
            body.classList.add("no-scroll");
            registerError.hidden = true;
            registerForm.reset();
        };

        const closeModal = () => {
            registerModal.hidden = true;
            body.classList.remove("no-scroll");
        };

        openRegisterModalBtn.addEventListener("click", openModal);
        closeRegisterModalBtn.addEventListener("click", closeModal);

        // Close on overlay click
        registerModal.addEventListener("click", (e) => {
            if (e.target === registerModal) closeModal();
        });

        // Close on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !registerModal.hidden) {
                closeModal();
            }
        });

        // Toggle password visibility
        const toggleButtons = document.querySelectorAll(".toggle-password");
        toggleButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                const iconEye = btn.querySelector(".eye-icon");
                const iconEyeOff = btn.querySelector(".eye-off-icon");
                if (input) {
                    if (input.type === "password") {
                        input.type = "text";
                        if (iconEye) iconEye.style.display = "none";
                        if (iconEyeOff) iconEyeOff.style.display = "block";
                    } else {
                        input.type = "password";
                        if (iconEye) iconEye.style.display = "block";
                        if (iconEyeOff) iconEyeOff.style.display = "none";
                    }
                }
            });
        });

        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const username = document.getElementById("regUsername").value;
            const email = document.getElementById("regEmail").value;
            const password = document.getElementById("regPassword").value;
            const confirmPassword = document.getElementById("regConfirmPassword").value;
            
            if (password !== confirmPassword) {
                registerError.textContent = "Les mots de passe ne correspondent pas.";
                registerError.hidden = false;
                return;
            }
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Inscription...";
            submitBtn.disabled = true;
            registerError.hidden = true;

            try {
                // apiRegister is defined in api.js
                const result = await apiRegister(username, email, password);
                
                if (result.success) {
                    // Save token and user details optionally
                    if (result.data && result.data.token) {
                        localStorage.setItem('auth_token', result.data.token);
                        localStorage.setItem('token', result.data.token);
                        localStorage.setItem('user_info', JSON.stringify(result.data.user));
                    }
                    
                    closeModal();
                    
                    // Show success visually (using an alert or toast, here just an alert for simplicity)
                    alert("Inscription reussie ! Bienvenue " + username + ".");
                    
                    // Redirect to problems or reload
                    window.location.href = "problems.html";
                } else {
                    registerError.textContent = result.message || "Une erreur est survenue lors de l'inscription.";
                    if (result.errors) {
                        registerError.textContent += " " + (typeof result.errors === 'string' ? result.errors : JSON.stringify(result.errors));
                    }
                    registerError.hidden = false;
                }
            } catch (err) {
                registerError.textContent = "Erreur de connexion au serveur.";
                registerError.hidden = false;
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

});
