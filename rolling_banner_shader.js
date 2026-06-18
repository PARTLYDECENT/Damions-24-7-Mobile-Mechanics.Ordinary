(function() {
    const canvas = document.getElementById('rolling-banner-canvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: true, powerPreference: "high-performance" });
    if (!gl) {
        console.error("WebGL not supported for rolling banner canvas");
        return;
    }

    // --- Vertex Shader ---
    const vsSource = `
        attribute vec2 a_position;
        varying vec2 vUv;
        void main() {
            vUv = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // --- Fragment Shader ---
    const fsSource = `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform sampler2D uTextTexture;

        // 2D Rotation matrix
        mat2 rot(float a) {
            float s = sin(a), c = cos(a);
            return mat2(c, -s, s, c);
        }

        // Raymarching Distance Function for 3D Backrooms Hallway
        float mapScene(vec3 p, out int material) {
            float floorHeight = -0.6;
            float ceilingHeight = 0.6;
            float wallWidth = 1.2;

            float floorD = p.y - floorHeight;
            float ceilingD = ceilingHeight - p.y;
            float leftWallD = p.x - (-wallWidth);
            float rightWallD = wallWidth - p.x;

            // Combine room bounding planes
            float d = min(min(floorD, ceilingD), min(leftWallD, rightWallD));
            material = 0; // Walls default

            if (floorD < d) material = 1; // Floor
            else if (ceilingD < d) material = 2; // Ceiling

            // Vertical structural columns (square pillars) repeating along the hallway length
            vec3 pillarP = p;
            pillarP.z = fract(pillarP.z / 3.0) * 3.0 - 1.5; // Repeat pillars every 3 units
            pillarP.x = abs(pillarP.x) - 0.95; // Place on sides of the hallway

            float columnD = max(abs(pillarP.x) - 0.15, abs(pillarP.z) - 0.15);
            if (columnD < d) {
                d = columnD;
                material = 3; // Column
            }

            return d;
        }

        // Raymarching Normal Generator
        vec3 getNormal(vec3 p) {
            int mat;
            vec2 e = vec2(0.002, 0.0);
            return normalize(vec3(
                mapScene(p + e.xyy, mat) - mapScene(p - e.xyy, mat),
                mapScene(p + e.yxy, mat) - mapScene(p - e.yxy, mat),
                mapScene(p + e.yyx, mat) - mapScene(p - e.yyx, mat)
            ));
        }

        void main() {
            vec2 uv = vUv;
            vec3 finalCol = vec3(0.0);

            // --- 1. Overhauled, 2x Larger 3D Visceral Red DNA Double Helix Beacons ---
            float leftSwirlEdge = 0.20;
            float rightSwirlEdge = 0.80;

            if (uv.x < leftSwirlEdge || uv.x > rightSwirlEdge) {
                vec2 center = (uv.x < leftSwirlEdge) ? vec2(0.10, 0.5) : vec2(0.90, 0.5);
                vec2 localUv = uv - center;
                
                // Adjust aspect ratio to maintain perfect circle scaling in the side columns
                localUv.x *= uResolution.x / uResolution.y;

                float yScaled = localUv.y * 14.0;
                float angle = yScaled - uTime * 5.0; // Spiraling speed
                
                // Project 3D coordinate depth Z
                float z1 = cos(angle);
                float z2 = -z1;
                
                // Horizontal displacement amplitude (wider scale for bigger double helix)
                float x1 = sin(angle) * 0.115;
                float x2 = -x1;

                // Strand distance calculations
                float dist1 = length(vec2(localUv.x - x1, 0.0));
                float dist2 = length(vec2(localUv.x - x2, 0.0));

                // Bioluminescent sugar-phosphate backbones (intense visceral red)
                float glow1 = 0.006 / (dist1 + 0.003);
                float glow2 = 0.006 / (dist2 + 0.003);
                
                // Visceral Red body with depth shading (brighter in foreground)
                vec3 colStrand1 = vec3(1.0, 0.02, 0.0) * glow1 * (z1 * 0.45 + 0.8);
                vec3 colStrand2 = vec3(1.0, 0.02, 0.0) * glow2 * (z2 * 0.45 + 0.8);
                
                // Bright amber specular highlights along the strand edges
                colStrand1 += vec3(1.0, 0.45, 0.0) * smoothstep(0.012, 0.003, dist1) * 0.6;
                colStrand2 += vec3(1.0, 0.45, 0.0) * smoothstep(0.012, 0.003, dist2) * 0.6;
                
                vec3 dnaCol = colStrand1 + colStrand2;

                // Draw base-pair connecting rungs (legit ladder pairs in amber)
                float rungFreq = 1.8;
                float nearestRung = floor(yScaled * rungFreq) / rungFreq;
                float distToRungY = abs(yScaled - nearestRung);
                
                float rungAngle = nearestRung - uTime * 5.0;
                float x1Rung = sin(rungAngle) * 0.115;
                float x2Rung = -x1Rung;
                
                float inRungX = step(min(x1Rung, x2Rung), localUv.x) * step(localUv.x, max(x1Rung, x2Rung));
                float rungThickness = smoothstep(0.12, 0.0, distToRungY);
                float rungMask = rungThickness * inRungX;

                if (rungMask > 0.0) {
                    // Nitrogenous base pairs color: intense warm glowing amber/orange
                    dnaCol += vec3(1.0, 0.65, 0.1) * 0.9 * (1.0 - abs(localUv.x) / 0.13) * rungMask;
                }

                // Add spinning red particle haze inside the cell
                float gridParticles = sin(localUv.x * 60.0) * cos(localUv.y * 60.0 + uTime * 6.0);
                dnaCol += vec3(1.0, 0.05, 0.0) * step(0.985, gridParticles) * 0.35 * (1.0 - length(localUv) * 4.0);

                // Circular beacon vignette mask (wide fit)
                float vignette = smoothstep(0.13, 0.11, length(localUv));
                finalCol = dnaCol * vignette;

                gl_FragColor = vec4(finalCol, 1.0);
                return;
            }

            // Normalize UV coordinates for central displaying banner
            vec2 centerUv = uv;
            centerUv.x = (uv.x - leftSwirlEdge) / (rightSwirlEdge - leftSwirlEdge);

            // --- 2. Background: Realistic 3D Window Into The Backrooms ---
            // Construct a proper raymarched 3D corridor view
            vec3 ro = vec3(0.0, 0.0, uTime * 1.6); // Camera moving forward
            vec3 rd = normalize(vec3((centerUv.x - 0.5) * 2.5, (centerUv.y - 0.5) * 0.8, 1.2)); // Ray direction

            float t = 0.0;
            int material = 0;
            for (int i = 0; i < 24; i++) {
                vec3 p = ro + t * rd;
                float d = mapScene(p, material);
                t += d;
                if (d < 0.001 || t > 20.0) break;
            }

            vec3 roomCol = vec3(0.0);
            if (t < 20.0) {
                vec3 p = ro + t * rd;
                vec3 n = getNormal(p);

                // Procedural texturing for Backrooms elements
                if (material == 1) { // Dirty yellowish brown carpet
                    roomCol = vec3(0.52, 0.44, 0.25);
                    float carpetNoise = fract(sin(dot(floor(p.xz * 120.0), vec2(12.9898, 78.233))) * 43758.5453);
                    roomCol = mix(roomCol, roomCol * 0.7, carpetNoise * 0.3);
                } 
                else if (material == 2) { // Fluorescent ceiling tiles
                    roomCol = vec3(0.68, 0.65, 0.54);
                    // Light fixtures running along the center
                    vec3 lPos = p;
                    lPos.z = fract(lPos.z / 3.0) * 3.0 - 1.5;
                    float lightMask = step(abs(lPos.x), 0.18) * step(abs(lPos.z), 0.65);
                    roomCol = mix(roomCol, vec3(2.5, 2.3, 1.8), lightMask); // Highly emissive lights
                } 
                else { // Vertical-striped damp yellow walls and column pillars
                    roomCol = vec3(0.82, 0.74, 0.42);
                    float stripe = sin(p.z * 18.0) * sin(p.y * 4.0);
                    roomCol = mix(roomCol, roomCol * 0.82, step(0.68, stripe));
                }

                // Diffuse lighting from fluorescent ceiling bulbs
                vec3 lightPos = vec3(0.0, 0.55, floor(p.z / 3.0) * 3.0 + 1.5);
                float lightDist = length(p - lightPos);
                float atten = 1.0 / (1.0 + lightDist * lightDist * 0.9);

                // Periodic office fluorescent flickers
                float flick = sin(uTime * 20.0) * cos(uTime * 9.0);
                float flickVal = step(0.86, fract(flick * 3.78 + floor(p.z / 3.0) * 2.54));
                vec3 lightIntensity = vec3(1.1, 0.95, 0.75) * atten * mix(1.0, 0.12, flickVal);

                roomCol *= (lightIntensity + 0.08); // Include ambient light
                roomCol = mix(roomCol, vec3(0.02, 0.02, 0.01), t / 20.0); // Corridor fog
            } else {
                roomCol = vec3(0.02, 0.02, 0.01); // Dark endless depth
            }

            // --- 3. Text Layer: Morphing Gothic White Melting/Reconstructing Text ---
            // Standard coordinates (unmirrored)
            vec2 textUv = vec2(centerUv.x * 0.94 + 0.03, centerUv.y);

            // Melting logic inside the center (x = 0.5)
            float meltDist = abs(centerUv.x - 0.5);
            float meltFactor = smoothstep(0.20, 0.0, meltDist); // Center-focused melting zone

            if (meltFactor > 0.0) {
                // Dripping vertical coordinate stretch (y pulls down to 0)
                float stretch = meltFactor * (1.0 - centerUv.y) * 1.5;

                // Dripping fluid distortions (smooth fluid wave dripping)
                float waveDrip = sin(textUv.x * 32.0 + uTime * 3.5) * 0.08 * meltFactor;

                textUv.y += stretch + waveDrip;
            }

            // Sample dynamic gothic horror text texture
            float textVal = texture2D(uTextTexture, textUv).r;
            float textMask = smoothstep(0.26, 0.44, textVal);

            // Reconstruct puddle pooling at the bottom
            float puddle = smoothstep(0.18, 0.02, centerUv.y) * meltFactor;
            textMask = max(textMask, puddle * 0.88);

            // Archaic wicked text color: Solid crisp White!
            vec3 textCol = vec3(1.0) * textMask;

            // Toxic yellowish-orange glow edge outline
            float glowOutline = smoothstep(0.02, 0.45, textVal) * (1.0 - textMask);
            textCol += vec3(1.0, 0.65, 0.15) * glowOutline * 1.3;

            // Combine raymarched Backrooms scene and gothic letters
            vec3 finalCenter = mix(roomCol, textCol, textMask);

            // Left/Right horizontal fade vignette
            float bannerVignette = smoothstep(0.0, 0.06, centerUv.x) * smoothstep(1.0, 0.94, centerUv.x);
            finalCol = finalCenter * bannerVignette;

            gl_FragColor = vec4(finalCol, 1.0);
        }
    `;

    // --- Dynamic Offscreen Canvas for Gothic Typography ---
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 2048; // Crisp resolution
    textCanvas.height = 128;
    const textCtx = textCanvas.getContext('2d');

    let scrollOffset = 0;

    function renderTextTexture() {
        textCtx.fillStyle = '#000000';
        textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height);

        // Modern, premium, clean display font with custom letter-spacing
        // We use "Cinzel Decorative" with a fallback of Georgia/serif
        textCtx.font = 'bold 36px "Cinzel Decorative", Georgia, serif';
        
        // Add spacing to prevent characters from clustering and bleeding
        if ('letterSpacing' in textCtx) {
            textCtx.letterSpacing = '6px';
        }

        textCtx.fillStyle = '#ffffff';
        textCtx.textBaseline = 'middle';

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
        
        const fullText = " • " + capabilities.join(" • ") + " • ";
        const textWidth = textCtx.measureText(fullText).width;
        
        // Increment offset to scroll from right to left normally
        scrollOffset = (scrollOffset + 0.85) % textWidth;

        // Draw repeated text with scroll offset
        let xPos = -scrollOffset;
        while (xPos < textCanvas.width) {
            textCtx.fillText(fullText, xPos, textCanvas.height / 2);
            xPos += textWidth;
        }
    }

    // Render initially
    renderTextTexture();

    // Helper to compile shader
    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compiler error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Shader linking error:', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Locations
    const posAttrib = gl.getAttribLocation(program, 'a_position');
    const timeUniform = gl.getUniformLocation(program, 'uTime');
    const resUniform = gl.getUniformLocation(program, 'uResolution');
    const texUniform = gl.getUniformLocation(program, 'uTextTexture');

    // Quad Buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
    ]), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    // Create Text Texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // Native upload flip
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Bind texture to unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(texUniform, 0);

    const isMobile = () => window.innerWidth <= 1024;

    // --- Resize Engine ---
    function resize() {
        if (isMobile()) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    // --- Render Loop (Translator-aware, capped at 30 FPS) ---
    const startTime   = performance.now();
    const TARGET_INTERVAL = 1000 / 30; // 30 FPS cap — banner doesn't need 60
    let   lastRenderTime  = 0;

    function render(now) {
        requestAnimationFrame(render); // Always re-schedule, but gate work inside

        if (isMobile()) return; // CSS marquee handles mobile

        // Frame-rate cap — skip if too soon
        if (now - lastRenderTime < TARGET_INTERVAL) return;
        lastRenderTime = now;

        // Pause when tab is hidden
        if (document.hidden) return;

        const time = (now - startTime) * 0.001;

        // Only re-upload CPU text texture if the worker isn't handling it
        const workerActive = window.TranslatorBannerWorker && window.TranslatorBannerWorker.active;
        if (!workerActive) {
            renderTextTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        }
        // If worker IS active, it renders into the OffscreenCanvas and
        // the GPU texture update is skipped here (worker manages its own surface).

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform1f(timeUniform, time);
        gl.uniform2f(resUniform, canvas.width, canvas.height);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    requestAnimationFrame(render);

})();
