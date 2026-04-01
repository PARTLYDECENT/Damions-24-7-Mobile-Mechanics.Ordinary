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

    // Fragment Shader - FAST 2D ENGINE CORE
    const fsSource = `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uWarp; 

        // 2D Rotation
        mat2 rot(float a) {
            float s = sin(a), c = cos(a);
            return mat2(c, -s, s, c);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
            
            // Warp pushes the camera "in", so we scale UVs down as warp increases
            float zoom = 1.0 - (uWarp * 0.18); 
            uv *= zoom;
            
            // Spin the core based on time and warp
            vec2 p = uv * rot(uTime * 0.5 + uWarp * 2.0);
            
            float r = length(p);
            float a = atan(p.y, p.x);
            
            // Central glowing core
            float core = 0.05 / (r + 0.01);
            
            // Mechanical petals / aperture blades
            float blades = sin(a * 8.0 + uTime) * 0.1;
            float aperture = smoothstep(0.3 + blades, 0.31 + blades, r);
            
            // Outer gear ring
            float gearTeeth = cos(a * 24.0) * 0.02;
            float gearRing = smoothstep(0.48 + gearTeeth, 0.5 + gearTeeth, r);
            gearRing -= smoothstep(0.55 + gearTeeth, 0.57 + gearTeeth, r);
            
            // Colors (Mechanic / Cyber theme)
            vec3 coreCol = vec3(0.0, 0.8, 1.0) * core; // Cyan core
            vec3 metalCol = vec3(0.2, 0.3, 0.4); // Dark metal
            
            vec3 col = coreCol;
            col = mix(col, vec3(0.05), aperture); // Dark inside aperture
            col = mix(col, metalCol * (0.8 + 0.2 * sin(r * 50.0)), gearRing > 0.0 ? 1.0 : 0.0); // Metallic ring
            
            // High-Tech Cartesian grid
            vec2 gridUV = uv * 6.0;
            vec2 grid = abs(fract(gridUV - 0.5) - 0.5) / 0.05;
            float gridLines = 1.0 - min(grid.x, grid.y);
            col += vec3(0.0, 0.6, 1.0) * smoothstep(0.9, 1.0, gridLines) * 0.25 * (1.0 - r);
            
            // White out on max warp
            col = mix(col, vec3(1.0), smoothstep(4.0, 5.0, uWarp));
            
            // Alpha handling
            float alpha = smoothstep(0.0, 0.4, r) + core * 0.5;
            alpha = max(alpha, smoothstep(4.0, 5.0, uWarp));
            alpha = clamp(alpha, 0.0, 1.0);

            gl_FragColor = vec4(col, alpha);
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

    if (vertexShader && fragmentShader) {
        // Link Program
        const shaderProgram = enterGl.createProgram();
        enterGl.attachShader(shaderProgram, vertexShader);
        enterGl.attachShader(shaderProgram, fragmentShader);
        enterGl.linkProgram(shaderProgram);

        if (!enterGl.getProgramParameter(shaderProgram, enterGl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + enterGl.getProgramInfoLog(shaderProgram));
        } else {
            // Use Program
            enterGl.useProgram(shaderProgram);

            // Attributes & Uniforms
            const positionAttributeLocation = enterGl.getAttribLocation(shaderProgram, 'aVertexPosition');
            const timeUniformLocation = enterGl.getUniformLocation(shaderProgram, 'uTime');
            const resolutionUniformLocation = enterGl.getUniformLocation(shaderProgram, 'uResolution');
            const warpUniformLocation = enterGl.getUniformLocation(shaderProgram, 'uWarp');

            let warpValue = 0.0;
            window.triggerIntroWarp = () => {
                const startTime = performance.now();
                const animateWarp = (now) => {
                    const elapsed = (now - startTime) / 1000;
                    warpValue = Math.min(elapsed * 2.0, 5.0); // Ramp up warp to 5.0
                    if (elapsed < 2.0) requestAnimationFrame(animateWarp);
                };
                requestAnimationFrame(animateWarp);
            };

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

                enterGl.clearColor(0.0, 0.0, 0.0, 0.0);
                enterGl.clear(enterGl.COLOR_BUFFER_BIT);

                enterGl.enableVertexAttribArray(positionAttributeLocation);
                enterGl.bindBuffer(enterGl.ARRAY_BUFFER, positionBuffer);
                enterGl.vertexAttribPointer(positionAttributeLocation, 2, enterGl.FLOAT, false, 0, 0);

                enterGl.uniform1f(timeUniformLocation, time);
                enterGl.uniform2f(resolutionUniformLocation, enterCanvas.width, enterCanvas.height);
                if (warpUniformLocation) enterGl.uniform1f(warpUniformLocation, warpValue);

                enterGl.drawArrays(enterGl.TRIANGLE_STRIP, 0, 4);

                requestAnimationFrame(render);
            }
            requestAnimationFrame(render);
        }
    }
}
