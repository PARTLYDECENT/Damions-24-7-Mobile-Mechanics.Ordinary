const rainCanvas = document.getElementById('rain-canvas');
const rainGl = rainCanvas.getContext('webgl');

if (!rainGl) {
    console.error('WebGL not supported for Rain');
} else {
    // Vertex Shader
    const vsSource = `
        attribute vec4 aVertexPosition;
        void main() {
            gl_Position = aVertexPosition;
        }
    `;

    // Fragment Shader - Realistic Rain
    const fsSource = `
        precision mediump float;
        uniform float uTime;
        uniform vec2 uResolution;

        // Random function
        float rand(vec2 n) { 
            return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        // Noise function
        float noise(vec2 p){
            vec2 ip = floor(p);
            vec2 u = fract(p);
            u = u*u*(3.0-2.0*u);
            
            float res = mix(
                mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
                mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
            return res*res;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uResolution.xy;
            uv.x *= uResolution.x / uResolution.y;

            float t = uTime * 0.5;
            
            float rainAmount = 0.0;
            
            // Multiple layers of rain for depth
            for(float i = 1.0; i <= 3.0; i++){
                // Scale UVs for different layers (parallax)
                vec2 st = uv * (10.0 * i);
                
                // Animate rain falling
                st.y += t * (10.0 + i * 5.0);
                
                // Add some wind/drift
                st.x += t * 0.5;

                // Create random streaks
                vec2 id = floor(st);
                st = fract(st);
                
                // Randomize drop length and position
                float n = rand(id);
                
                // Only draw drops in some cells
                if(n > 0.7) { // Even higher density (was 0.8)
                    // Drop shape - Make them THICKER
                    float drop = smoothstep(0.8, 1.0, 1.0 - abs(st.x - 0.5) * 5.0); // Much wider
                    drop *= smoothstep(0.0, 1.0, st.y); // Fade tail
                    drop *= smoothstep(1.0, 0.0, st.y); // Fade head
                    
                    // Boost intensity
                    rainAmount += drop * (1.5 / i); // Much brighter
                }
            }

            // Color: Bright Cyan/Red mix
            vec3 rainColor = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.2, 0.2), 0.5);
            
            // Hard clamp alpha to make sure it's visible
            float alpha = clamp(rainAmount * 2.0, 0.0, 1.0);
            
            vec4 finalColor = vec4(rainColor * alpha, alpha);

            gl_FragColor = finalColor;
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

    const vertexShader = compileShader(rainGl, vsSource, rainGl.VERTEX_SHADER);
    const fragmentShader = compileShader(rainGl, fsSource, rainGl.FRAGMENT_SHADER);

    // Link Program
    const shaderProgram = rainGl.createProgram();
    rainGl.attachShader(shaderProgram, vertexShader);
    rainGl.attachShader(shaderProgram, fragmentShader);
    rainGl.linkProgram(shaderProgram);

    if (!rainGl.getProgramParameter(shaderProgram, rainGl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + rainGl.getProgramInfoLog(shaderProgram));
    }

    // Use Program
    rainGl.useProgram(shaderProgram);

    // Attributes & Uniforms
    const positionAttributeLocation = rainGl.getAttribLocation(shaderProgram, 'aVertexPosition');
    const timeUniformLocation = rainGl.getUniformLocation(shaderProgram, 'uTime');
    const resolutionUniformLocation = rainGl.getUniformLocation(shaderProgram, 'uResolution');

    // Buffer
    const positionBuffer = rainGl.createBuffer();
    rainGl.bindBuffer(rainGl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1.0, 1.0,
        1.0, 1.0,
        -1.0, -1.0,
        1.0, -1.0,
    ];
    rainGl.bufferData(rainGl.ARRAY_BUFFER, new Float32Array(positions), rainGl.STATIC_DRAW);

    // Resize
    function resize() {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
        rainCanvas.width = window.innerWidth * pixelRatio;
        rainCanvas.height = window.innerHeight * pixelRatio;
        rainGl.viewport(0, 0, rainCanvas.width, rainCanvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    console.log("Rain Shader Initialized"); // Debug log

    // Render Loop
    function render(time) {
        time *= 0.001; // Convert to seconds

        rainGl.clearColor(0.0, 0.0, 0.0, 0.0); // Transparent background
        rainGl.clear(rainGl.COLOR_BUFFER_BIT);

        rainGl.enableVertexAttribArray(positionAttributeLocation);
        rainGl.bindBuffer(rainGl.ARRAY_BUFFER, positionBuffer);
        rainGl.vertexAttribPointer(positionAttributeLocation, 2, rainGl.FLOAT, false, 0, 0);

        rainGl.uniform1f(timeUniformLocation, time);
        rainGl.uniform2f(resolutionUniformLocation, rainCanvas.width, rainCanvas.height);

        // Enable blending for transparency
        rainGl.enable(rainGl.BLEND);
        rainGl.blendFunc(rainGl.SRC_ALPHA, rainGl.ONE_MINUS_SRC_ALPHA);

        rainGl.drawArrays(rainGl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
