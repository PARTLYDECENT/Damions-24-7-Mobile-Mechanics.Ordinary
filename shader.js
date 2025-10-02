const canvas = document.getElementById('hero-shader-canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    console.error("WebGL not supported!");
    document.querySelector('.hero').style.backgroundColor = '#0D0221';
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
            for (int i = 0; i < 6; i++) {
                value += amplitude * noise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        // Rotation matrix
        mat2 rotate(float angle) {
            float c = cos(angle);
            float s = sin(angle);
            return mat2(c, -s, s, c);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
            vec2 mouse = (u_mouse * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);

            // --- Mouse Interaction ---
            float mouse_dist = length(uv - mouse);
            float ripple = smoothstep(0.3, 0.0, mouse_dist);
            float displacement = ripple * 0.2;
            uv += normalize(uv - mouse) * displacement;

            float t = u_time * 0.1;
            uv = rotate(t * 0.2) * uv;

            // --- Fractal Brownian Motion ---
            float fbm_1 = fbm(uv * 2.0 + t);
            float fbm_2 = fbm(uv * 4.0 - t * 1.5);
            float fbm_3 = fbm(uv * 8.0 + t * 2.0);

            // --- Color Palette ---
            vec3 color1 = vec3(0.8, 0.1, 0.9); // Magenta
            vec3 color2 = vec3(0.1, 0.1, 0.7); // Deep Blue
            vec3 color3 = vec3(0.0, 0.8, 0.8); // Cyan
            vec3 color4 = vec3(1.0, 1.0, 1.0); // White

            // --- Color Mixing ---
            vec3 finalColor = mix(color2, color1, fbm_1);
            finalColor = mix(finalColor, color3, fbm_2);
            finalColor = mix(finalColor, color4, fbm_3 * 0.5);

            // --- Additive Ripple Effect ---
            finalColor += ripple * color3 * 0.5;

            // --- Vignette ---
            float vignette = 1.0 - length(uv) * 0.5;
            finalColor *= vignette;

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
        document.querySelector('.hero').style.backgroundColor = '#0D0221';
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