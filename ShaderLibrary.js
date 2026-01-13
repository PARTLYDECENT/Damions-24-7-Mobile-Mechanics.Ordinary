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

    // --- Dancing Tiles (Bouncing Cube Grid) ---
    DancingTiles: `
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
            // Repetitive domain
            vec3 q = p;
            
            // Grid ID for randomizing motion
            vec2 id = floor((q.xz + 2.0) / 4.0);
            
            q.xz = mod(q.xz + 2.0, 4.0) - 2.0; 
            
            // Dancing Motion: Height varies with time and position
            float dance = sin(u_time * 2.0 + id.x * 2.1 + id.y * 3.3) * 0.5;
            q.y -= dance;
            
            // Rotate each tile based on global pos
            q.xz *= rot(sin(u_time + length(id)) * 0.5);

            float box = sdBox(q, vec3(0.5, 0.1, 0.5)); // Widen scale
            
            return box;
        }

        vec3 GetNormal(vec3 p) {
            float d = GetDist(p);
            vec2 e = vec2(0.01, 0.0);
            return normalize(d - vec3(
                GetDist(p - e.xyy),
                GetDist(p - e.yxy),
                GetDist(p - e.yyx)
            ));
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
            float t = u_time * u_speed;
            
            // Camera moving forward
            vec3 ro = vec3(0.0, 5.0, -t * 5.0);
            vec3 rd = normalize(vec3(uv, 1.0));
            rd.yz *= rot(0.5); // Look down
            
            float dO = 0.0;
            vec3 col = vec3(0.0);
            
            for(int i=0; i<64; i++) {
                vec3 p = ro + rd * dO;
                float dS = GetDist(p);
                dO += dS;
                
                if(dS < 0.01) {
                    vec3 n = GetNormal(p);
                    // Light from cursor direction concept or swirling light
                    vec3 l = normalize(vec3(sin(t), 2.0, cos(t)));
                    float dif = max(dot(n, l), 0.1);
                    col = u_color * dif;
                    
                    // Rim/Neon Edge
                    float rim = 1.0 - max(dot(n, -rd), 0.0);
                    col += pow(rim, 3.0) * vec3(1.0, 1.0, 1.0);
                    
                    break;
                }
                if(dO > 100.0) {
                     // Background/Void
                     col = vec3(0.05, 0.05, 0.1) * (1.0 - uv.y);
                     break;
                }
            }
            
            // Fog
            col = mix(col, vec3(0.05, 0.05, 0.1), smoothstep(0.0, 80.0, dO));
            
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

    // --- Hero Core 3D (Quantum Foam - Optimized) ---
    HeroCore3D: `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform vec2 u_mouse;

        // Fast hash
        float hash12(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float hash13(vec3 p) {
            return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }

        vec3 hash33(vec3 p) {
            p = fract(p * vec3(0.1031, 0.1030, 0.0973));
            p += dot(p, p.yxz + 19.19);
            return fract((p.xxy + p.yxx) * p.zyx);
        }

        // Simplified 2D Voronoi (much faster than 3D)
        float voronoi2D(vec2 p) {
            vec2 cell = floor(p);
            vec2 frac = fract(p);
            
            float minDist = 1.0;
            
            for(int x = -1; x <= 1; x++) {
                for(int y = -1; y <= 1; y++) {
                    vec2 neighbor = vec2(float(x), float(y));
                    vec2 point = hash33(vec3(cell + neighbor, 0.0)).xy;
                    point = 0.5 + 0.4 * sin(u_time * 0.3 + 6.28 * point);
                    
                    vec2 diff = neighbor + point - frac;
                    float dist = length(diff);
                    minDist = min(minDist, dist);
                }
            }
            
            return minDist;
        }

        // Simplified particle field (fewer particles)
        float particles(vec3 p, float t) {
            float intensity = 0.0;
            
            // Only 12 particles instead of 32
            for(int i = 0; i < 12; i++) {
                float fi = float(i);
                vec3 seed = vec3(fi * 0.1, fi * 0.2, fi * 0.3);
                vec3 particlePos = hash33(seed) * 8.0 - 4.0;
                particlePos += sin(t * 0.5 + seed * 6.28) * 1.5;
                
                float dist = length(p - particlePos);
                intensity += 0.08 / (dist * dist + 0.02);
            }
            
            return intensity;
        }

        // Simple energy waves
        float energyField(vec3 p, float t) {
            return sin(p.x * 2.0 + t * 2.0) * cos(p.y * 2.0 - t * 1.5) * sin(p.z * 2.0 + t);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
            
            float t = u_time * 0.5;
            
            // Simple ray setup
            vec3 rayDir = normalize(vec3(uv, 1.5));
            vec3 rayOrigin = vec3(0.0, 0.0, t * 2.0);
            
            vec3 col = vec3(0.0);
            float depth = 0.0;
            
            // Reduced iterations: 32 instead of 64
            for(int i = 0; i < 32; i++) {
                vec3 p = rayOrigin + rayDir * depth;
                
                // Use 2D Voronoi on XY plane (much faster)
                float cellDist = voronoi2D(p.xy * 0.5 + p.z * 0.1);
                float cellGlow = smoothstep(0.15, 0.0, cellDist);
                
                // Particle field
                float particleGlow = particles(p, t) * 0.015;
                
                // Energy waves
                float energy = energyField(p, t);
                float energyGlow = smoothstep(0.6, 0.9, abs(energy)) * 0.3;
                
                // Simpler colors
                col += vec3(0.3, 0.6, 1.0) * cellGlow * 0.04;
                col += vec3(0.0, 1.0, 0.8) * particleGlow;
                col += vec3(1.0, 0.3, 0.8) * energyGlow * 0.06;
                
                depth += 0.2;
                if(depth > 8.0) break;
            }
            
            // Background
            col += vec3(0.05, 0.1, 0.2) * (1.0 - length(uv) * 0.5);
            
            // Occasional sparkles (cheaper check)
            if(hash12(floor(uv * 50.0) + t) > 0.995) {
                col += vec3(0.5);
            }
            
            // Vignette
            col *= 1.0 - length(uv) * 0.5;
            
            // Simple interference
            col += vec3(0.5, 0.7, 1.0) * sin(uv.x * 30.0 + t * 2.0) * sin(uv.y * 30.0 - t) * 0.015;
            
            // Boost blues
            col.b *= 1.15;
            
            // Tone map and gamma
            col = col / (1.0 + col);
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
    `,

    // --- Alien Habitat 3D (Bio-Mechanical Tunnel) ---
    AlienHabitat: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color;
        uniform float u_speed;
        uniform vec2 u_mouse;

        mat2 rot(float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
        }

        // Smooth min function for organic blending
        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
            return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
            // Twist the tunnel
            p.xy *= rot(p.z * 0.1);
            
            // Main tunnel shape (hexagonal-ish)
            vec3 q = p;
            q.xy *= rot(u_time * 0.1); // Slow rotation
            float angle = atan(q.y, q.x);
            float r = length(q.xy);
            // Hexagonal shaping
            float hex = cos(angle * 6.0 + p.z * 0.5) * 0.2; 
            float tunnel = 2.0 - r + hex;
            
            // Secondary structure (ribs)
            float ribs = sin(p.z * 4.0) * 0.1;
            
            // Organic bulbs/bumps
            float bulbs = length(fract(p * 0.5) - 0.5) - 0.2;
            
            // Combine
            float d = max(-tunnel, 0.0); // Inside the tunnel
            d = smin(d, bulbs, 0.2); // Blend bumps
            d += ribs * 0.5; // Add ribs
            
            // Floor flattening (optional, commented out)
            // d = smin(d, p.y + 1.2, 0.5);
            
            return d * 0.5; // Scale down for safety
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
            
            // Movement
            float t = u_time * u_speed * 1.5;
            vec3 ro = vec3(0.0, 0.0, t);
            vec3 rd = normalize(vec3(uv, 1.5)); // FOV 
            
            // Mouse look
            rd.yz *= rot((u_mouse.y - 0.5) * 1.0);
            rd.xz *= rot((u_mouse.x - 0.5) * 1.0);
            
            // Raymarch
            float d = 0.0;
            float totalDist = 0.0;
            vec3 p = ro;
            
            // Volumetric accumulation
            vec3 accumColor = vec3(0.0);
            
            for(int i = 0; i < 80; i++) {
                p = ro + rd * totalDist;
                d = map(p);
                
                // Fog/Glow accumulation based on distance from walls
                float glow = exp(-d * 3.0);
                accumColor += u_color * glow * 0.015;
                
                if(d < 0.002 || totalDist > 30.0) break;
                totalDist += d * 0.8;
            }
            
            // Surface lighting
            vec3 col = vec3(0.0);
            if(totalDist < 30.0) {
                // Normal calculation
                vec2 e = vec2(0.01, 0.0);
                vec3 n = normalize(vec3(
                    map(p + e.xyy) - map(p - e.xyy),
                    map(p + e.yxy) - map(p - e.yxy),
                    map(p + e.yyx) - map(p - e.yyx)
                ));
                
                // Lighting
                vec3 lightPos = ro + vec3(0.0, 0.0, 2.0); // Light attached to camera
                vec3 l = normalize(lightPos - p);
                float diff = max(0.0, dot(n, l));
                
                // Specular
                vec3 ref = reflect(-l, n);
                float spec = pow(max(0.0, dot(ref, -rd)), 16.0);
                
                // Fresnel
                float fresnel = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
                
                // Base material color
                col = u_color * 0.2 + diff * u_color * 0.5 + spec * vec3(1.0);
                col += fresnel * vec3(0.5, 0.8, 1.0) * 0.5;
            }
            
            // Blend surface with volumetric glow
            col += accumColor;
            
            // Distance fog
            col = mix(col, vec3(0.0), smoothstep(10.0, 30.0, totalDist));
            
            // Final adjustments
            // Vignette
            col *= 1.0 - length(uv) * 0.4;
            
            gl_FragColor = vec4(col, 1.0);
        }
    `
};

window.ShaderLibrary = ShaderLibrary;

