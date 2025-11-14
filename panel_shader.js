/**
 * PanelShader Class
 * Manages a single WebGL canvas to render a dynamic, multi-layered data-stream effect.
 * This is designed to be controlled by an external animation loop.
 *
 * @param {HTMLCanvasElement} canvas The canvas to render on.
 * @param {object} options Shader options (e.g., color, speed).
 */
class PanelShader {
    constructor(canvas, options = {}) {
    const gl = canvas.getContext('webgl', { antialias: false, powerPreference: "low-power" });
    if (!gl) {
        console.error("WebGL not supported! Cannot initialize panel shader.");
        canvas.style.backgroundColor = '#1A2238'; // Fallback color
        return;
    }

        this.gl = gl;
        this.canvas = canvas;
        this.options = options;
        this.program = null;
        this.uniforms = {};

    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // --- UPDATED FRAGMENT SHADER ---
    const fragmentShaderSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform float u_speed;

        // 2D Random function
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        // 2D Noise function
        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep
            return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                       mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        // FBM (Fractional Brownian Motion) - for layered, complex noise
        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < 4; i++) {
                value += amplitude * noise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            st.x *= u_resolution.x / u_resolution.y; // Aspect correction

            float t = u_time * u_speed * 0.1;

            // Create two layers of noise moving diagonally in different directions
            vec2 st1 = st * 3.0 + vec2(t, t);
            vec2 st2 = st * 5.0 - vec2(t * 0.5, 0.0);

            // Get FBM noise for each layer
            float n1 = fbm(st1);
            float n2 = fbm(st2);

            // Combine the noise layers
            float combinedNoise = n1 * 0.7 + n2 * 0.3;

            // Base color from noise
            vec3 color = u_color * combinedNoise * 1.5;
            
            // Add a brighter, cooler highlight color where noise is intense
            vec3 highlightColor = u_color + vec3(0.1, 0.1, 0.2);
            color = mix(color, highlightColor, smoothstep(0.6, 0.8, n1));
            
            // Subtle scanline effect
            float scanline = sin(st.y * u_resolution.y * 0.8) * 0.05;
            color -= scanline * 0.2;

            // Vignette
            float vignette = length(st - vec2(0.5 * (u_resolution.x / u_resolution.y), 0.5));
            color *= 1.0 - vignette * 1.0;
            
            // Add a base glow
            color += u_color * 0.1;

            gl_FragColor = vec4(color, 1.0);
        }
    `;
    // --- END UPDATED SHADER ---

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Stop if shaders failed
    if (!vertexShader || !fragmentShader) {
        canvas.style.backgroundColor = '#1A2238'; // Fallback
        return;
    }

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error: ' + gl.getProgramInfoLog(this.program));
            gl.deleteProgram(this.program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        canvas.style.backgroundColor = '#1A2238'; // Fallback
        return;
    }
    
        gl.useProgram(this.program);

    // Shaders are linked, no longer need them
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        this.uniforms = {
            resolution: gl.getUniformLocation(this.program, "u_resolution"),
            time: gl.getUniformLocation(this.program, "u_time"),
            color: gl.getUniformLocation(this.program, "u_color"),
            speed: gl.getUniformLocation(this.program, "u_speed"),
        };
    }
    
    update(time) {
        if (!this.gl || !this.program) return;
        
        const gl = this.gl;
        const canvas = this.canvas;
        
        time *= 0.001; // convert to seconds

        // Resize handling
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        gl.useProgram(this.program);
        gl.uniform2f(this.uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(this.uniforms.time, time);
        gl.uniform3fv(this.uniforms.color, this.options.color || [0.1, 0.2, 0.3]);
        gl.uniform1f(this.uniforms.speed, this.options.speed || 0.5);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}