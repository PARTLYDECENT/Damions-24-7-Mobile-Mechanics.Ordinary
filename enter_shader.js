const enterCanvas = document.getElementById('enter-shader-canvas');
const enterGl = enterCanvas.getContext('webgl');

if (!enterGl) {
    console.error('WebGL not supported');
} else {
    // Vertex Shader
    const vsSource = `
        attribute vec4 aVertexPosition;
        void main() {
            gl_Position = aVertexPosition;
        }
    `;

    // Fragment Shader - Dark, tech-inspired grid/plasma
    const fsSource = `
        precision mediump float;
        uniform float uTime;
        uniform vec2 uResolution;

        // Function to create a grid
        float grid(vec2 uv, float size) {
            vec2 grid = fract(uv * size);
            return step(0.98, max(grid.x, grid.y));
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uResolution.xy;
            uv = uv * 2.0 - 1.0;
            uv.x *= uResolution.x / uResolution.y;

            // Background color (Dark Blue/Black)
            vec3 color = vec3(0.02, 0.05, 0.1);

            // Moving Grid
            float t = uTime * 0.2;
            vec2 gridUV = uv;
            gridUV.y += t; // Move grid down
            
            // Perspective effect for the grid
            float perspective = 1.0 / (1.0 - uv.y * 0.5 + 0.5);
            gridUV *= perspective * 5.0;
            
            float g = grid(gridUV, 1.0);
            
            // Fade grid into the distance
            g *= smoothstep(1.0, 0.0, abs(uv.y - 0.5)); 

            // Add grid color (Cyan/Blue)
            color += vec3(0.0, 0.5, 1.0) * g * 0.3;

            // Subtle plasma/nebula effect
            float plasma = sin(uv.x * 5.0 + uTime) * cos(uv.y * 5.0 + uTime * 0.5);
            color += vec3(0.1, 0.0, 0.2) * plasma * 0.2;

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

    const vertexShader = compileShader(enterGl, vsSource, enterGl.VERTEX_SHADER);
    const fragmentShader = compileShader(enterGl, fsSource, enterGl.FRAGMENT_SHADER);

    // Link Program
    const shaderProgram = enterGl.createProgram();
    enterGl.attachShader(shaderProgram, vertexShader);
    enterGl.attachShader(shaderProgram, fragmentShader);
    enterGl.linkProgram(shaderProgram);

    if (!enterGl.getProgramParameter(shaderProgram, enterGl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + enterGl.getProgramInfoLog(shaderProgram));
    }

    // Use Program
    enterGl.useProgram(shaderProgram);

    // Attributes & Uniforms
    const positionAttributeLocation = enterGl.getAttribLocation(shaderProgram, 'aVertexPosition');
    const timeUniformLocation = enterGl.getUniformLocation(shaderProgram, 'uTime');
    const resolutionUniformLocation = enterGl.getUniformLocation(shaderProgram, 'uResolution');

    // Buffer
    const positionBuffer = enterGl.createBuffer();
    enterGl.bindBuffer(enterGl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1.0, 1.0,
        1.0, 1.0,
        -1.0, -1.0,
        1.0, -1.0,
    ];
    enterGl.bufferData(enterGl.ARRAY_BUFFER, new Float32Array(positions), enterGl.STATIC_DRAW);

    // Resize
    function resize() {
        enterCanvas.width = window.innerWidth;
        enterCanvas.height = window.innerHeight;
        enterGl.viewport(0, 0, enterCanvas.width, enterCanvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    // Render Loop
    function render(time) {
        time *= 0.001; // Convert to seconds

        enterGl.clearColor(0.0, 0.0, 0.0, 1.0);
        enterGl.clear(enterGl.COLOR_BUFFER_BIT);

        enterGl.enableVertexAttribArray(positionAttributeLocation);
        enterGl.bindBuffer(enterGl.ARRAY_BUFFER, positionBuffer);
        enterGl.vertexAttribPointer(positionAttributeLocation, 2, enterGl.FLOAT, false, 0, 0);

        enterGl.uniform1f(timeUniformLocation, time);
        enterGl.uniform2f(resolutionUniformLocation, enterCanvas.width, enterCanvas.height);

        enterGl.drawArrays(enterGl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
