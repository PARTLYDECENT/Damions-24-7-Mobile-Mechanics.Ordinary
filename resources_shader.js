/**
 * Initializes a "Data Synapse" WebGL shader on a canvas element.
 * @param {HTMLCanvasElement} canvas The canvas to render on.
 * @param {object} options Shader options (e.g., color, speed).
 */
function initializeResourceShader(canvas, options) {
    const gl = canvas.getContext('webgl', { antialias: true, powerPreference: "high-performance" });
    if (!gl) {
        console.error("WebGL not supported! Cannot initialize resource shader.");
        return;
    }

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
        uniform vec3 u_color;

        // Hashing function for pseudo-random numbers
        vec2 hash(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        // Voronoi noise function
        float voronoi(vec2 x) {
            vec2 n = floor(x);
            vec2 f = fract(x);
            float min_dist = 1.0;
            for (int j = -1; j <= 1; j++) {
                for (int i = -1; i <= 1; i++) {
                    vec2 g = vec2(float(i), float(j));
                    vec2 o = hash(n + g);
                    vec2 r = g - f + (0.5 + 0.5 * sin(u_time + 6.2831 * o));
                    float d = dot(r, r);
                    min_dist = min(min_dist, d);
                }
            }
            return sqrt(min_dist);
        }

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            st.x *= u_resolution.x / u_resolution.y;

            vec3 color = vec3(0.0);
            
            // Base layer: Voronoi cells for the network structure
            float v = voronoi(st * 6.0);
            color += u_color * (1.0 - v) * 0.15;
            
            // Glowing cell borders (synapses)
            color += u_color * pow(1.0 - v, 32.0) * 0.8;

            // Pulsing nodes at cell centers
            float nodes = voronoi(st * 6.0 + 0.1);
            color += u_color * pow(1.0 - nodes, 20.0) * (0.5 + 0.5 * sin(u_time * 2.0));

            // Mouse interaction glow
            vec2 mouse = u_mouse / u_resolution.xy;
            mouse.x *= u_resolution.x / u_resolution.y;
            float mouse_dist = distance(st, mouse);
            color += u_color * 0.4 * smoothstep(0.2, 0.0, mouse_dist);

            // Faint background noise
            float noise = fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
            color += noise * 0.05;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");
    const mouseUniformLocation = gl.getUniformLocation(program, "u_mouse");
    const colorUniformLocation = gl.getUniformLocation(program, "u_color");

    let mousePos = [0, 0];
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mousePos = [e.clientX - rect.left, rect.height - (e.clientY - rect.top)];
    });

    function resize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    function render(time) {
        time *= 0.001; // convert to seconds

        gl.useProgram(program);

        gl.uniform1f(timeUniformLocation, time);
        gl.uniform2fv(mouseUniformLocation, mousePos);
        gl.uniform3fv(colorUniformLocation, options.color || [0.0, 0.8, 0.8]);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}