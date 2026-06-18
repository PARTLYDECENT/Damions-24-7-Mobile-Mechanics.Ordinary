/**
 * hero_shader.js — Translator-integrated, 30 FPS capped, shared mouse state
 */
const heroCanvas = document.getElementById('hero-shader-canvas');
const heroGl     = heroCanvas
    ? heroCanvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' })
    : null;

if (!heroGl) {
    if (heroCanvas) console.warn('[hero_shader] WebGL not supported');
} else {
    const vsSource = `
        attribute vec4 aVertexPosition;
        void main() { gl_Position = aVertexPosition; }
    `;

    const fsSource = (window.ShaderLibrary && window.ShaderLibrary.HexGrille)
        ? window.ShaderLibrary.HexGrille
        : `precision mediump float; void main() { gl_FragColor = vec4(0.0, 0.6, 0.8, 0.5); }`;

    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('[hero_shader] compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vs = compileShader(heroGl, vsSource, heroGl.VERTEX_SHADER);
    const fs = compileShader(heroGl, fsSource, heroGl.FRAGMENT_SHADER);

    if (vs && fs) {
        const prog = heroGl.createProgram();
        heroGl.attachShader(prog, vs);
        heroGl.attachShader(prog, fs);
        heroGl.linkProgram(prog);

        if (!heroGl.getProgramParameter(prog, heroGl.LINK_STATUS)) {
            console.error('[hero_shader] link error:', heroGl.getProgramInfoLog(prog));
        } else {
            heroGl.useProgram(prog);

            const posLoc = heroGl.getAttribLocation(prog,  'aVertexPosition');
            const resLoc = heroGl.getUniformLocation(prog, 'u_resolution');
            const timLoc = heroGl.getUniformLocation(prog, 'u_time');
            const colLoc = heroGl.getUniformLocation(prog, 'u_color');
            const mouLoc = heroGl.getUniformLocation(prog, 'u_mouse');
            const spdLoc = heroGl.getUniformLocation(prog, 'u_speed');

            const buf = heroGl.createBuffer();
            heroGl.bindBuffer(heroGl.ARRAY_BUFFER, buf);
            heroGl.bufferData(heroGl.ARRAY_BUFFER, new Float32Array([
                -1,  1,   1,  1,
                -1, -1,   1, -1
            ]), heroGl.STATIC_DRAW);

            // ── Use translator shared mouse — no duplicate listener ──
            function getMouse() {
                return (window.TranslatorState && window.TranslatorState.mouse) || { x: 0.5, y: 0.5 };
            }

            function resize() {
                heroCanvas.width  = window.innerWidth;
                heroCanvas.height = window.innerHeight;
                heroGl.viewport(0, 0, heroCanvas.width, heroCanvas.height);
            }
            // Subscribe to unified resize event or fallback
            if (window.TranslatorBus) window.TranslatorBus.on('resize', resize);
            else window.addEventListener('resize', resize, { passive: true });
            resize();

            // ── 30 FPS cap — hero background doesn't need 60 FPS ──
            const TARGET_MS = 1000 / 30;
            let lastT = 0;

            function render(now) {
                requestAnimationFrame(render);

                // Pause when off-screen (translator visibility gate)
                if (heroCanvas._translatorPaused) return;
                if (document.hidden) return;
                if (now - lastT < TARGET_MS) return;
                lastT = now;

                const t = now * 0.001;
                const m = getMouse();

                heroGl.clearColor(0, 0, 0, 0);
                heroGl.clear(heroGl.COLOR_BUFFER_BIT);

                heroGl.enableVertexAttribArray(posLoc);
                heroGl.bindBuffer(heroGl.ARRAY_BUFFER, buf);
                heroGl.vertexAttribPointer(posLoc, 2, heroGl.FLOAT, false, 0, 0);

                heroGl.uniform2f(resLoc, heroCanvas.width, heroCanvas.height);
                heroGl.uniform1f(timLoc, t);
                heroGl.uniform3f(colLoc, 0.0, 0.6, 0.8);
                heroGl.uniform2f(mouLoc, m.x, m.y);
                heroGl.uniform1f(spdLoc, 0.15);

                heroGl.drawArrays(heroGl.TRIANGLE_STRIP, 0, 4);
            }
            requestAnimationFrame(render);
        }
    }
}
