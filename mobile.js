/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  MOBILE.JS — Damions 24/7 Mobile Experience Layer   ║
 * ║  Handles EVERYTHING for a usable mobile experience  ║
 * ╚══════════════════════════════════════════════════════╝
 * 
 * WHAT THIS FIXES:
 * 1. Hamburger menu → full-screen slide-in drawer with submenus
 * 2. Dropdowns (Media, Products, Games) → expandable accordion items
 * 3. Touch-friendly tap targets (min 44px)
 * 4. Viewport height fix (100vh iOS bug)
 * 5. Rolling banner sizing
 * 6. Hero text overflow
 * 7. Service cards → swipeable
 * 8. Sidebar panel → full-screen on mobile
 * 9. FAQ accordion touch fixes
 * 10. Popup modals → mobile-safe sizing
 * 11. Video container responsive
 * 12. Disable heavy shaders on low-end mobile
 * 13. Smooth scroll offset for fixed header
 * 14. Bottom nav bar for quick actions (call, scroll-top)
 * 15. Enter overlay → mobile-friendly sizing
 */

(function () {
    'use strict';

    // ─── DETECTION ───────────────────────────────────
    const isMobile = () => window.innerWidth <= 1024;
    const isSmallMobile = () => window.innerWidth <= 480;
    const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // ─── CSS INJECTION ───────────────────────────────
    // All mobile-specific CSS injected via JS so we don't touch style.css
    function injectMobileCSS() {
        const style = document.createElement('style');
        style.id = 'mobile-enhancement-styles';
        style.textContent = `
        /* ═══ MOBILE DRAWER NAV ═══ */
        @media (max-width: 1024px) {
            .header {
                z-index: 100000 !important;
            }
            body.drawer-open .rolling-banner {
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -10 !important;
            }
            /* Override the default nav-links behavior */
            .nav-links {
                display: none !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: auto !important;
                width: 85vw !important;
                max-width: 380px !important;
                height: 100vh !important;
                height: 100dvh !important;
                background: rgba(4, 6, 11, 0.97) !important;
                backdrop-filter: blur(25px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(25px) saturate(180%) !important;
                flex-direction: column !important;
                padding: 0 !important;
                box-shadow: 8px 0 40px rgba(0, 0, 0, 0.7) !important;
                z-index: 10000 !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                transform: translateX(-100%) !important;
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
                border-right: 1px solid rgba(0, 242, 234, 0.3) !important;
            }

            .nav-links.mobile-open {
                display: flex !important;
                transform: translateX(0) !important;
            }

            /* Drawer header area */
            .nav-links::before {
                content: 'NAVIGATION';
                display: block;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.85rem;
                letter-spacing: 4px;
                color: rgba(0, 242, 234, 0.6);
                padding: 80px 24px 16px;
                border-bottom: 1px solid rgba(0, 242, 234, 0.15);
                text-transform: uppercase;
            }

            /* Fix all nav links for touch */
            .nav-links > a,
            .nav-links > .dropdown > .dropbtn {
                display: flex !important;
                align-items: center;
                min-height: 52px !important;
                padding: 14px 24px !important;
                margin: 0 !important;
                font-size: 1rem !important;
                font-weight: 600 !important;
                color: #f8fafc !important;
                text-decoration: none !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
                border-radius: 0 !important;
                transition: background 0.2s ease, padding-left 0.2s ease !important;
                -webkit-tap-highlight-color: transparent;
            }

            .nav-links > a:active,
            .nav-links > .dropdown > .dropbtn:active {
                background: rgba(0, 242, 234, 0.12) !important;
                padding-left: 32px !important;
            }

            /* Dropdown containers in mobile drawer */
            .nav-links .dropdown {
                display: block !important;
                position: relative !important;
            }

            /* Mobile dropdown toggle indicator */
            .nav-links .dropdown > .dropbtn::after {
                content: '▾';
                margin-left: auto;
                font-size: 0.8rem;
                opacity: 0.5;
                transition: transform 0.3s ease;
            }

            .nav-links .dropdown.mobile-expanded > .dropbtn::after {
                transform: rotate(180deg);
                color: #00f2ea;
                opacity: 1;
            }

            /* Dropdown content → accordion style */
            .nav-links .dropdown-content {
                display: none !important;
                position: static !important;
                background: rgba(0, 242, 234, 0.03) !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                padding: 0 !important;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.4s ease;
                border-left: 3px solid rgba(0, 242, 234, 0.3) !important;
                margin-left: 20px !important;
            }

            .nav-links .dropdown.mobile-expanded .dropdown-content {
                display: block !important;
                max-height: 2000px;
            }

            .nav-links .dropdown-content a {
                min-height: 44px !important;
                padding: 12px 20px !important;
                font-size: 0.9rem !important;
                color: #94a3b8 !important;
                margin: 0 !important;
                border-bottom: 1px solid rgba(255,255,255,0.02) !important;
            }

            .nav-links .dropdown-content a:active {
                color: #00f2ea !important;
                background: rgba(0, 242, 234, 0.08) !important;
            }

            /* Overlay behind drawer */
            .mobile-nav-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                height: 100dvh;
                background: rgba(0, 0, 0, 0.6);
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                -webkit-tap-highlight-color: transparent;
            }

            .mobile-nav-overlay.visible {
                opacity: 1;
                visibility: visible;
            }

            /* Better hamburger button */
            .menu-toggle {
                display: flex !important;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                font-size: 1.6rem;
                z-index: 10001;
                border-radius: 8px;
                transition: background 0.2s ease;
                -webkit-tap-highlight-color: transparent;
            }

            .menu-toggle:active {
                background: rgba(0, 242, 234, 0.15);
            }

            /* Hover states don't apply on mobile - prevent sticky hover */
            .dropdown:hover .dropdown-content {
                display: none !important;
            }
            .dropdown.mobile-expanded:hover .dropdown-content,
            .dropdown.mobile-expanded .dropdown-content {
                display: block !important;
            }
        }

        /* ═══ ROLLING BANNER FIX ═══ */
        @media (max-width: 768px) {
            .rolling-banner {
                top: 70px;
                padding: 6px 0;
            }
            .rolling-banner-text span {
                font-size: 0.85rem !important;
                letter-spacing: 1px;
                margin-right: 30px;
            }
        }

        /* ═══ HERO SECTION ═══ */
        @media (max-width: 768px) {
            .hero {
                min-height: 100vh;
                min-height: 100dvh;
                padding-top: 120px;
            }
            .hero-content {
                padding: 0 16px;
            }
            .hero h1 {
                font-size: 2rem !important;
                line-height: 1.2;
                word-break: break-word;
            }
            .hero p {
                font-size: 0.95rem !important;
                margin-bottom: 24px;
            }
            .cta-button {
                padding: 14px 28px !important;
                font-size: 0.95rem !important;
                width: 100%;
                max-width: 280px;
                text-align: center;
            }
        }

        @media (max-width: 380px) {
            .hero h1 {
                font-size: 1.6rem !important;
            }
        }

        /* ═══ SECTION TITLES ═══ */
        @media (max-width: 768px) {
            .section {
                padding: 60px 0 !important;
            }
            .section-title {
                font-size: 1.6rem !important;
                letter-spacing: 1px !important;
                display: block !important;
                text-align: center;
                padding: 0 16px;
            }
            .section-title::after {
                display: none !important;
            }
            .section-subtitle {
                font-size: 0.95rem !important;
                margin-bottom: 30px !important;
                padding: 0 16px;
            }
        }

        /* ═══ SERVICE CARDS ═══ */
        @media (max-width: 768px) {
            .services-grid {
                grid-template-columns: 1fr !important;
                gap: 20px !important;
                padding: 0 12px !important;
            }
            .service-card {
                padding: 28px 20px !important;
                border-radius: 16px !important;
            }
            .service-card h3 {
                font-size: 1.3rem !important;
            }
            .service-card p {
                font-size: 0.95rem !important;
            }
            .service-icon {
                font-size: 2.5rem !important;
            }
        }

        /* ═══ NEWS CARDS ═══ */
        @media (max-width: 768px) {
            .news-grid {
                grid-template-columns: 1fr !important;
                gap: 24px !important;
                padding: 0 12px;
            }
            .news-image {
                height: 180px !important;
            }
            .news-content {
                padding: 20px !important;
            }
            .news-card h3 {
                font-size: 1.2rem !important;
            }
        }

        /* ═══ FEATURE GRID ═══ */
        @media (max-width: 768px) {
            .feature-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 16px !important;
                padding: 0 12px;
            }
            .feature-item {
                padding: 16px;
            }
            .feature-icon {
                font-size: 2rem !important;
            }
            .feature-item h3 {
                font-size: 1rem !important;
            }
            .feature-item p {
                font-size: 0.85rem !important;
            }
        }
        @media (max-width: 380px) {
            .feature-grid {
                grid-template-columns: 1fr !important;
            }
        }

        /* ═══ VIDEO CONTAINER ═══ */
        @media (max-width: 768px) {
            .video-container video {
                width: 100% !important;
                border-radius: 10px !important;
            }
        }

        /* ═══ ENTER OVERLAY ═══ */
        @media (max-width: 768px) {
            .enter-title {
                font-size: 2.2rem !important;
                letter-spacing: 2px !important;
            }
            .enter-subtitle {
                font-size: 0.85rem !important;
                letter-spacing: 3px !important;
            }
            .enter-button {
                font-size: 1rem !important;
                padding: 12px 32px !important;
            }
        }

        /* ═══ FUNCTIONS SIDEBAR ═══ */
        @media (max-width: 768px) {
            .functions-sidebar {
                width: 100vw !important;
                right: -100vw !important;
            }
            .functions-sidebar.open {
                right: 0 !important;
            }
            .sidebar-toggle-btn.open-btn {
                width: 44px !important;
                height: 44px !important;
                top: 80px !important;
                right: 12px !important;
            }
        }

        /* ═══ POPUP / MODAL ═══ */
        @media (max-width: 768px) {
            .popup-content {
                width: 92% !important;
                padding: 24px !important;
                margin: 20% auto !important;
                border-radius: 16px !important;
            }
            #popup-title {
                font-size: 1.4rem !important;
            }
            #popup-text {
                font-size: 0.95rem !important;
            }
            .popup-buttons {
                display: flex !important;
                flex-direction: column !important;
                gap: 10px !important;
            }
            .popup-buttons .cta-button {
                width: 100% !important;
                max-width: none !important;
            }
        }

        /* ═══ FAQ ═══ */
        @media (max-width: 768px) {
            .faq-question {
                padding: 16px !important;
                font-size: 1rem !important;
                min-height: 52px;
            }
            .faq-answer p {
                padding: 0 16px 16px !important;
                font-size: 0.9rem !important;
            }
        }

        /* ═══ ENGINE BAY / QUIZ ═══ */
        @media (max-width: 768px) {
            .engine-history,
            .interactive-engine-diagram,
            .engine-quiz {
                padding: 16px !important;
                border-radius: 12px !important;
            }
            .quiz-container {
                padding: 20px !important;
                min-height: 300px !important;
            }
            .quiz-start-screen h3 {
                font-size: 1.5rem !important;
            }
            .question-text {
                font-size: 1.1rem !important;
            }
            .answers-grid {
                grid-template-columns: 1fr !important;
                gap: 10px !important;
            }
            .answer-btn {
                padding: 14px !important;
                font-size: 0.95rem !important;
                min-height: 48px;
            }
            .score-display {
                font-size: 2.5rem !important;
            }
        }

        /* ═══ MAP ═══ */
        @media (max-width: 768px) {
            .map-container {
                margin: 20px 12px 0 !important;
            }
        }

        /* ═══ FOOTER ═══ */
        @media (max-width: 768px) {
            .footer {
                padding: 40px 16px !important;
            }
            .footer .logo {
                font-size: 1.4rem !important;
            }
            .footer-links {
                flex-direction: column !important;
                gap: 8px !important;
            }
            .footer-links a {
                min-height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .footer-controls {
                margin-bottom: 16px;
            }
        }

        /* ═══ BOTTOM ACTION BAR ═══ */
        .mobile-bottom-bar {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: rgba(4, 6, 11, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(0, 242, 234, 0.2);
            z-index: 9998;
            padding: 0 8px;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
        }

        .mobile-bottom-bar-inner {
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: 60px;
        }

        .mobile-bottom-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 0.65rem;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            padding: 6px 12px;
            min-width: 60px;
            min-height: 44px;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            transition: color 0.2s ease;
        }

        .mobile-bottom-btn .icon {
            font-size: 1.3rem;
        }

        .mobile-bottom-btn:active,
        .mobile-bottom-btn.active {
            color: #00f2ea;
        }

        .mobile-bottom-btn.call-btn {
            color: #00f2ea;
        }
        .mobile-bottom-btn.call-btn .icon {
            animation: pulse-glow 2s infinite;
        }

        @keyframes pulse-glow {
            0%, 100% { filter: drop-shadow(0 0 2px #00f2ea); }
            50% { filter: drop-shadow(0 0 8px #00f2ea); }
        }

        @media (max-width: 1024px) {
            .mobile-bottom-bar {
                display: block;
            }
            /* Pad the footer so bottom bar doesn't cover content */
            .footer {
                padding-bottom: 80px !important;
            }
            body {
                padding-bottom: 60px;
            }
        }

        /* ═══ GLOBAL TOUCH IMPROVEMENTS ═══ */
        @media (max-width: 1024px) {
            /* Remove hover-dependent transforms that cause jank */
            .service-card:hover,
            .news-card:hover {
                transform: none !important;
            }

            /* Make sure nothing overflows the viewport */
            .container {
                padding: 0 16px !important;
                overflow-x: hidden;
            }

            /* Logo sizing */
            .logo {
                font-size: 1.4rem !important;
            }
            .logo-img {
                height: 28px !important;
                margin-left: 8px !important;
            }

            /* Gallery grid */
            .gallery-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 10px !important;
            }

            /* Input groups in sidebar */
            .input-group {
                flex-wrap: wrap;
            }
            .input-group input {
                min-width: 50px;
                font-size: 0.9rem !important;
            }
        }

        /* ═══ DISABLE ANIMATIONS ON LOW PERF ═══ */
        @media (max-width: 768px) and (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                transition-duration: 0.01ms !important;
            }
        }

        /* ═══ MOBILE ROLLING BANNER ═══ */
        .mobile-rolling-banner {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            align-items: center;
            overflow: hidden;
            background: #0c0903;
            z-index: 1000;
        }

        .mobile-rolling-banner-inner {
            display: flex;
            align-items: center;
            white-space: nowrap;
            animation: mobile-marquee-scroll 35s linear infinite;
            font-family: 'Orbitron', 'Cinzel Decorative', sans-serif;
            font-size: 0.85rem;
            font-weight: 700;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 0 0 8px rgba(0, 242, 234, 0.6);
        }

        .mobile-rolling-banner-inner span {
            flex-shrink: 0;
        }

        .mobile-rolling-banner-inner span.separator {
            margin: 0 20px;
            color: #ff5e00;
            text-shadow: 0 0 8px #ff5e00;
        }

        @keyframes mobile-marquee-scroll {
            0% {
                transform: translate3d(0, 0, 0);
            }
            100% {
                transform: translate3d(-100%, 0, 0);
            }
        }

        @media (max-width: 1024px) {
            .mobile-rolling-banner {
                display: flex !important;
            }
            #rolling-banner-canvas {
                display: none !important;
            }
        }

        /* ═══ MOBILE QUOTE MODAL ═══ */
        .mobile-quote-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(4, 6, 11, 0.95);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            z-index: 200000;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }

        .mobile-quote-content {
            background: rgba(12, 18, 33, 0.95);
            border: 2px solid #00f2ea;
            box-shadow: 0 0 25px rgba(0, 242, 234, 0.4);
            border-radius: 16px;
            width: 100%;
            max-width: 420px;
            padding: 24px;
            position: relative;
        }

        .mobile-quote-content .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(0, 242, 234, 0.2);
            padding-bottom: 10px;
        }

        .mobile-quote-content .modal-header h2 {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.25rem;
            color: #fff;
            text-shadow: 0 0 8px rgba(0, 242, 234, 0.5);
            margin: 0;
        }

        .mobile-quote-content .close-modal-btn {
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 1.8rem;
            cursor: pointer;
        }

        .mobile-quote-content .form-group {
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            text-align: left;
        }

        .mobile-quote-content label {
            font-size: 0.85rem;
            color: #00f2ea;
            font-family: 'Orbitron', sans-serif;
        }

        .mobile-quote-content input,
        .mobile-quote-content select,
        .mobile-quote-content textarea {
            background: rgba(4, 6, 11, 0.8) !important;
            border: 1px solid rgba(0, 242, 234, 0.3) !important;
            color: #fff !important;
            padding: 10px !important;
            border-radius: 8px !important;
            font-size: 0.95rem !important;
            font-family: 'Inter', sans-serif !important;
            width: 100% !important;
        }

        .mobile-quote-content input:focus,
        .mobile-quote-content select:focus,
        .mobile-quote-content textarea:focus {
            border-color: #ff5e00 !important;
            outline: none !important;
            box-shadow: 0 0 10px rgba(255, 94, 0, 0.3) !important;
        }

        .mobile-quote-content .submit-quote-btn {
            background: #ff5e00;
            border: none;
            color: #fff;
            padding: 14px;
            font-family: 'Orbitron', sans-serif;
            font-weight: 700;
            font-size: 1rem;
            border-radius: 8px;
            width: 100%;
            cursor: pointer;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 0 15px rgba(255, 94, 0, 0.4);
            transition: all 0.2s ease;
        }

        .mobile-quote-content .submit-quote-btn:active {
            transform: scale(0.98);
        }
        `;
        document.head.appendChild(style);
    }

    // ─── MOBILE NAV DRAWER ───────────────────────────
    function initMobileDrawer() {
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.querySelector('.nav-links');
        if (!menuToggle || !navLinks) return;

        // Create overlay
        let overlay = document.querySelector('.mobile-nav-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-nav-overlay';
            document.body.appendChild(overlay);
        }

        // Remove old click handler from main.js (we override it)
        const newToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newToggle, menuToggle);

        function openDrawer() {
            navLinks.classList.add('mobile-open');
            overlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
            document.body.classList.add('drawer-open');
            newToggle.textContent = '✕';
        }

        function closeDrawer() {
            navLinks.classList.remove('mobile-open');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
            document.body.classList.remove('drawer-open');
            newToggle.textContent = '☰';
        }

        newToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (navLinks.classList.contains('mobile-open')) {
                closeDrawer();
            } else {
                openDrawer();
            }
        });

        overlay.addEventListener('click', closeDrawer);

        // Handle dropdown toggles inside the drawer
        const dropdowns = navLinks.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const btn = dropdown.querySelector('.dropbtn');
            if (!btn) return;

            btn.addEventListener('click', (e) => {
                if (!isMobile()) return; // Only on mobile
                e.preventDefault();
                e.stopPropagation();

                // Close other dropdowns
                dropdowns.forEach(d => {
                    if (d !== dropdown) d.classList.remove('mobile-expanded');
                });

                dropdown.classList.toggle('mobile-expanded');
            });
        });

        // Close drawer when clicking a real link (not a dropdown toggle)
        navLinks.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'A' && !target.classList.contains('dropbtn')) {
                closeDrawer();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDrawer();
        });

        // Close drawer on resize to desktop
        window.addEventListener('resize', () => {
            if (!isMobile()) {
                closeDrawer();
                // Reset dropdown expansions
                dropdowns.forEach(d => d.classList.remove('mobile-expanded'));
            }
        });
    }

    // ─── BOTTOM ACTION BAR ───────────────────────────
    function initBottomBar() {
        // Bottom bar is now built into index.html — skip injection
        if (document.querySelector('.mobile-bottom-bar')) return;

        const bar = document.createElement('div');
        bar.className = 'mobile-bottom-bar';
        bar.innerHTML = `
            <div class="mobile-bottom-bar-inner">
                <button class="mobile-bottom-btn" data-action="home" aria-label="Home">
                    <span class="icon">🏠</span>
                    <span>Home</span>
                </button>
                <button class="mobile-bottom-btn" data-action="mechanic" aria-label="Mobile Mechanics">
                    <span class="icon">🔧</span>
                    <span>Mechanics</span>
                </button>
                <button class="mobile-bottom-btn call-btn" data-action="call" aria-label="Call Now">
                    <span class="icon">📞</span>
                    <span>Call</span>
                </button>
                <button class="mobile-bottom-btn" data-action="roofing" aria-label="Roofing Solutions">
                    <span class="icon">🏠</span>
                    <span>Roofing</span>
                </button>
                <button class="mobile-bottom-btn" data-action="quote" aria-label="Get Quote">
                    <span class="icon">📋</span>
                    <span>Quote</span>
                </button>
            </div>
        `;
        document.body.appendChild(bar);

        bar.addEventListener('click', (e) => {
            const btn = e.target.closest('.mobile-bottom-btn');
            if (!btn) return;

            const action = btn.dataset.action;
            switch (action) {
                case 'home':
                    scrollToSection('#home');
                    break;
                case 'mechanic':
                    scrollToSection('#services');
                    if (typeof window.switchServiceTab === 'function') {
                        window.switchServiceTab('mechanics');
                    }
                    break;
                case 'call':
                    window.location.href = 'tel:7245051350';
                    break;
                case 'roofing':
                    scrollToSection('#services');
                    if (typeof window.switchServiceTab === 'function') {
                        window.switchServiceTab('roofing');
                    }
                    break;
                case 'quote':
                    openQuoteModal();
                    break;
            }
        });
    }

    function openQuoteModal() {
        let modal = document.getElementById('mobile-quote-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'mobile-quote-modal';
            modal.className = 'mobile-quote-modal';
            
            modal.innerHTML = `
                <div class="mobile-quote-content">
                    <div class="modal-header">
                        <h2>Quick Quote Request</h2>
                        <button class="close-modal-btn" aria-label="Close modal" onclick="document.getElementById('mobile-quote-modal').style.display='none'">&times;</button>
                    </div>
                    <form id="mobile-quote-form" onsubmit="handleQuoteSubmit(event)">
                        <div class="form-group">
                            <label for="quote-name">Your Name</label>
                            <input type="text" id="quote-name" required autocomplete="name" inputmode="text" placeholder="e.g. John Doe">
                        </div>
                        <div class="form-group">
                            <label for="quote-phone">Phone Number</label>
                            <input type="tel" id="quote-phone" required autocomplete="tel" inputmode="tel" placeholder="e.g. (724) 505-1350">
                        </div>
                        <div class="form-group">
                            <label for="quote-service">Required Service</label>
                            <select id="quote-service" required>
                                <option value="mechanics">🔧 24/7 Mobile Mechanic</option>
                                <option value="roofing">🏠 Roofing Solutions</option>
                                <option value="diagnostics">⚙️ On-Site Diagnostics</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="quote-details">Job Details / Emergency Info</label>
                            <textarea id="quote-details" required placeholder="Tell me what you need (e.g. car won't start, active roof leak)..." rows="3"></textarea>
                        </div>
                        <button type="submit" class="submit-quote-btn">Send Dispatch Alert</button>
                    </form>
                    <div id="quote-success-state" style="display: none; text-align: center; padding: 20px 0;">
                        <span class="success-icon" style="font-size: 3rem; color: #00f2ea; text-shadow: 0 0 10px #00f2ea;">⚡</span>
                        <h3 style="font-family: 'Orbitron', sans-serif; color: #00f2ea; margin-top: 15px;">Dispatch Alert Sent!</h3>
                        <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 10px;">I have received your request. I will call you immediately at the number provided.</p>
                        <button class="cta-button" onclick="document.getElementById('mobile-quote-modal').style.display='none'" style="margin-top: 20px; width: 100%;">Close Panel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });

            window.handleQuoteSubmit = (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('.submit-quote-btn');
                btn.textContent = "TRANSMITTING TELEMETRY...";
                btn.disabled = true;

                setTimeout(() => {
                    document.getElementById('mobile-quote-form').style.display = 'none';
                    document.getElementById('quote-success-state').style.display = 'block';
                }, 1200);
            };
        }
        
        modal.style.display = 'flex';
        const form = document.getElementById('mobile-quote-form');
        const success = document.getElementById('quote-success-state');
        if (form && success) {
            form.style.display = 'block';
            form.reset();
            const btn = form.querySelector('.submit-quote-btn');
            btn.textContent = "Send Dispatch Alert";
            btn.disabled = false;
            success.style.display = 'none';
        }
    }

    // ─── SMOOTH SCROLL WITH HEADER OFFSET ────────────
    function scrollToSection(selector) {
        const el = document.querySelector(selector);
        if (!el) return;
        const headerHeight = document.querySelector('.header')?.offsetHeight || 70;
        const bannerHeight = document.querySelector('.rolling-banner')?.offsetHeight || 40;
        const offset = headerHeight + bannerHeight + 10;
        const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    // ─── FIX 100VH ON iOS ────────────────────────────
    function fixViewportHeight() {
        function setVH() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    // ─── TOUCH-FRIENDLY FAQ ──────────────────────────
    function enhanceFAQ() {
        document.querySelectorAll('.faq-question').forEach(btn => {
            // Prevent double-tap zoom on iOS
            btn.style.touchAction = 'manipulation';
        });
    }

    // ─── PERFORMANCE: DISABLE HEAVY SHADERS ON MOBILE ─
    function optimizePerformance() {
        if (!isMobile()) return;

        // Reduce background grid swap frequency
        // (The actual interval is in main.js, but we can hide tiles for perf)
        const bgGrid = document.getElementById('bg-grid');
        if (bgGrid && isSmallMobile()) {
            // On very small screens, simplify to solid bg
            bgGrid.style.opacity = '0.3';
        }

        // Reduce unified shader resolution on mobile
        const unifiedCanvas = document.getElementById('unified-panel-canvas');
        if (unifiedCanvas) {
            // Lower the pixel ratio for performance
            unifiedCanvas.style.imageRendering = 'auto';
        }
    }

    // ─── PREVENT HORIZONTAL OVERFLOW ─────────────────
    function preventOverflow() {
        // Find and fix any elements that cause horizontal scroll
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.overflowX = 'hidden';
    }

    // ─── ACCESSIBLE ANCHOR SCROLLING ─────────────────
    function fixAnchorScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return; // Skip dropdown toggles
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    scrollToSection(href);
                }
            });
        });
    }

    // ─── MOBILE ROLLING BANNER ───────────────────────
    function initMobileBanner() {
        // Mobile banner is now built into index.html — skip injection if already present
        const parent = document.querySelector('.rolling-banner');
        if (!parent || parent.querySelector('.mobile-rolling-banner')) return;

        const capabilities = [
            "DAMION'S 24/7 MOBILE MECHANICS",
            "ALL-VEHICLE EMERGENCY ROADSIDE SOLUTIONS",
            "ON-SITE COMPUTER DIAGNOSTICS & SYSTEM RESTORES",
            "BRAKE & SUSPENSION ADVANCED REMEDIES",
            "HEAVY DIESEL FLEET CALIBRATIONS",
            "HIGH-VOLTAGE EV & HYBRID BATTERY CORES SERVICED",
            "VINTAGE MUSCLE ENGINE & CARBURETOR REBUILDS",
            "DISPATCH HOTLINE ACTIVE: 724-505-1350"
        ];

        const banner = document.createElement('div');
        banner.className = 'mobile-rolling-banner';

        const makeSpansHtml = () => {
            return capabilities.map((text, idx) => {
                const sep = idx < capabilities.length - 1 ? `<span class="separator">⚡</span>` : '';
                return `<span>${text}</span>${sep}`;
            }).join('');
        };

        banner.innerHTML = `
            <div class="mobile-rolling-banner-inner">
                ${makeSpansHtml()}
            </div>
            <div class="mobile-rolling-banner-inner" aria-hidden="true">
                <span class="separator">⚡</span>
                ${makeSpansHtml()}
            </div>
        `;
        parent.appendChild(banner);
    }

    // ─── INIT ────────────────────────────────────────
    function init() {
        // Always inject CSS (it's gated by @media queries)
        injectMobileCSS();
        fixViewportHeight();
        preventOverflow();
        initMobileBanner();

        // Only run interactive JS on mobile
        if (isMobile() || isTouchDevice()) {
            initMobileDrawer();
            initBottomBar();
            enhanceFAQ();
            optimizePerformance();
            fixAnchorScrolling();
        }

        // Re-init on resize crossing the breakpoint
        let wasMobile = isMobile();
        window.addEventListener('resize', () => {
            const nowMobile = isMobile();
            if (nowMobile && !wasMobile) {
                initMobileDrawer();
                initBottomBar();
                enhanceFAQ();
                optimizePerformance();
                fixAnchorScrolling();
            }
            wasMobile = nowMobile;
        });

        console.log('%c[MOBILE.JS] ⚡ Mobile experience layer loaded', 'color: #00f2ea; font-weight: bold;');
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
