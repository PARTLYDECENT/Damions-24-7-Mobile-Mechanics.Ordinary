
const engineDisplay = document.getElementById('engine-bay-canvas');
const wrenchGL = engineDisplay.getContext('webgl');

if (!wrenchGL) {
    console.error("WebGL not supported! Your garage might need an upgrade.");
    document.querySelector('.hero').style.backgroundColor = '#1A1A1A'; // Dark, greasy background
} else {
    const chassisVertexShader = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fluidDynamicsFragmentShader = `
        precision highp float;
        uniform vec2 u_viewport;
        uniform float u_engine_cycles;
        uniform vec2 u_tool_contact;

        // Grime and wear patterns (noise functions)
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
            for (int i = 0; i < 6; i++) {
                value += amplitude * noise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        // Gear rotation matrix
        mat2 rotateGear(float angle) {
            float c = cos(angle);
            float s = sin(angle);
            return mat2(c, -s, s, c);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - u_viewport.xy) / min(u_viewport.x, u_viewport.y);
            vec2 tool_pos = (u_tool_contact * 2.0 - 1.0) * vec2(u_viewport.x / u_viewport.y, 1.0);

            // --- Tool Interaction (wrench contact) ---
            float contact_pressure = length(uv - tool_pos);
            float oil_splatter = smoothstep(0.3, 0.0, contact_pressure);
            float metal_flex = oil_splatter * 0.2;
            uv += normalize(uv - tool_pos) * metal_flex;

            float engine_t = u_engine_cycles * 0.1;
            uv = rotateGear(engine_t * 0.2) * uv; // Simulating internal engine rotation

            // --- Fractal Brownian Motion (oil, grease, metal textures) ---
            float oil_flow_1 = fbm(uv * 2.0 + engine_t);
            float grease_build_up = fbm(uv * 4.0 - engine_t * 1.5);
            float metal_sheen = fbm(uv * 8.0 + engine_t * 2.0);

            // --- Color Palette (industrial, oily tones) ---
            vec3 color_rust = vec3(0.6, 0.2, 0.0); // Deep Rust
            vec3 color_oil = vec3(0.1, 0.1, 0.3); // Dark Oil
            vec3 color_metal = vec3(0.4, 0.4, 0.4); // Worn Metal
            vec3 color_spark = vec3(1.0, 0.8, 0.0); // Spark/Glow

            // --- Color Mixing (blending mechanical elements) ---
            vec3 finalEngineColor = mix(color_oil, color_rust, oil_flow_1);
            finalEngineColor = mix(finalEngineColor, color_metal, grease_build_up);
            finalEngineColor = mix(finalEngineColor, color_spark, metal_sheen * 0.5);

            // --- Additive Oil Splatter Effect ---
            finalEngineColor += oil_splatter * color_spark * 0.5;

            // --- Grime Vignette ---
            float grime_edge = 1.0 - length(uv) * 0.5;
            finalEngineColor *= grime_edge;

            gl_FragColor = vec4(finalEngineColor, 1.0);
        }
    `;

    // Shader compilation and setup (unchanged, but contextually re-imagined)
    const createShader = (wrenchGL, type, source) => {
        const shader = wrenchGL.createShader(type);
        wrenchGL.shaderSource(shader, source);
        wrenchGL.compileShader(shader);
        if (!wrenchGL.getShaderParameter(shader, wrenchGL.COMPILE_STATUS)) {
            console.error('Shader compile error: Check your diagnostics!', wrenchGL.getShaderInfoLog(shader));
            wrenchGL.deleteShader(shader);
            return null;
        }
        return shader;
    };

    // ... (rest of the WebGL setup code would follow here, adapted for the new names)
    // For brevity, only the shader sources and context are directly modified as per the request.
    // The full setup would involve creating program, linking shaders, setting up buffers, etc.
    // This example focuses on the thematic transformation of the shader logic itself.

    // Example of how uniforms would be updated (conceptual)
    // function animateEngine() {
    //     const currentTime = performance.now() / 1000;
    //     wrenchGL.uniform1f(engineCyclesLocation, currentTime);
    //     // Update mouse/tool contact position if applicable
    //     requestAnimationFrame(animateEngine);
    // }
    // animateEngine();

    const vertexShader = createShader(wrenchGL, wrenchGL.VERTEX_SHADER, chassisVertexShader);
    const fragmentShader = createShader(wrenchGL, wrenchGL.FRAGMENT_SHADER, fluidDynamicsFragmentShader);
    
    if (!vertexShader || !fragmentShader) {
        console.error('Failed to create shaders');
        document.querySelector('.hero').style.backgroundColor = '#0D0221';
    } else {
    
        const program = wrenchGL.createProgram();
        wrenchGL.attachShader(program, vertexShader);
        wrenchGL.attachShader(program, fragmentShader);
        wrenchGL.linkProgram(program);

        if (!wrenchGL.getProgramParameter(program, wrenchGL.LINK_STATUS)) {
            console.error('Program link error:', wrenchGL.getProgramInfoLog(program));
        } else {

            wrenchGL.useProgram(program);

            // Get uniform and attribute locations
            const positionAttributeLocation = wrenchGL.getAttribLocation(program, "a_position");
            const resolutionUniformLocation = wrenchGL.getUniformLocation(program, "u_viewport");
            const timeUniformLocation = wrenchGL.getUniformLocation(program, "u_engine_cycles");
            const mouseUniformLocation = wrenchGL.getUniformLocation(program, "u_tool_contact");

            // Create vertex buffer
            const positionBuffer = wrenchGL.createBuffer();
            wrenchGL.bindBuffer(wrenchGL.ARRAY_BUFFER, positionBuffer);
            wrenchGL.bufferData(wrenchGL.ARRAY_BUFFER, new Float32Array([
                -1, -1,
                 1, -1,
                -1,  1,
                -1,  1,
                 1, -1,
                 1,  1
            ]), wrenchGL.STATIC_DRAW);
            
            wrenchGL.enableVertexAttribArray(positionAttributeLocation);
            wrenchGL.vertexAttribPointer(positionAttributeLocation, 2, wrenchGL.FLOAT, false, 0, 0);

            // Mouse tracking
            let mouseX = 0, mouseY = 0;
            engineDisplay.addEventListener('mousemove', (e) => {
                const rect = engineDisplay.getBoundingClientRect();
                mouseX = (e.clientX - rect.left) / rect.width;
                mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
            });

            // Render loop with enhanced timing
            let startTime = performance.now();
            const render = (currentTime) => {
                const elapsedTime = (currentTime - startTime) * 0.001;
                
                // Dynamic canvas sizing
                const displayWidth = engineDisplay.clientWidth;
                const displayHeight = engineDisplay.clientHeight;
                
                if (engineDisplay.width !== displayWidth || engineDisplay.height !== displayHeight) {
                    engineDisplay.width = displayWidth;
                    engineDisplay.height = displayHeight;
                    wrenchGL.viewport(0, 0, engineDisplay.width, engineDisplay.height);
                }
                
                // Set uniforms
                wrenchGL.uniform2f(resolutionUniformLocation, engineDisplay.width, engineDisplay.height);
                wrenchGL.uniform1f(timeUniformLocation, elapsedTime);
                wrenchGL.uniform2f(mouseUniformLocation, mouseX, mouseY);
                
                // Draw
                wrenchGL.drawArrays(wrenchGL.TRIANGLES, 0, 6);
                
                requestAnimationFrame(render);
            };
            
            requestAnimationFrame(render);
        }
    }
}