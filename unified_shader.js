/**
 * UnifiedPanelShader Class
 * Manages a single full-screen WebGL canvas to render effects for multiple page sections.
 * Optimized to use gl.scissor for performance, supporting multiple shader effects.
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

        this.panels = []; // Stores { element, options, programWrapper }
        this.programs = new Map(); // Cache compiled programs: "EffectName" -> { program, uniforms }
        this.buffers = {};

        // Interactive mouse state
        this.mouse = { x: 0, y: 0 };
        document.addEventListener('mousemove', (e) => {
            // Normalize mouse to 0-1 relative to window
            this.mouse.x = e.clientX / window.innerWidth;
            this.mouse.y = 1.0 - (e.clientY / window.innerHeight); // WebGL Y is flipped
        });

        this.initCommonBuffers();

        // Handle resizing
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    getProgramWrapper(effectName) {
        // Default to TechNoise if effect not found
        if (!window.ShaderLibrary[effectName]) {
            console.warn(`Effect '${effectName}' not found in library. Defaulting to MechanicGears.`);
            effectName = 'MechanicGears';
        }

        if (this.programs.has(effectName)) {
            return this.programs.get(effectName);
        }

        const gl = this.gl;
        const vsSource = window.ShaderLibrary.vertex;
        const fsSource = window.ShaderLibrary[effectName];

        const vertexShader = this.createShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fsSource);

        if (!vertexShader || !fragmentShader) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(`UnifiedPanelShader: Program link error for ${effectName}:`, gl.getProgramInfoLog(program));
            return null;
        }

        const wrapper = {
            program: program,
            uniforms: {
                resolution: gl.getUniformLocation(program, "u_resolution"),
                time: gl.getUniformLocation(program, "u_time"),
                color: gl.getUniformLocation(program, "u_color"),
                speed: gl.getUniformLocation(program, "u_speed"),
                mouse: gl.getUniformLocation(program, "u_mouse")
            }
        };

        this.programs.set(effectName, wrapper);
        return wrapper;
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

    initCommonBuffers() {
        // We only need one quad for everything
        const gl = this.gl;
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        this.buffers.position = positionBuffer;
    }

    resize() {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = window.innerWidth * pixelRatio;
        this.canvas.height = window.innerHeight * pixelRatio;
    }

    addPanel(sectionId, options) {
        const element = document.getElementById(sectionId);
        if (element) {
            const effectName = options.effect || 'MechanicGears';
            const programWrapper = this.getProgramWrapper(effectName);

            if (programWrapper) {
                this.panels.push({ element, options, programWrapper });
            }
        } else {
            console.warn(`UnifiedPanelShader: Section with ID '${sectionId}' not found.`);
        }
    }

    update(time) {
        if (!this.gl) return;

        const gl = this.gl;
        time *= 0.001; // seconds

        gl.enable(gl.SCISSOR_TEST);

        // Clear canvas
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.scissor(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const canvasRect = this.canvas.getBoundingClientRect();
        const pixelRatio = this.canvas.width / canvasRect.width;

        // Common buffer binding (all shaders use same attribs)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);

        let currentProgram = null;

        this.panels.forEach(panel => {
            const rect = panel.element.getBoundingClientRect();

            // Visibility Check
            if (rect.bottom < 0 || rect.top > canvasRect.height) return;

            // Viewport/Scissor Calc
            const width = rect.width * pixelRatio;
            const height = rect.height * pixelRatio;
            const left = (rect.left - canvasRect.left) * pixelRatio;
            const bottom = (canvasRect.height - (rect.bottom - canvasRect.top)) * pixelRatio;

            gl.viewport(left, bottom, width, height);
            gl.scissor(left, bottom, width, height);

            // Switch program if needed
            if (currentProgram !== panel.programWrapper.program) {
                currentProgram = panel.programWrapper.program;
                gl.useProgram(currentProgram);

                // Re-bind attributes for the new program
                const positionLoc = gl.getAttribLocation(currentProgram, "a_position");
                gl.enableVertexAttribArray(positionLoc);
                gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
            }

            const u = panel.programWrapper.uniforms;
            gl.uniform2f(u.resolution, width, height);
            gl.uniform1f(u.time, time);
            gl.uniform3fv(u.color, panel.options.color || [0.1, 0.2, 0.3]);
            gl.uniform1f(u.speed, panel.options.speed || 0.5);

            // Mouse handling: Transform global mouse to local panel UV space? 
            // Or just pass global normalized 0-1.
            // PulseWave uses 0-1 normalized to screen/window.
            // Let's pass the global mouse for now as it's easier for "screen space" effects.
            if (u.mouse) gl.uniform2f(u.mouse, this.mouse.x, this.mouse.y);

            // Draw
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        });

        gl.disable(gl.SCISSOR_TEST);
    }
}
