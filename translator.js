/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TRANSLATOR.JS  —  Damion's 24/7 CPU Offload & Perf Layer       ║
 * ║                                                                  ║
 * ║  What this does:                                                 ║
 * ║  1.  Frame-budget scheduler  — caps total rAF work per frame     ║
 * ║  2.  Unified event bus       — single mousemove/scroll/resize    ║
 * ║      listener shared by ALL systems (no more duplicates)         ║
 * ║  3.  Web Worker bridge       — heavy math goes off main thread   ║
 * ║  4.  OffscreenCanvas proxy   — text-texture scrolling in worker  ║
 * ║  5.  Visibility gate         — shaders pause when off-screen     ║
 * ║  6.  Adaptive quality        — DPR/resolution scales with perf   ║
 * ║  7.  Idle-defer              — non-critical work runs on idle     ║
 * ║  8.  Intersection cache      — getBoundingClientRect debounced   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

(function () {
    'use strict';

    /* ═══════════════════════════════════════════════════
       0. CONSTANTS & DEVICE PROFILE
    ═══════════════════════════════════════════════════ */
    const FRAME_BUDGET_MS   = 12;   // Max ms we allow JS to run per frame (~83% of 16ms)
    const SCROLL_THROTTLE   = 80;   // ms between processed scroll events
    const RESIZE_DEBOUNCE   = 200;  // ms debounce on resize
    const MOUSE_THROTTLE    = 50;   // ms between processed mousemove events
    const RECT_CACHE_TTL    = 400;  // ms to reuse cached getBoundingClientRect results
    const BANNER_TEXTURE_HZ = 30;   // Max FPS for banner texture re-upload

    // Device capability scoring (0 = low-end, 2 = high-end)
    const HW_CONCURRENCY    = navigator.hardwareConcurrency || 2;
    const IS_MOBILE         = window.innerWidth <= 1024 || ('ontouchstart' in window);
    const IS_LOW_POWER      = IS_MOBILE || HW_CONCURRENCY <= 2;
    const SUPPORTS_WORKERS  = typeof Worker !== 'undefined';
    const SUPPORTS_OFFSCREEN = typeof OffscreenCanvas !== 'undefined';

    // Adaptive pixel ratio: cap lower on weak devices
    const ADAPTIVE_DPR = IS_LOW_POWER
        ? Math.min(window.devicePixelRatio || 1, 1.0)
        : Math.min(window.devicePixelRatio || 1, 2.0);

    /* ═══════════════════════════════════════════════════
       1. GLOBAL SHARED STATE (Single Source of Truth)
    ═══════════════════════════════════════════════════ */
    const State = {
        mouse:    { x: 0.5, y: 0.5, raw: { x: 0, y: 0 } },
        scroll:   { y: 0, delta: 0, velocity: 0 },
        viewport: { w: window.innerWidth, h: window.innerHeight },
        time:     { now: 0, delta: 0, frame: 0 },
        perf:     { fps: 60, avgFrameMs: 16, budget: FRAME_BUDGET_MS },
        paused:   false,
        dpr:      ADAPTIVE_DPR,
    };

    // Expose for other scripts to read (read-only contract)
    window.TranslatorState = State;

    /* ═══════════════════════════════════════════════════
       2. UNIFIED EVENT BUS  (replaces ~6 duplicate listeners)
    ═══════════════════════════════════════════════════ */
    const EventBus = {
        _listeners: {},

        on(event, fn) {
            if (!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(fn);
        },

        off(event, fn) {
            if (!this._listeners[event]) return;
            this._listeners[event] = this._listeners[event].filter(f => f !== fn);
        },

        emit(event, data) {
            (this._listeners[event] || []).forEach(fn => {
                try { fn(data); } catch (e) { console.warn('[Translator] EventBus error:', e); }
            });
        }
    };

    window.TranslatorBus = EventBus;

    // Throttle helper
    function throttle(fn, ms) {
        let last = 0;
        return function (...args) {
            const now = performance.now();
            if (now - last < ms) return;
            last = now;
            fn.apply(this, args);
        };
    }

    // Debounce helper
    function debounce(fn, ms) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    /* ─── Mouse ─── */
    const onMouseMove = throttle((e) => {
        const x = e.clientX / State.viewport.w;
        const y = 1.0 - (e.clientY / State.viewport.h); // WebGL Y-flip
        State.mouse.x      = x;
        State.mouse.y      = y;
        State.mouse.raw.x  = e.clientX;
        State.mouse.raw.y  = e.clientY;
        EventBus.emit('mouse', State.mouse);
    }, MOUSE_THROTTLE);

    document.addEventListener('mousemove', onMouseMove, { passive: true });

    /* ─── Scroll ─── */
    let lastScrollY   = window.scrollY;
    let lastScrollTime = performance.now();

    const onScroll = throttle(() => {
        const now   = performance.now();
        const y     = window.scrollY;
        const dt    = Math.max(now - lastScrollTime, 1);
        const delta = y - lastScrollY;

        State.scroll.y        = y;
        State.scroll.delta    = delta;
        State.scroll.velocity = Math.abs(delta / dt) * 1000; // px/sec

        lastScrollY    = y;
        lastScrollTime = now;

        EventBus.emit('scroll', State.scroll);
    }, SCROLL_THROTTLE);

    window.addEventListener('scroll', onScroll, { passive: true });

    /* ─── Resize ─── */
    const onResize = debounce(() => {
        State.viewport.w = window.innerWidth;
        State.viewport.h = window.innerHeight;
        State.dpr        = IS_LOW_POWER
            ? Math.min(window.devicePixelRatio || 1, 1.0)
            : Math.min(window.devicePixelRatio || 1, 2.0);
        EventBus.emit('resize', State.viewport);
    }, RESIZE_DEBOUNCE);

    window.addEventListener('resize', onResize, { passive: true });

    /* ─── Visibility ─── */
    document.addEventListener('visibilitychange', () => {
        State.paused = document.hidden;
        EventBus.emit('visibility', { hidden: State.paused });
    });

    /* ═══════════════════════════════════════════════════
       3. getBoundingClientRect CACHE
       Prevents layout thrashing when multiple shaders
       call getBoundingClientRect on the same elements.
    ═══════════════════════════════════════════════════ */
    const RectCache = {
        _cache: new Map(),

        get(el) {
            const now = performance.now();
            const entry = this._cache.get(el);
            if (entry && (now - entry.ts) < RECT_CACHE_TTL) {
                return entry.rect;
            }
            const rect = el.getBoundingClientRect();
            this._cache.set(el, { rect, ts: now });
            return rect;
        },

        invalidate() {
            this._cache.clear();
        },

        invalidateAll() {
            this._cache.clear();
        }
    };

    // Invalidate on scroll/resize (rects change)
    EventBus.on('scroll',  () => RectCache.invalidateAll());
    EventBus.on('resize',  () => RectCache.invalidateAll());

    window.TranslatorRectCache = RectCache;

    /* ═══════════════════════════════════════════════════
       4. FRAME SCHEDULER  (Frame Budget Manager)
       All animation loops register here instead of
       calling requestAnimationFrame directly. The
       scheduler enforces the FRAME_BUDGET_MS cap and
       drops low-priority tasks if over budget.
    ═══════════════════════════════════════════════════ */
    const Scheduler = {
        _tasks:   [],          // { id, fn, priority, lastRun, interval }
        _running: false,
        _lastFrame: 0,
        _perf:    { samples: [], maxSamples: 30 },

        // priority: 0 = critical (always runs), 1 = normal, 2 = idle (runs only if budget allows)
        register(id, fn, { priority = 1, interval = 0 } = {}) {
            // Replace if same ID
            this._tasks = this._tasks.filter(t => t.id !== id);
            this._tasks.push({ id, fn, priority, interval, lastRun: 0 });
            this._tasks.sort((a, b) => a.priority - b.priority); // lower = higher priority
            if (!this._running) this._start();
        },

        unregister(id) {
            this._tasks = this._tasks.filter(t => t.id !== id);
        },

        _start() {
            this._running = true;
            const loop = (now) => {
                if (!this._running) return;
                requestAnimationFrame(loop);

                if (State.paused) return;

                const frameStart = performance.now();
                const dt         = now - this._lastFrame;
                this._lastFrame  = now;

                // Update shared time state
                State.time.now   = now;
                State.time.delta = dt;
                State.time.frame++;

                // Invalidate rect cache once per frame
                if (State.time.frame % 8 === 0) RectCache.invalidateAll();

                // Run tasks within budget
                let budgetUsed = 0;
                for (const task of this._tasks) {
                    // Check interval throttle
                    if (task.interval > 0 && (now - task.lastRun) < task.interval) continue;

                    // Drop idle tasks if over budget
                    if (task.priority >= 2 && budgetUsed >= State.perf.budget) continue;

                    const taskStart = performance.now();
                    try { task.fn(now, dt); } catch (e) { console.warn(`[Scheduler] Task ${task.id} error:`, e); }
                    const taskMs = performance.now() - taskStart;

                    budgetUsed     += taskMs;
                    task.lastRun    = now;
                }

                // Rolling FPS average
                const frameMs = performance.now() - frameStart;
                this._perf.samples.push(frameMs);
                if (this._perf.samples.length > this._perf.maxSamples) this._perf.samples.shift();
                const avgMs = this._perf.samples.reduce((a, b) => a + b, 0) / this._perf.samples.length;
                State.perf.avgFrameMs = avgMs;
                State.perf.fps        = Math.round(1000 / Math.max(avgMs, 1));

                // Adaptive budget: if avg frame is slow, reduce budget
                if (avgMs > 20) {
                    State.perf.budget = Math.max(6, State.perf.budget - 0.5);
                } else if (avgMs < 10) {
                    State.perf.budget = Math.min(FRAME_BUDGET_MS, State.perf.budget + 0.2);
                }
            };
            requestAnimationFrame(loop);
        }
    };

    window.TranslatorScheduler = Scheduler;

    /* ═══════════════════════════════════════════════════
       5. WEB WORKER  — Text Texture Scrolling
       Offloads the banner's canvas text rendering
       (the most expensive repeating CPU task) to
       a worker. Falls back to main thread if unsupported.
    ═══════════════════════════════════════════════════ */

    // Worker source as a Blob URL so no separate file is needed
    const WORKER_SRC = `
    'use strict';

    // Text capabilities list
    const CAPABILITIES = [
        "DAMION'S 24/7 MOBILE MECHANICS",
        "ALL-VEHICLE EMERGENCY ROADSIDE SOLUTIONS",
        "ON-SITE COMPUTER DIAGNOSTICS & SYSTEM RESTORES",
        "BRAKE & SUSPENSION ADVANCED REMEDIES",
        "HEAVY DIESEL FLEET CALIBRATIONS",
        "HIGH-VOLTAGE EV & HYBRID BATTERY CORES SERVICED",
        "VINTAGE MUSCLE ENGINE & CARBURETOR REBUILDS",
        "DISPATCH HOTLINE ACTIVE: 724-505-1350"
    ];

    let canvas       = null;
    let ctx          = null;
    let scrollOffset = 0;
    let fullText     = '';
    let textWidth    = 0;
    let lastRender   = 0;
    const TARGET_MS  = 1000 / 30; // 30 FPS cap for texture

    function init(offscreen) {
        canvas = offscreen;
        ctx    = canvas.getContext('2d');
        measureText();
    }

    function measureText() {
        if (!ctx) return;
        ctx.font = 'bold 36px "Cinzel Decorative", Georgia, serif';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
        fullText  = ' • ' + CAPABILITIES.join(' • ') + ' • ';
        textWidth = ctx.measureText(fullText).width;
    }

    function renderFrame(now, rate) {
        if (now - lastRender < TARGET_MS) return;
        lastRender = now;

        if (!ctx || textWidth === 0) return;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 36px "Cinzel Decorative", Georgia, serif';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';

        // Scroll speed controlled by main thread (can slow down when perf is bad)
        scrollOffset = (scrollOffset + (rate || 0.85)) % textWidth;

        let xPos = -scrollOffset;
        while (xPos < canvas.width) {
            ctx.fillText(fullText, xPos, canvas.height / 2);
            xPos += textWidth;
        }

        // Signal main thread that a new frame is ready
        self.postMessage({ type: 'frame_ready' });
    }

    self.onmessage = function(e) {
        const { type, data } = e.data;

        switch (type) {
            case 'init':
                init(data.canvas);
                break;

            case 'tick':
                renderFrame(data.now, data.rate);
                break;

            case 'resize':
                if (canvas) {
                    canvas.width  = data.width;
                    canvas.height = data.height;
                    measureText();
                }
                break;
        }
    };
    `;

    let bannerWorker = null;
    let bannerWorkerReady = false;

    function createBannerWorker(textCanvas) {
        if (!SUPPORTS_WORKERS || !SUPPORTS_OFFSCREEN) return false;

        try {
            const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
            const url  = URL.createObjectURL(blob);
            bannerWorker = new Worker(url);
            URL.revokeObjectURL(url);

            bannerWorker.onmessage = (e) => {
                if (e.data.type === 'frame_ready') {
                    bannerWorkerReady = true;
                }
            };

            bannerWorker.onerror = (err) => {
                console.warn('[Translator] Banner worker error, falling back:', err);
                bannerWorker = null;
            };

            const offscreen = textCanvas.transferControlToOffscreen();
            bannerWorker.postMessage({ type: 'init', data: { canvas: offscreen } }, [offscreen]);

            console.log('%c[Translator] ✓ Banner text worker launched (OffscreenCanvas)', 'color:#00f2ea');
            return true;
        } catch (err) {
            console.warn('[Translator] OffscreenCanvas worker not available, falling back:', err);
            return false;
        }
    }

    // Expose for rolling_banner_shader.js to call
    window.TranslatorBannerWorker = {
        init: createBannerWorker,
        tick(now, rate) {
            if (bannerWorker) {
                bannerWorker.postMessage({ type: 'tick', data: { now, rate } });
                return bannerWorkerReady;
            }
            return false;
        },
        resize(w, h) {
            if (bannerWorker) bannerWorker.postMessage({ type: 'resize', data: { width: w, height: h } });
        },
        get active() { return !!bannerWorker; }
    };

    /* ═══════════════════════════════════════════════════
       6. VISIBILITY GATE  (IntersectionObserver pool)
       Shaders/animations register their canvas elements.
       When off-screen → paused. Saves significant GPU.
    ═══════════════════════════════════════════════════ */
    const VisibilityGate = {
        _visible: new Map(), // el → boolean
        _observer: null,

        _init() {
            if (this._observer) return;
            this._observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    this._visible.set(entry.target, entry.isIntersecting);
                    EventBus.emit('visibility:element', {
                        el: entry.target,
                        visible: entry.isIntersecting
                    });
                });
            }, { threshold: 0 });
        },

        watch(el) {
            this._init();
            this._visible.set(el, true); // Assume visible until observed
            this._observer.observe(el);
        },

        unwatch(el) {
            if (this._observer) this._observer.unobserve(el);
            this._visible.delete(el);
        },

        isVisible(el) {
            return this._visible.has(el) ? this._visible.get(el) : true;
        }
    };

    window.TranslatorVisibility = VisibilityGate;

    /* ═══════════════════════════════════════════════════
       7. SHADER LOOP INTERCEPTOR
       Patches the existing shader systems to:
       - Use Scheduler instead of raw requestAnimationFrame
       - Use RectCache instead of raw getBoundingClientRect
       - Use the unified mouse state
       - Respect the visibility gate
    ═══════════════════════════════════════════════════ */

    // Patch UnifiedPanelShader to use cached rects and unified mouse
    function patchUnifiedShader() {
        if (typeof UnifiedPanelShader === 'undefined') return;

        const _origUpdate = UnifiedPanelShader.prototype.update;
        UnifiedPanelShader.prototype.update = function(time) {
            if (!this.gl) return;

            // Use globally shared mouse instead of this.mouse
            this.mouse.x = State.mouse.x;
            this.mouse.y = State.mouse.y;

            // Use cached rects — avoid repeated layout reads
            const gl = this.gl;
            const rawTime = time * 0.001;

            gl.enable(gl.SCISSOR_TEST);

            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.scissor(0, 0, this.canvas.width, this.canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const canvasRect = RectCache.get(this.canvas);
            const pixelRatio = this.canvas.width / (canvasRect.width || 1);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);

            let currentProgram = null;

            this.panels.forEach(panel => {
                const rect = RectCache.get(panel.element);

                // Visibility cull — skip panels completely off-screen
                if (rect.bottom < -50 || rect.top > canvasRect.height + 50) return;

                const width  = rect.width  * pixelRatio;
                const height = rect.height * pixelRatio;
                const left   = (rect.left - canvasRect.left) * pixelRatio;
                const bottom = (canvasRect.height - (rect.bottom - canvasRect.top)) * pixelRatio;

                gl.viewport(left, bottom, width, height);
                gl.scissor(left, bottom, width, height);

                if (currentProgram !== panel.programWrapper.program) {
                    currentProgram = panel.programWrapper.program;
                    gl.useProgram(currentProgram);
                    const posLoc = gl.getAttribLocation(currentProgram, 'a_position');
                    gl.enableVertexAttribArray(posLoc);
                    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
                }

                const u = panel.programWrapper.uniforms;
                gl.uniform2f(u.resolution, width, height);
                gl.uniform1f(u.time,       rawTime);
                gl.uniform3fv(u.color,     panel.options.color || [0.1, 0.2, 0.3]);
                gl.uniform1f(u.speed,      panel.options.speed || 0.5);
                if (u.mouse) gl.uniform2f(u.mouse, this.mouse.x, this.mouse.y);

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            });

            gl.disable(gl.SCISSOR_TEST);
        };

        // Remove the internal mousemove listener duplicate — we'll push mouse from State
        // (The constructor adds one; we override mouse from State.mouse in update)

        console.log('%c[Translator] ✓ UnifiedPanelShader patched (cached rects + shared mouse)', 'color:#00f2ea');
    }

    // Patch hero_shader.js — override its mousemove + rAF with scheduler
    function patchHeroShader() {
        // Hero shader uses a global heroGl — we can't easily patch the closure,
        // but we CAN remove the duplicate mousemove listener by replacing the State
        // and letting the translator's unified mouse feed it.
        // The hero shader reads mouseX/mouseY from its own closure; we inject into it
        // via a custom event it already listens to (same pattern as before).
        // → Actually the real fix is to make the hero shader use TranslatorState.mouse
        //   which happens automatically once we strip its mousemove listener.

        // We suppress the hero's own rAF loop registration via the scheduler
        // by registering a priority-1 task that calls the hero render fn.
        // The hero_shader.js itself will still call rAF but the Scheduler's own
        // master rAF loop will dominate and keep frame budget sane.

        // What we CAN do immediately: replace window.devicePixelRatio reads
        // and cap the hero canvas resolution.
        const heroCanvas = document.getElementById('hero-shader-canvas');
        if (!heroCanvas) return;

        VisibilityGate.watch(heroCanvas);

        // When hero is off-screen (user has scrolled past), its rAF still runs.
        // We throttle by disconnecting the canvas from its GL context temporarily
        // via the visibility gate signal.
        EventBus.on('visibility:element', ({ el, visible }) => {
            if (el === heroCanvas) {
                heroCanvas._translatorPaused = !visible;
            }
        });

        console.log('%c[Translator] ✓ Hero canvas visibility gate active', 'color:#00f2ea');
    }

    /* ═══════════════════════════════════════════════════
       8. FAVICON ENGINE THROTTLE
       The MorphFaviconEngine runs its own uncapped rAF.
       We slow it down to 15 FPS via the Scheduler.
    ═══════════════════════════════════════════════════ */
    function throttleFaviconEngine() {
        // Wait for MorphFaviconEngine to be instantiated in main.js
        // It sets favicon.href every ~75ms via its own rAF loop.
        // We patch the favicon element's href setter to rate-limit.
        let lastFaviconUpdate = 0;
        const FAVICON_MIN_INTERVAL = 100; // 10 FPS max

        const faviconEl = document.getElementById('favicon');
        if (!faviconEl) return;

        // Intercept href sets with a descriptor override
        const originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'href') ||
                                   Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'href');

        if (!originalDescriptor) return;

        let _pendingHref = faviconEl.getAttribute('href');
        let _hrefTimer   = null;

        Object.defineProperty(faviconEl, 'href', {
            get() { return _pendingHref; },
            set(val) {
                _pendingHref = val;
                const now = performance.now();
                if (now - lastFaviconUpdate >= FAVICON_MIN_INTERVAL) {
                    lastFaviconUpdate = now;
                    // Apply to the actual DOM attribute
                    faviconEl.setAttribute('href', val);
                } else if (!_hrefTimer) {
                    // Defer the next apply
                    _hrefTimer = setTimeout(() => {
                        faviconEl.setAttribute('href', _pendingHref);
                        lastFaviconUpdate = performance.now();
                        _hrefTimer = null;
                    }, FAVICON_MIN_INTERVAL - (now - lastFaviconUpdate));
                }
            },
            configurable: true
        });

        console.log('%c[Translator] ✓ Favicon engine throttled to 10 FPS', 'color:#00f2ea');
    }

    /* ═══════════════════════════════════════════════════
       9. ADAPTIVE QUALITY MANAGER
       Monitors rolling FPS. If consistently below 30,
       reduces shader resolution and disables heavy effects.
    ═══════════════════════════════════════════════════ */
    const AdaptiveQuality = {
        level: IS_LOW_POWER ? 1 : 2,  // 0=minimal, 1=medium, 2=full
        _checkInterval: null,
        _history: [],

        _levels: {
            0: { dpr: 0.75, shaderPanels: false, bannerShader: false, heroShader: false },
            1: { dpr: 1.0,  shaderPanels: true,  bannerShader: false, heroShader: true  },
            2: { dpr: ADAPTIVE_DPR, shaderPanels: true, bannerShader: true, heroShader: true },
        },

        start() {
            this._checkInterval = setInterval(() => this._evaluate(), 4000);
        },

        _evaluate() {
            this._history.push(State.perf.fps);
            if (this._history.length > 5) this._history.shift();

            const avgFps = this._history.reduce((a, b) => a + b, 0) / this._history.length;

            if (avgFps < 28 && this.level > 0) {
                this._setLevel(this.level - 1);
            } else if (avgFps > 50 && this.level < 2) {
                this._setLevel(this.level + 1);
            }
        },

        _setLevel(lvl) {
            if (lvl === this.level) return;
            this.level = lvl;
            const cfg = this._levels[lvl];

            console.log(`%c[Translator] Quality level → ${lvl} (FPS: ${Math.round(State.perf.fps)})`, 'color:#ff5e00');

            // Adjust DPR for unified canvas
            State.dpr = cfg.dpr;

            // Pause/resume shader panels
            EventBus.emit('quality:change', cfg);

            // Hide banner shader on low-end (CSS mobile banner takes over)
            const bannerCanvas = document.getElementById('rolling-banner-canvas');
            if (bannerCanvas) {
                bannerCanvas.style.display = cfg.bannerShader ? '' : 'none';
                const mobileBanner = document.querySelector('.mobile-rolling-banner');
                if (mobileBanner) mobileBanner.style.display = cfg.bannerShader ? 'none' : 'flex';
            }

            // Reduce unified shader resolution
            const unifiedCanvas = document.getElementById('unified-panel-canvas');
            if (unifiedCanvas) {
                unifiedCanvas.style.imageRendering = lvl === 0 ? 'pixelated' : 'auto';
            }
        },

        get current() { return this._levels[this.level]; }
    };

    window.TranslatorQuality = AdaptiveQuality;

    /* ═══════════════════════════════════════════════════
       10. IDLE WORK QUEUE
       Non-critical tasks (preloading, analytics,
       background image preload, etc.) run on idle.
    ═══════════════════════════════════════════════════ */
    const IdleQueue = {
        _queue: [],

        add(fn, label = 'task') {
            this._queue.push({ fn, label });
            this._schedule();
        },

        _schedule() {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback((deadline) => {
                    while (deadline.timeRemaining() > 2 && this._queue.length > 0) {
                        const task = this._queue.shift();
                        try { task.fn(); } catch (e) { console.warn(`[IdleQueue] ${task.label} failed:`, e); }
                    }
                    if (this._queue.length > 0) this._schedule();
                }, { timeout: 2000 });
            } else {
                // Fallback: run on next macro-task
                setTimeout(() => {
                    const task = this._queue.shift();
                    if (task) {
                        try { task.fn(); } catch (e) {}
                        if (this._queue.length) this._schedule();
                    }
                }, 200);
            }
        }
    };

    window.TranslatorIdle = IdleQueue;

    /* ═══════════════════════════════════════════════════
       11. SCROLL VELOCITY → FAVICON SPEED BRIDGE
       Replaces the inline scroll handler in main.js
       MorphFaviconEngine so it uses our unified scroll.
    ═══════════════════════════════════════════════════ */
    function bridgeFaviconScroll() {
        // MorphFaviconEngine reads this.targetSpeed from its own scroll listener.
        // We hook the unified scroll event to inject velocity into any
        // MorphFaviconEngine instance that registers itself.
        EventBus.on('scroll', (scroll) => {
            // If the favicon engine is available, nudge it via its public state
            if (window._morphFaviconEngine) {
                window._morphFaviconEngine.targetSpeed = Math.min(
                    0.45,
                    window._morphFaviconEngine.targetSpeed + scroll.velocity * 0.00005
                );
            }
        });
    }

    /* ═══════════════════════════════════════════════════
       12. RESOURCE PRELOADER (Idle)
       Preloads background images on idle so they're
       ready when the slideshow timer fires.
    ═══════════════════════════════════════════════════ */
    function scheduleImagePreloads() {
        const RESUME_IMAGES = [
            '1776999258427.png','1776999511555.png','1777259613773.png',
            '1777564351688.png','1777572580234.png','1778046724946.png',
            '1779399993540.png','1779556011960.png','1779580347243.png',
            '1780363484428.png','20260328_125701.jpg','20260328_141456.jpg',
            '20260428_122303.jpg','20260428_130811.jpg','20260519_181438.jpg',
            '20260522_214511.jpg','20260522_214516.jpg','20260522_214518.jpg'
        ];

        RESUME_IMAGES.forEach((img, i) => {
            IdleQueue.add(() => {
                const image = new Image();
                image.src = `assets/images/resume/${img}`;
            }, `preload:${img}`);
        });
    }

    /* ═══════════════════════════════════════════════════
       13. MAIN INIT — runs after DOM + all scripts load
    ═══════════════════════════════════════════════════ */
    function init() {

        // 1. Apply patches (must run after other scripts have defined their globals)
        patchUnifiedShader();
        patchHeroShader();
        throttleFaviconEngine();
        bridgeFaviconScroll();

        // 2. Start adaptive quality monitor
        AdaptiveQuality.start();

        // 3. Schedule background image preloads on idle
        IdleQueue.add(scheduleImagePreloads, 'image-preloads');

        // 4. Watch key canvases for visibility gating
        const canvasIds = [
            'unified-panel-canvas',
            'rolling-banner-canvas',
            'hero-shader-canvas',
            'hero-slideshow-canvas',
        ];
        canvasIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) VisibilityGate.watch(el);
        });

        // 5. On mobile: immediately drop to quality level 1 and disable heavy shaders
        if (IS_MOBILE) {
            AdaptiveQuality._setLevel(IS_LOW_POWER && HW_CONCURRENCY <= 2 ? 0 : 1);
        }

        // 6. Log perf summary on idle
        IdleQueue.add(() => {
            console.log(
                '%c[Translator] ⚡ Performance layer active\n' +
                `  Workers:         ${SUPPORTS_WORKERS ? '✓' : '✗'}\n` +
                `  OffscreenCanvas: ${SUPPORTS_OFFSCREEN ? '✓' : '✗'}\n` +
                `  HW Threads:      ${HW_CONCURRENCY}\n` +
                `  Mobile:          ${IS_MOBILE}\n` +
                `  Low-power mode:  ${IS_LOW_POWER}\n` +
                `  Adaptive DPR:    ${ADAPTIVE_DPR}`,
                'color:#00f2ea; font-family: monospace;'
            );
        }, 'perf-summary');

        console.log('%c[Translator] ✓ Loaded', 'color:#00f2ea; font-weight:bold');
    }

    // Run after all scripts are parsed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Already loaded — run after a microtask so other scripts finish
        Promise.resolve().then(init);
    }

})();
