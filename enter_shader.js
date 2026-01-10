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

    // Fragment Shader - Boston Dynamics Style / Robotic Raymarching
    const fsSource = `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;

        // Colors
        const vec3 COLOR_YELLOW = vec3(0.99, 0.85, 0.05); // BD Yellow
        const vec3 COLOR_GRAPHITE = vec3(0.15, 0.15, 0.18);
        const vec3 COLOR_WHITE = vec3(0.9, 0.9, 0.95);
        const vec3 COLOR_SENSOR = vec3(0.0, 0.8, 1.0); // Cyan sensor glow

        // Constants
        const int MAX_STEPS = 100;
        const float MAX_DIST = 100.0;
        const float SURF_DIST = 0.001;

        // Rotation Matrix
        mat2 rot(float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
        }

        // SDF Primitives
        float sdBox(vec3 p, vec3 b) {
            vec3 q = abs(p) - b;
            return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
        }
        
        float sdCappedCylinder(vec3 p, float h, float r) {
            vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
            return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        float sdTorus(vec3 p, vec2 t) {
            vec2 q = vec2(length(p.xz) - t.x, p.y);
            return length(q) - t.y;
        }

        // Scene Description
        float GetDist(vec3 p) {
            float d = MAX_DIST;

            // Global Animation
            float t = uTime * 2.0;

            // --- The Robot Head / Sensor Unit ---
            vec3 pHead = p;
            
            // Bobbing motion
            pHead.y -= sin(uTime) * 0.1;
            
            // Complex Rotation (Scanning)
            pHead.xz *= rot(sin(uTime * 0.5) * 0.5);
            
            // 1. Main Housing (Yellow Box)
            float housing = sdBox(pHead, vec3(0.6, 0.4, 0.8));
            // Chamfer edges slightly (subtraction/intersection hack or just combine)
            housing -= 0.05; // Rounding
            
            // 2. Front Face Plate (Graphite)
            vec3 pFace = pHead;
            pFace.z -= 0.8;
            float face = sdBox(pFace, vec3(0.55, 0.35, 0.1));
            
            // 3. Sensor "Eye" (Cylinder hole)
            vec3 pEye = pHead;
            pEye.z -= 0.85;
            float eye = sdCappedCylinder(pEye.xzy, 0.1, 0.25); // Rotate to face forward
            
            // 4. Side Rotors (Graphite Cylinders)
            vec3 pRotor = pHead;
            pRotor.x = abs(pRotor.x) - 0.7; // Mirror symmetry
            float rotor = sdCappedCylinder(pRotor.yxz, 0.2, 0.35); // Sideways cylinders
            
            // 5. Connectors
            float conn = sdBox(pRotor, vec3(0.2, 0.1, 0.1));

            // Combine Shapes
            d = housing;
            d = max(d, -eye); // Cut out eye hole
            d = min(d, rotor);
            d = min(d, face);
            
            // 6. Sensor Globe (inside the hole)
            float globe = length(pEye) - 0.18;
            d = min(d, globe);

            return d;
        }

        // Material ID system (simplified for this shader)
        // 1 = Yellow Housing
        // 2 = Dark Graphite
        // 3 = Sensor Glow
        int GetMat(vec3 p) {
             // Re-calculate local coords (optimized: duplicate logic for coloring)
             // Ideally we pass this out from GetDist but this is WebGL 1.0 safe
             
             vec3 pHead = p;
             pHead.y -= sin(uTime) * 0.1;
             pHead.xz *= rot(sin(uTime * 0.5) * 0.5);
             
             vec3 pEye = pHead; 
             pEye.z -= 0.85;
             
             if (length(pEye) < 0.2) return 3; // Sensor
             
             vec3 pRotor = pHead;
             pRotor.x = abs(pRotor.x) - 0.7;
             if (sdCappedCylinder(pRotor.yxz, 0.21, 0.36) < 0.01) return 2; // Rotors (slightly larger check)
             
             vec3 pFace = pHead;
             pFace.z -= 0.8;
             if (sdBox(pFace, vec3(0.56, 0.36, 0.11)) < 0.01) return 2; // Face plate
             
             return 1; // Default housing
        }

        // Raymarching Loop
        float RayMarch(vec3 ro, vec3 rd) {
            float dO = 0.0;
            for(int i = 0; i < MAX_STEPS; i++) {
                vec3 p = ro + rd * dO;
                float dS = GetDist(p);
                dO += dS;
                if(dO > MAX_DIST || dS < SURF_DIST) break;
            }
            return dO;
        }

        // Calculate Normal
        vec3 GetNormal(vec3 p) {
            float d = GetDist(p);
            vec2 e = vec2(0.01, 0.0);
            vec3 n = d - vec3(
                GetDist(p - e.xyy),
                GetDist(p - e.yxy),
                GetDist(p - e.yyx)
            );
            return normalize(n);
        }

        // Lighting & Shading
        vec3 GetLight(vec3 p, vec3 n, vec3 rd) {
            int mat = GetMat(p);
            
            // Base Color
            vec3 albedo = COLOR_YELLOW;
            if (mat == 2) albedo = COLOR_GRAPHITE;
            if (mat == 3) albedo = COLOR_SENSOR;
            
            // Lighting positions
            vec3 lightPos1 = vec3(2.0, 4.0, -3.0);
            vec3 lightPos2 = vec3(-3.0, 2.0, -2.0);
            
            vec3 l1 = normalize(lightPos1 - p);
            vec3 l2 = normalize(lightPos2 - p);
            
            // Diffuse
            float dif1 = clamp(dot(n, l1), 0.05, 1.0);
            float dif2 = clamp(dot(n, l2), 0.0, 1.0) * 0.5; // Fill light
            
            // Specular
            vec3 r1 = reflect(-l1, n);
            float spec1 = pow(clamp(dot(r1, -rd), 0.0, 1.0), 32.0);
            // Plastic vs Metal specularity
            if (mat == 1) spec1 *= 0.5; // Plastic-y paint
            if (mat == 2) spec1 *= 0.2; // Rubber/Graphite
            
            // Sensor Glow
            if (mat == 3) {
                return COLOR_SENSOR * 2.0 + sin(uTime * 10.0) * 0.5; 
            }

            // Ambient
            vec3 ambient = vec3(0.1) * albedo;
            
            vec3 color = ambient + albedo * (dif1 + dif2) + vec3(1.0) * spec1;
            
            // Rim Light (Fresnel)
            float rim = 1.0 - max(dot(n, -rd), 0.0);
            rim = smoothstep(0.6, 1.0, rim);
            color += rim * 0.2 * COLOR_WHITE;
            
            return color;
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;

            // Camera System
            vec3 ro = vec3(0.0, 0.5, -3.5); // Camera Position
            vec3 lookAt = vec3(0.0, 0.0, 0.0);
            float zoom = 1.0;
            
            vec3 f = normalize(lookAt - ro);
            vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
            vec3 u = cross(f, r);
            vec3 rd = normalize(f * zoom + r * uv.x + u * uv.y);

            // Render
            float d = RayMarch(ro, rd);
            
            vec3 color = vec3(0.05, 0.05, 0.06); // Dark background
            
            // Background Grid (Infinite Floor)
            if (d > MAX_DIST) {
                // Plane intersection
                float t = -(ro.y + 1.5) / rd.y; // Floor at y = -1.5
                if (t > 0.0) {
                     vec3 pPlane = ro + rd * t;
                     // Grid pattern
                     vec2 g = abs(fract(pPlane.xz) - 0.5);
                     float gridLine = smoothstep(0.48, 0.5, max(g.x, g.y));
                     
                     // Distance fade
                     float fade = smoothstep(5.0, 0.0, length(pPlane.xz));
                     color += vec3(0.2) * gridLine * fade;
                }
            } else {
                vec3 p = ro + rd * d;
                vec3 n = GetNormal(p);
                color = GetLight(p, n, rd);
            }

            // --- HUD Overlays ---
            
            // 1. Scanlines
            color -= sin(gl_FragCoord.y * 0.5 + uTime * 5.0) * 0.02;
            
            // 2. LiDAR Points (Randomized dots in space sense)
            // Just a 2D overlay effect for style
            float lidar = 0.0;
            vec2 gridPos = fract(uv * 20.0 - vec2(uTime * 0.1, 0.0));
            if (length(gridPos - 0.5) < 0.1 && mod(floor(uv.x * 20.0), 3.0) == 0.0) {
                lidar = 0.5;
            }
            // Sweep scan
            float sweep = smoothstep(0.0, 0.1, abs(uv.y - sin(uTime) * 0.8));
            lidar *= (1.0 - sweep);
            color += vec3(1.0, 0.0, 0.0) * lidar * 0.5;


            // Vignette
            float vign = smoothstep(1.5, 0.5, length(uv));
            color *= vign;
            
            // Gamma Correction
            color = pow(color, vec3(0.4545));

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
    }
}
