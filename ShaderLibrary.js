/**
 * ShaderLibrary.js
 * Contains the fragment shader source code for various visual effects.
 * All shaders share a common set of uniforms:
 * - u_resolution (vec2)
 * - u_time (float)
 * - u_mouse (vec2) - Normalized 0-1
 * - u_color (vec3)
 * - u_speed (float)
 */

const ShaderLibrary = {
    // --- Common Vertex Shader ---
    vertex: `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `,

    // --- Tech Noise 3D (Volumetric Noise Cloud) ---
    TechNoise: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform float u_speed;

        float hash(vec3 p) {
            p = fract(p * 0.3183099 + 0.1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise3D(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            return mix(
                mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                    mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                    mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
                f.z);
        }

        float fbm3D(vec3 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for(int i = 0; i < 5; i++) {
                value += amplitude * noise3D(p);
                p *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
            
            float t = u_time * u_speed * 0.2;
            
            // Ray direction
            vec3 rd = normalize(vec3(uv, 1.0));
            vec3 ro = vec3(0.0, 0.0, t);
            
            // Volumetric raymarch through noise
            float density = 0.0;
            float depth = 0.0;
            
            for(int i=0; i<32; i++) {
                vec3 p = ro + rd * depth;
                float n = fbm3D(p * 0.5);
                density += n * 0.1;
                depth += 0.2;
            }
            
            vec3 col = u_color * density;
            
            // Add some structure
            float structure = fbm3D(vec3(uv * 3.0, t * 0.5));
            col += u_color * structure * 0.3;
            
            gl_FragColor = vec4(col, 1.0);
        }
    `,

    // --- Cyber Grid 3D (Raymarched Infinite Grid) ---
    CyberGrid: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform float u_speed;

        mat2 rot(float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
        }

        float sdBox(vec3 p, vec3 b) {
            vec3 q = abs(p) - b;
            return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
        }

        float GetDist(vec3 p) {
            // Infinite grid of boxes
            vec3 q = p;
            q.xz = mod(q.xz + 2.0, 4.0) - 2.0; // Repeat in XZ
            
            float box = sdBox(q, vec3(0.3, 0.1, 0.3));
            
            // Floor plane
            float floor = p.y + 0.5;
            
            return min(box, floor);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
            
            float t = u_time * u_speed;
            
            // Camera
            vec3 ro = vec3(0.0, 2.0, -t * 3.0);
            vec3 rd = normalize(vec3(uv, 1.0));
            rd.xz *= rot(-0.3); // Tilt down
            
            // Raymarch
            float dO = 0.0;
            vec3 col = vec3(0.0);
            
            for(int i=0; i<64; i++) {
                vec3 p = ro + rd * dO;
                float dS = GetDist(p);
                dO += dS;
                
                if(dS < 0.01) {
                    // Hit - add glow based on distance
                    col = u_color / (1.0 + dO * 0.1);
                    break;
                }
                if(dO > 50.0) break;
            }
            
            // Add fog/atmosphere
            col += u_color * 0.05 / (1.0 + length(uv));
            
            gl_FragColor = vec4(col, 1.0);
        }
    `,

    // --- Digital Rain 3D (Matrix Code Tunnel) ---
    DigitalRain: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform float u_speed;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
            
            float t = u_time * u_speed;
            
            // Create cylindrical coordinates
            float r = length(uv);
            float a = atan(uv.y, uv.x);
            
            // Map to 3D tunnel
            float z = 1.0 / r + t;
            
            // Grid cells
            float cols = 20.0;
            vec2 cell = vec2(a * cols / 6.28, z * 5.0);
            vec2 cellId = floor(cell);
            
            // Character drop
            float dropSpeed = hash(vec2(cellId.x, 0.0)) * 0.5 + 0.5;
            float dropPos = fract(cellId.y * 0.1 - t * dropSpeed);
            
            // Trail effect
            float trail = smoothstep(0.0, 0.3, dropPos) * smoothstep(1.0, 0.7, dropPos);
            
            // Character flicker
            float charFlicker = step(0.5, hash(cellId + floor(t * 10.0)));
            
            // Combine
            float intensity = trail * charFlicker;
            
            // Add depth fade
            intensity *= 1.0 / (1.0 + r * 2.0);
            
            vec3 col = u_color * intensity;
            
            // Bright head
            if(dropPos > 0.9) col += vec3(1.0) * intensity;
            
            gl_FragColor = vec4(col, 1.0);
        }
    `,

    // --- Pulse Wave ---
    PulseWave: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform vec2 u_mouse; // 0-1 normalized
        uniform float u_speed;

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            float aspect = u_resolution.x / u_resolution.y;
            st.x *= aspect;
            
            vec2 center = vec2(0.5 * aspect, 0.5);
            
            // If mouse is active (assume > 0 coordinate), use it. 
            // In a real app we might want a 'u_hasMouse' flag or similar, 
            // but checking length is a cheap hack if (0,0) is rare.
            if (length(u_mouse) > 0.0) {
                 center = u_mouse;
                 center.x *= aspect;
            }

            vec2 distVec = st - center;
            float dist = length(distVec);

            float t = u_time * u_speed;
            
            // Concentric waves
            float wave = sin(dist * 20.0 - t * 5.0);
            
            // Sharpen wave
            wave = smoothstep(0.0, 0.1, wave) - smoothstep(0.1, 0.2, wave);
            
            // Decay
            float attenuation = 1.0 / (1.0 + dist * 5.0);
            
            vec3 color = u_color * wave * attenuation;
            
            // Add a background glow
            color += u_color * 0.1 * (1.0 - dist);

            gl_FragColor = vec4(color, 1.0);
        }
    `,

    // --- Plasma Field 3D (Energy Sphere) ---
    PlasmaField: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform float u_speed;

        float sdSphere(vec3 p, float r) {
            return length(p) - r;
        }

        float GetDist(vec3 p) {
            float t = u_time * u_speed;
            
            // Pulsing sphere
            float sphere = sdSphere(p, 1.0 + sin(t * 2.0) * 0.2);
            
            // Add plasma distortion
            float distortion = sin(p.x * 3.0 + t) * sin(p.y * 3.0 + t) * sin(p.z * 3.0 + t) * 0.2;
            
            return sphere + distortion;
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
            
            float t = u_time * u_speed;
            
            // Camera
            vec3 ro = vec3(0.0, 0.0, -3.0);
            vec3 rd = normalize(vec3(uv, 1.0));
            
            // Raymarch
            float dO = 0.0;
            vec3 col = vec3(0.0);
            
            for(int i=0; i<64; i++) {
                vec3 p = ro + rd * dO;
                float dS = GetDist(p);
                
                // Accumulate glow
                float glow = 0.02 / (abs(dS) + 0.01);
                col += u_color * glow * 0.05;
                
                dO += dS * 0.5;
                if(dO > 10.0 || abs(dS) < 0.01) break;
            }
            
            // Add plasma waves
            float plasma = sin(uv.x * 5.0 + t) * sin(uv.y * 5.0 + t);
            col += u_color * plasma * 0.1;
            
            gl_FragColor = vec4(col, 1.0);
        }
    `,

    // --- Hero Core 3D (Raymarching) ---
    HeroCore3D: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform vec2 u_mouse;

        #define MAX_STEPS 100
        #define MAX_DIST 100.0
        #define SURF_DIST 0.01

        // Rotation matrix
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

        float sdOctahedron(vec3 p, float s) {
            p = abs(p);
            return (p.x + p.y + p.z - s) * 0.57735027;
        }

        // Scene Description
        float GetDist(vec3 p) {
            // Rotate the whole world slowly
            p.xz *= rot(u_time * 0.2);
            p.xy *= rot(u_time * 0.1);

            // Center Core (Octahedron)
            vec3 pCore = p;
            float scale = 1.0 + sin(u_time * 2.0) * 0.1; // Pulse
            float core = sdOctahedron(pCore, 1.2 * scale);

            // Orbiting rings/boxes
            vec3 pRing = p;
            pRing.xz *= rot(u_time);
            pRing.x -= 2.0; 
            float ringBox = sdBox(pRing, vec3(0.2, 0.5, 0.2));
            
            vec3 pRing2 = p;
            pRing2.yz *= rot(u_time * 1.5);
            pRing2.y -= 2.0;
            float ringBox2 = sdBox(pRing2, vec3(0.5, 0.2, 0.2));

            // Combine
            float d = min(core, min(ringBox, ringBox2));
            
            // Cutout effect (Boolean sub)
            float cutout = sdBox(p, vec3(20.0, 0.1, 0.1));
            d = max(d, -cutout);

            return d;
        }

        float RayMarch(vec3 ro, vec3 rd) {
            float dO = 0.0;
            for(int i=0; i<MAX_STEPS; i++) {
                vec3 p = ro + rd * dO;
                float dS = GetDist(p);
                dO += dS;
                if(dO > MAX_DIST || dS < SURF_DIST) break;
            }
            return dO;
        }

        vec3 GetNormal(vec3 p) {
            float d = GetDist(p);
            vec2 e = vec2(0.01, 0.0);
            vec3 n = d - vec3(
                GetDist(p-e.xyy),
                GetDist(p-e.yxy),
                GetDist(p-e.yyx)
            );
            return normalize(n);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

            // Camera System
            vec3 ro = vec3(0.0, 0.0, -5.0); // Camera origin
            vec3 rd = normalize(vec3(uv.x, uv.y, 1.0)); // Ray direction

            float d = RayMarch(ro, rd);

            vec3 col = vec3(0.0);

            if(d < MAX_DIST) {
                vec3 p = ro + rd * d;
                vec3 n = GetNormal(p);
                vec3 r = reflect(rd, n);

                // Lighting
                vec3 lightPos = vec3(2.0, 4.0, -3.0);
                // Rotate light
                lightPos.xz *= rot(u_time);
                
                vec3 l = normalize(lightPos - p);
                
                // Diffuse
                float dif = clamp(dot(n, l), 0.0, 1.0);
                
                // Specular
                float spec = pow(max(dot(r, l), 0.0), 32.0);

                // Base Color logic
                vec3 baseColor = u_color;
                // Add some variation based on position
                baseColor += cos(p * 2.0 + u_time) * 0.2;

                col = baseColor * dif + vec3(1.0) * spec;
                
                // Fresnel rim
                float fresnel = pow(1.0 + dot(rd, n), 4.0);
                col += fresnel * vec3(0.5, 0.8, 1.0);
            }

            // Glow / Fog
            col += vec3(0.1, 0.2, 0.4) * (0.05 / (0.01 + length(uv)));
            
            // Gamma correction
            col = pow(col, vec3(0.4545));

            gl_FragColor = vec4(col, 1.0);
        }
    `,

    // --- Cyber Tunnel 3D ---
    CyberTunnel3D: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform float u_speed;

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
            
            // Camera movement
            float time = u_time * u_speed;
            
            // Polar coordinates
            float r = length(uv);
            float a = atan(uv.y, uv.x);
            
            // Tunnel distortion
            float z = 1.0 / r + time;
            
            // Grid texture
            float check = step(0.5, fract(z * 5.0)) * step(0.5, fract(a * 3.0 / 3.14159));
            
            // Color mapping
            vec3 col = u_color * (1.0 / r); // Glow center
            
            // Grid lines
            float grid = sin(z * 10.0) * sin(a * 10.0);
            col += u_color * smoothstep(0.8, 1.0, grid);
            
            // Darken center hole
            col *= smoothstep(0.0, 0.5, r);
            
            // Add some "data stream" particles
            float stream = sin(z * 20.0 - time * 5.0 + a * 5.0);
            col += vec3(1.0) * smoothstep(0.95, 1.0, stream) * r;

            gl_FragColor = vec4(col, 1.0);
        }
    `,

    // --- Holo Engine 3D ---
    HoloEngine3D: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;

        mat2 rot(float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
        }

        float sdCappedCylinder(vec3 p, float h, float r) {
            vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
            return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        float GetDist(vec3 p) {
            p.yz *= rot(0.5); // Tilt to view better
            p.xz *= rot(u_time * 0.5);
            
            // V8 Engine Block approximation (2 cylinders V-shape)
            vec3 p1 = p;
            p1.x -= 0.8;
            p1.xy *= rot(0.7); // V angle
            float cyl1 = sdCappedCylinder(p1, 1.5, 0.5);

            vec3 p2 = p;
            p2.x += 0.8;
            p2.xy *= rot(-0.7); // V angle
            float cyl2 = sdCappedCylinder(p2, 1.5, 0.5);
            
            return min(cyl1, cyl2);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
            
            vec3 ro = vec3(0.0, 0.0, -4.0);
            vec3 rd = normalize(vec3(uv, 1.0));
            
            // Raymarch
            float d = 0.0;
            float t = 0.0;
            vec3 p = ro;
            float hit = 0.0;
            
            // Accumulate glow (volumetric feel)
            float glow = 0.0;
            
            for(int i=0; i<64; i++) {
                p = ro + rd * t;
                d = GetDist(p);
                
                // Hologram edge detection (if close to surface, add glow)
                float edge = max(0.0, (0.1 - abs(d)));
                glow += edge * 0.1;

                if(d < 0.01 || t > 20.0) break;
                t += d * 0.8; // Slower steps for better glow
            }

            vec3 col = vec3(0.0);
            
            // Scanline / Hologram interference
            float scan = sin(p.y * 50.0 + u_time * 10.0) * 0.5 + 0.5;
            
            if(t < 20.0) {
                // Surface hit coloring
                col = u_color * 0.5;
                col += u_color * scan * 0.5;
            }
            
            // Add volumetric glow
            col += u_color * glow * 0.5;

            // Fade edges
            col *= 1.0 - length(uv) * 0.5;

            gl_FragColor = vec4(col, 1.0);
        }
    `
};

window.ShaderLibrary = ShaderLibrary;

