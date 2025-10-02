function initializePanelShader(canvas, options) {
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error(`WebGL not supported for canvas: ${canvas.id}`);
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
        uniform vec3 u_color;
        uniform float u_speed;

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            float t = u_time * u_speed;

            // Create a grid
            float grid = 0.0;
            grid += step(0.99, sin(uv.x * 20.0 + t));
            grid += step(0.99, sin(uv.y * 20.0 + t));

            vec3 finalColor = u_color * grid;

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

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
        console.error(`Failed to create shaders for canvas: ${canvas.id}`);
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");
    const colorUniformLocation = gl.getUniformLocation(program, "u_color");
    const speedUniformLocation = gl.getUniformLocation(program, "u_speed");

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

    let startTime = performance.now();
    const render = (currentTime) => {
        const elapsedTime = (currentTime - startTime) * 0.001;

        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        gl.uniform1f(timeUniformLocation, elapsedTime);
        gl.uniform3fv(colorUniformLocation, options.color || [0.0, 0.8, 1.0]);
        gl.uniform1f(speedUniformLocation, options.speed || 1.0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
}
