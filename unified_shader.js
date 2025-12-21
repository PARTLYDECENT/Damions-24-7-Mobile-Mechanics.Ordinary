/**
 * UnifiedPanelShader Class
 * Manages a single full-screen WebGL canvas to render effects for multiple page sections.
 * This solves the mobile crash issue caused by having too many WebGL contexts.
 */
class UnifiedPanelShader {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`UnifiedPanelShader: Canvas with ID '${canvasId}' not found.`);
            return;
        }

        this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: "low-power" });
        if (!this.gl) {
            console.error("UnifiedPanelShader: WebGL not supported.");
            return;
        }

        this.panels = []; // Stores { element, options }
        this.program = null;
        this.uniforms = {};
        this.buffers = {};

        this.initShader();
        this.initBuffers();

        // Handle resizing
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    initShader() {
        const gl = this.gl;

        const vsSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        // Same fragment shader as before, but optimized for single context use
        const fsSource = `
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
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                           mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
            }

            // FBM
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
                st.x *= u_resolution.x / u_resolution.y;

                float t = u_time * u_speed * 0.1;

                vec2 st1 = st * 3.0 + vec2(t, t);
                vec2 st2 = st * 5.0 - vec2(t * 0.5, 0.0);

                float n1 = fbm(st1);
                float n2 = fbm(st2);

                float combinedNoise = n1 * 0.7 + n2 * 0.3;

                vec3 color = u_color * combinedNoise * 1.5;
                vec3 highlightColor = u_color + vec3(0.1, 0.1, 0.2);
                color = mix(color, highlightColor, smoothstep(0.6, 0.8, n1));
                
                float scanline = sin(st.y * u_resolution.y * 0.8) * 0.05;
                color -= scanline * 0.2;

                float vignette = length(st - vec2(0.5 * (u_resolution.x / u_resolution.y), 0.5));
                color *= 1.0 - vignette * 1.0;
                
                color += u_color * 0.1;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const vertexShader = this.createShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fsSource);

        if (!vertexShader || !fragmentShader) return;

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('UnifiedPanelShader: Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }

        gl.useProgram(this.program);

        this.uniforms = {
            resolution: gl.getUniformLocation(this.program, "u_resolution"),
            time: gl.getUniformLocation(this.program, "u_time"),
            color: gl.getUniformLocation(this.program, "u_color"),
            speed: gl.getUniformLocation(this.program, "u_speed"),
        };
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('UnifiedPanelShader: Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    initBuffers() {
        const gl = this.gl;
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    }

    resize() {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = window.innerWidth * pixelRatio;
        this.canvas.height = window.innerHeight * pixelRatio;
    }

    addPanel(sectionId, options) {
        const element = document.getElementById(sectionId);
        if (element) {
            this.panels.push({ element, options });
        } else {
            console.warn(`UnifiedPanelShader: Section with ID '${sectionId}' not found.`);
        }
    }

    update(time) {
        if (!this.gl || !this.program) return;

        const gl = this.gl;
        time *= 0.001; // seconds

        gl.useProgram(this.program);
        gl.enable(gl.SCISSOR_TEST);

        // Clear the entire canvas first (optional, but good practice if we want transparency between panels)
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.scissor(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const canvasRect = this.canvas.getBoundingClientRect();
        const pixelRatio = this.canvas.width / canvasRect.width;

        this.panels.forEach(panel => {
            const rect = panel.element.getBoundingClientRect();

            // Check if panel is visible on screen
            if (rect.bottom < 0 || rect.top > canvasRect.height) return;

            // Calculate viewport/scissor coordinates (WebGL 0,0 is bottom-left)
            const width = rect.width * pixelRatio;
            const height = rect.height * pixelRatio;
            const left = (rect.left - canvasRect.left) * pixelRatio;
            const bottom = (canvasRect.height - (rect.bottom - canvasRect.top)) * pixelRatio;

            // Set viewport and scissor to restrict drawing to this panel's area
            gl.viewport(left, bottom, width, height);
            gl.scissor(left, bottom, width, height);

            // Set uniforms for this specific panel
            gl.uniform2f(this.uniforms.resolution, width, height);
            gl.uniform1f(this.uniforms.time, time);
            gl.uniform3fv(this.uniforms.color, panel.options.color || [0.1, 0.2, 0.3]);
            gl.uniform1f(this.uniforms.speed, panel.options.speed || 0.5);

            // Draw
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        });

        gl.disable(gl.SCISSOR_TEST);
    }
}
