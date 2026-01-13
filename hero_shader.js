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

    // Fragment Shader - Use from library or fallback
    const fsSource = window.ShaderLibrary && window.ShaderLibrary.DancingTiles ? window.ShaderLibrary.DancingTiles : `
        precision mediump float;
        void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); } // Error fallback
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

    if (!vertexShader || !fragmentShader) {
        console.error("Failed to compile shaders.");
    } else {
        // Link Program
        const shaderProgram = heroGl.createProgram();
        heroGl.attachShader(shaderProgram, vertexShader);
        heroGl.attachShader(shaderProgram, fragmentShader);
        heroGl.linkProgram(shaderProgram);

        if (!heroGl.getProgramParameter(shaderProgram, heroGl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + heroGl.getProgramInfoLog(shaderProgram));
        } else {
            // Use Program
            heroGl.useProgram(shaderProgram);

            // Attributes & Uniforms
            const positionAttributeLocation = heroGl.getAttribLocation(shaderProgram, 'aVertexPosition');
            const resolutionLoc = heroGl.getUniformLocation(shaderProgram, "u_resolution");
            const timeLoc = heroGl.getUniformLocation(shaderProgram, "u_time");
            const colorLoc = heroGl.getUniformLocation(shaderProgram, "u_color");
            const mouseLoc = heroGl.getUniformLocation(shaderProgram, "u_mouse");
            const speedLoc = heroGl.getUniformLocation(shaderProgram, "u_speed");

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

            // Mouse State
            let mouseX = 0;
            let mouseY = 0;
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX / window.innerWidth;
                mouseY = 1.0 - (e.clientY / window.innerHeight);
            });

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

                heroGl.clearColor(0.0, 0.0, 0.0, 0.0); // Transparent background
                heroGl.clear(heroGl.COLOR_BUFFER_BIT);

                heroGl.enableVertexAttribArray(positionAttributeLocation);
                heroGl.bindBuffer(heroGl.ARRAY_BUFFER, positionBuffer);
                heroGl.vertexAttribPointer(positionAttributeLocation, 2, heroGl.FLOAT, false, 0, 0);

                // Update Uniforms
                heroGl.uniform2f(resolutionLoc, heroCanvas.width, heroCanvas.height);
                heroGl.uniform1f(timeLoc, time);
                // Hero Color: Cyan/Blue/Purple mix (passed as base color)
                heroGl.uniform3f(colorLoc, 0.2, 0.4, 1.0);
                heroGl.uniform2f(mouseLoc, mouseX, mouseY);
                heroGl.uniform1f(speedLoc, 0.5);

                heroGl.drawArrays(heroGl.TRIANGLE_STRIP, 0, 4);

                requestAnimationFrame(render);
            }
            requestAnimationFrame(render);
        }
    }
}
