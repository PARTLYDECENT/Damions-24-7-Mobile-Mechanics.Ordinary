const canvas = document.getElementById('hero-shader-canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    console.error("WebGL not supported!");
    document.querySelector('.hero').style.backgroundColor = '#121212';
} else {
    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;
    const fragmentShaderSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;

        // Enhanced noise functions
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
            return mix(mix(random(i), random(i + vec2(1.0, 0.0)), u.x),
                      mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 0.0;
            for (int i = 0; i < 6; i++) {
                value += amplitude * noise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        // Complex wave function
        float wave(vec2 p, float t) {
            float d = length(p);
            return sin(d * 8.0 - t * 4.0) * exp(-d * 2.0);
        }

        // Voronoi-like pattern
        vec2 voronoi(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float minDist = 1.0;
            vec2 minPoint;

            for (int y = -1; y <= 1; y++) {
                for (int x = -1; x <= 1; x++) {
                    vec2 neighbor = vec2(float(x), float(y));
                    vec2 point = random(i + neighbor) * vec2(1.0);
                    point = 0.5 + 0.5 * sin(u_time * 0.5 + 6.2831 * point);
                    vec2 diff = neighbor + point - f;
                    float dist = length(diff);

                    if (dist < minDist) {
                        minDist = dist;
                        minPoint = point;
                    }
                }
            }
            return vec2(minDist, random(minPoint));
        }

        // Plasma effect
        float plasma(vec2 uv, float t) {
            float a = sin(uv.x * 10.0 + t);
            float b = sin(uv.y * 10.0 + t * 1.3);
            float c = sin((uv.x + uv.y) * 10.0 + t * 0.7);
            float d = sin(sqrt(uv.x * uv.x + uv.y * uv.y) * 10.0 + t * 2.0);
            return (a + b + c + d) * 0.25;
        }

        // Rotation matrix
        mat2 rotate(float angle) {
            float c = cos(angle);
            float s = sin(angle);
            return mat2(c, -s, s, c);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
            vec2 originalUv = uv;

            float t = u_time * 0.05;
            vec3 finalColor = vec3(0.0);

            // === PHASE 1: Dynamic Field Distortion ===
            vec2 field = uv;
            for(int i = 0; i < 8; i++) {
                float fi = float(i);
                field.x += 0.3 / (fi + 1.0) * sin((fi + 1.0) * field.y + t * (fi + 1.0) * 0.5);
                field.y += 0.3 / (fi + 1.0) * cos((fi + 1.0) * field.x + t * (fi + 1.0) * 0.7);
            }

            // === PHASE 2: Multi-Layer Noise ===
            float noise1 = fbm(field * 3.0 + t * 0.2);
            float noise2 = fbm(field * 6.0 - t * 0.15);
            float noise3 = fbm(field * 12.0 + t * 0.1);

            // === PHASE 3: Voronoi Cells ===
            vec2 voronoiResult = voronoi(field * 2.0 + t * 0.1);
            float cellPattern = voronoiResult.x;
            float cellId = voronoiResult.y;

            // === PHASE 4: Plasma Waves ===
            float plasmaEffect = plasma(field, t * 3.0);

            // === PHASE 5: Radial Waves ===
            float radialDist = length(originalUv);
            float radialWaves = wave(originalUv, t * 8.0);

            // === PHASE 6: Rotating Spiral ===
            vec2 rotatingUv = rotate(t * 0.5) * originalUv;
            float spiral = atan(rotatingUv.y, rotatingUv.x) + log(length(rotatingUv)) * 3.0;
            spiral = sin(spiral * 4.0 + t * 6.0) * 0.5 + 0.5;

            // === COLOR MIXING PHASES ===

            // Deep ocean base
            vec3 deepBlue = vec3(0.02, 0.05, 0.15);

            // Electric blue accents
            vec3 electricBlue = vec3(0.0, 0.4, 0.9);

            // Cyan highlights
            vec3 cyan = vec3(0.0, 0.8, 1.0);

            // Bright white energy
            vec3 white = vec3(1.0, 1.0, 1.0);

            // Purple depths
            vec3 purple = vec3(0.3, 0.0, 0.6);

            // Layer 1: Base noise coloring
            finalColor = mix(deepBlue, electricBlue, noise1);

            // Layer 2: Add cellular structure
            finalColor = mix(finalColor, cyan, cellPattern * 0.6);

            // Layer 3: Plasma overlay
            finalColor += plasmaEffect * 0.3 * vec3(0.0, 0.5, 1.0);

            // Layer 4: Radial wave highlights
            finalColor += radialWaves * 0.4 * cyan;

            // Layer 5: Spiral energy streams
            finalColor = mix(finalColor, white, spiral * noise2 * 0.3);

            // Layer 6: Purple depth variation
            finalColor = mix(finalColor, purple, noise3 * 0.2);

            // Layer 7: Edge enhancement
            float edge = 1.0 - smoothstep(0.0, 0.02, cellPattern);
            finalColor += edge * white * 0.8;

            // Layer 8: Time-based color shifting
            float timeShift = sin(t * 2.0) * 0.5 + 0.5;
            vec3 shiftColor = mix(electricBlue, cyan, timeShift);
            finalColor = mix(finalColor, shiftColor, noise1 * 0.3);

            // === ENHANCEMENT PHASES ===

            // Brightness boost for energy areas
            float energyMask = smoothstep(0.7, 1.0, noise1 + plasmaEffect + radialWaves);
            finalColor += energyMask * white * 0.5;

            // Contrast enhancement
            finalColor = finalColor * finalColor * (3.0 - 2.0 * finalColor);

            // Subtle vignette
            float vignette = 1.0 - length(originalUv) * 0.3;
            finalColor *= vignette;

            // Color temperature variation
            finalColor += vec3(0.05, 0.1, 0.2) * sin(t + originalUv.x * 2.0 + originalUv.y * 3.0);

            // Final saturation boost
            float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
            finalColor = mix(vec3(luminance), finalColor, 1.3);

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    // Shader compilation and setup
    const createShader = (gl, type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
        console.error('Failed to create shaders');
        document.querySelector('.hero').style.backgroundColor = '#121212';
    } else {
    
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
        } else {

            gl.useProgram(program);

            // Get uniform and attribute locations
            const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
            const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
            const timeUniformLocation = gl.getUniformLocation(program, "u_time");
            const mouseUniformLocation = gl.getUniformLocation(program, "u_mouse");

            // Create vertex buffer
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1,
                 1, -1,
                -1,  1,
                -1,  1,
                 1, -1,
                 1,  1
            ]), gl.STATIC_DRAW);
            
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

            // Mouse tracking
            let mouseX = 0, mouseY = 0;
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                mouseX = (e.clientX - rect.left) / rect.width;
                mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
            });

            // Render loop with enhanced timing
            let startTime = performance.now();
            const render = (currentTime) => {
                const elapsedTime = (currentTime - startTime) * 0.001;
                
                // Dynamic canvas sizing
                const displayWidth = canvas.clientWidth;
                const displayHeight = canvas.clientHeight;
                
                if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                    canvas.width = displayWidth;
                    canvas.height = displayHeight;
                    gl.viewport(0, 0, canvas.width, canvas.height);
                }
                
                // Set uniforms
                gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
                gl.uniform1f(timeUniformLocation, elapsedTime);
                gl.uniform2f(mouseUniformLocation, mouseX, mouseY);
                
                // Draw
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                
                requestAnimationFrame(render);
            };
            
            requestAnimationFrame(render);
        }
    }
}