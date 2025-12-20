const heroCanvas = document.getElementById('hero-shader-canvas');
const heroGl = heroCanvas.getContext('webgl');

if (!heroGl) {
    console.error('WebGL not supported for Hero Section');
} else {
    // Vertex Shader
    const vsSource = `
        attribute vec4 aVertexPosition;
        void main() {
            gl_Position = aVertexPosition;
        }
    `;

    // Fragment Shader - Hexagonal Cybernetic Pulse
    const fsSource = `
        precision mediump float;
        uniform float uTime;
        uniform vec2 uResolution;

        // Hexagon distance function
        float hexDist(vec2 p) {
            p = abs(p);
            float c = dot(p, normalize(vec2(1.0, 1.73)));
            c = max(c, p.x);
            return c;
        }

        vec4 hexCoords(vec2 uv) {
            vec2 r = vec2(1.0, 1.73);
            vec2 h = r * 0.5;
            vec2 a = mod(uv, r) - h;
            vec2 b = mod(uv - h, r) - h;
            
            vec2 gv;
            if (length(a) < length(b))
                gv = a;
            else
                gv = b;
            
            float x = atan(gv.x, gv.y);
            float y = 0.5 - hexDist(gv);
            vec2 id = uv - gv;
            return vec4(x, y, id.x, id.y);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
            uv *= 5.0; // Scale grid

            vec3 color = vec3(0.0);

            // Rotate slightly
            float angle = uTime * 0.1;
            mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
            uv *= rot;

            vec4 hc = hexCoords(uv);
            float c = smoothstep(0.01, 0.05, hc.y);

            // Pulse effect based on ID and Time
            float pulse = sin(hc.z * 10.0 + hc.w * 10.0 + uTime * 2.0);
            pulse = smoothstep(0.0, 1.0, pulse);

            // Color palette: Cyan/Blue/Purple
            vec3 hexColor = mix(vec3(0.0, 0.2, 0.5), vec3(0.0, 1.0, 0.8), pulse);
            
            // Add "circuit" lines
            float lines = smoothstep(0.02, 0.0, abs(hc.y - 0.05));
            hexColor += vec3(1.0) * lines * 0.5;

            color = hexColor * c;

            // Vignette
            vec2 screenUV = gl_FragCoord.xy / uResolution.xy;
            float vignette = 1.0 - length(screenUV - 0.5) * 1.5;
            color *= max(0.0, vignette);

            // Dark background mixing
            color = mix(vec3(0.05, 0.05, 0.1), color, 0.8);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // Compile Shader
    function compileShader(gl, source, type) {
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

    const vertexShader = compileShader(heroGl, vsSource, heroGl.VERTEX_SHADER);
    const fragmentShader = compileShader(heroGl, fsSource, heroGl.FRAGMENT_SHADER);

    // Link Program
    const shaderProgram = heroGl.createProgram();
    heroGl.attachShader(shaderProgram, vertexShader);
    heroGl.attachShader(shaderProgram, fragmentShader);
    heroGl.linkProgram(shaderProgram);

    if (!heroGl.getProgramParameter(shaderProgram, heroGl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + heroGl.getProgramInfoLog(shaderProgram));
    }

    // Use Program
    heroGl.useProgram(shaderProgram);

    // Attributes & Uniforms
    const positionAttributeLocation = heroGl.getAttribLocation(shaderProgram, 'aVertexPosition');
    const timeUniformLocation = heroGl.getUniformLocation(shaderProgram, 'uTime');
    const resolutionUniformLocation = heroGl.getUniformLocation(shaderProgram, 'uResolution');

    // Buffer
    const positionBuffer = heroGl.createBuffer();
    heroGl.bindBuffer(heroGl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1.0, 1.0,
        1.0, 1.0,
        -1.0, -1.0,
        1.0, -1.0,
    ];
    heroGl.bufferData(heroGl.ARRAY_BUFFER, new Float32Array(positions), heroGl.STATIC_DRAW);

    // Resize
    function resize() {
        heroCanvas.width = window.innerWidth;
        heroCanvas.height = window.innerHeight;
        heroGl.viewport(0, 0, heroCanvas.width, heroCanvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    // Render Loop
    function render(time) {
        time *= 0.001; // Convert to seconds

        heroGl.clearColor(0.0, 0.0, 0.0, 1.0);
        heroGl.clear(heroGl.COLOR_BUFFER_BIT);

        heroGl.enableVertexAttribArray(positionAttributeLocation);
        heroGl.bindBuffer(heroGl.ARRAY_BUFFER, positionBuffer);
        heroGl.vertexAttribPointer(positionAttributeLocation, 2, heroGl.FLOAT, false, 0, 0);

        heroGl.uniform1f(timeUniformLocation, time);
        heroGl.uniform2f(resolutionUniformLocation, heroCanvas.width, heroCanvas.height);

        heroGl.drawArrays(heroGl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
