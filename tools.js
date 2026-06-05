import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

let scene, camera, renderer, controls, model, composer, carPaintMaterial, dirLight, rimLight, mixer, animationClip, clock, glitchPass, uvCheckerTexture;
let pLight1, pLight2, pLight3, sparkles;
let normalsHelper = [];
let animatedMeshes = [];
let labyrinthPlanes = [];
let gridPositions = [];
let lastShuffleTime = 0;
let skyboxMesh, skyboxMaterial;
let videoElement, videoTexture;
let sound, audioLoader;
let musicPlaying = false;
let currentTrackIndex = 0;
const playlist = ['s2.1.mp3', 's2.3.mp3', 's2.4.mp3'];

// Ghost Truck
let ghostTruck;
let ghostTruckAngle = 0;

// Parade
let paradeGroup;
let paradeMeshes = [];
let paradeActive = false;

// TTS Narrator
let narratorTimer;
let voices = [];
const s2Facts = [
    // --- S2 Teasers ---
    "The S2 features a carbon steel chassis, the specific alloy details of which are yet to be fully disclosed.",
    "Unlike many modern supercars, the S2 is not a monocoque. It favors a robust, modular frame design.",
    "At the heart of the S2 lies a V-Twin engine, integrated seamlessly to lower the center of gravity.",
    "The S2 possesses a chimerical ability to absorb and adapt any engineering concept. We try everything.",
    "The S2's V-Twin integration pays homage to the raw, mechanical connection of early open-wheel racers.",
    "Carbon steel provides the S2 with a compliant yet rigid backbone, offering a different feel than brittle composites.",
    "We don't just build; we absorb concepts. The S2 is a chimera of the best automotive ideas from history.",
    "The S2 is a testbed for integrating disparate mechanical systems into one cohesive, high-speed unit.",

    // --- IndyCar History & Tech ---
    "The Offenhauser engine dominated American open-wheel racing for decades, winning the Indy 500 27 times.",
    "In 1967, the STP-Paxton Turbocar nearly won Indy with a turbine engine. The S2 shares that spirit of radical innovation.",
    "The 1994 Penske PC-23 used a secret Mercedes pushrod engine, the 500I, to dominate the Indy 500. It was developed in just 25 weeks.",
    "Ground effects were pioneered in IndyCar by the Chaparral 2K, using venturi tunnels to glue the car to the track.",
    "A.J. Foyt is the only driver to win the Indy 500 in both front and rear-engine cars. Adaptability is everything.",
    "The March 86C chassis won the Indy 500 five years in a row in the mid-80s. Consistency breeds legends.",
    "IndyCar engines in the 90s, like the Honda and Ford-Cosworth V8s, screamed at over 16,000 RPM.",
    "The 'Split' between CART and the IRL in 1996 changed the trajectory of American open-wheel racing forever.",
    "Modern IndyCars use the Dallara DW12 chassis, named in honor of the late Dan Wheldon.",
    "The aeroscreen, introduced in 2020, is a titanium-framed ballistic screen that can withstand a 2-pound object striking it at 220 mph.",
    "Rick Mears is one of only four drivers to win the Indy 500 four times, known as the 'Rocket' for his pole positions.",
    "The Indianapolis Motor Speedway is so large that the Vatican City, Yankee Stadium, the Rose Bowl, and the Roman Colosseum could all fit inside the oval.",
    "Methanol was the fuel of choice for decades in IndyCar before the switch to Ethanol blends for safety and sustainability.",
    "The Reynard 94I won on its debut at Surfers Paradise in 1994, starting a chassis dynasty that lasted for years.",
    "Active suspension was briefly tested in IndyCar before being banned, but the S2 explores similar concepts in its digital twin.",

    // --- Ford Racing Heritage ---
    "The Ford-Cosworth DFV is the most successful racing engine of all time, winning 155 Grands Prix and numerous IndyCar races.",
    "Ford's rivalry with Ferrari led to the GT40, which broke Ferrari's streak and won Le Mans four times in a row from 1966 to 1969.",
    "In 1965, Jim Clark won the Indy 500 in a Lotus 38 powered by a Ford V8, ending the era of the front-engine roadster.",
    "The Ford EcoBoost V6 in the Chip Ganassi Racing Riley DP car brought twin-turbo power back to endurance racing dominance.",
    "Ford's 'Cammer' 427 SOHC engine was banned from NASCAR for being too powerful, a badge of honor we respect.",
    "A.J. Foyt won his fourth Indy 500 in 1977 driving a Coyote chassis powered by a Ford V8.",
    "The Ford GTE program took the class win at Le Mans in 2016, exactly 50 years after their first overall victory.",

    // --- Chevy Racing Heritage ---
    "The Ilmor-built Chevy 265A V8, known as 'The Beast', was a pushrod engine designed specifically to exploit a loophole for the 1994 Indy 500.",
    "Chevrolet's Small Block V8 is the most produced engine in history and has won more races in American motorsport than any other.",
    "Corvette Racing has dominated the 24 Hours of Le Mans GT class for two decades, proving the reliability of the pushrod V8.",
    "The current IndyCar era features a battle between the Chevy 2.2-liter twin-turbo V6 and its Honda rival.",
    "Mark Donohue's 'Unfair Advantage' philosophy with the Penske-Chevy partnership set the standard for engineering dominance.",
    "The Chevy Monte Carlo is the winningest nameplate in NASCAR Cup Series history.",
    "In the late 80s, the Chevy Indy V8 powered legends like Rick Mears and Emerson Fittipaldi to Indy 500 victories.",
    "The C8.R Corvette uses a flat-plane crank V8, a departure from tradition that screams at high RPMs.",

    // --- Exotic & Engineering ---
    "Exotic cycle carts often utilize chromoly steel tubing for its high strength-to-weight ratio.",
    "The S2's suspension geometry is tuned to handle the unique physics of a lightweight, high-torque platform.",
    "We study the Lotus 56 turbine car not for its silence, but for its relentless, linear torque delivery.",
    "The principle of 'adding lightness', coined by Colin Chapman, is the guiding star of the S2's development.",
    "Aerodynamic efficiency isn't just about downforce; it's about drag reduction. The S2 slices the air like a scalpel.",
    "The S2 is designed to be a canvas for mechanical expression, much like the garage-built specials of the 1950s."
];

const loadingManager = new THREE.LoadingManager();
const loadingEl = document.getElementById('loading');
const loadingProgressEl = document.getElementById('loading-progress');

// --- Configuration ---
const params = {
    environment: 'Parking Lot',
    backgroundBlur: 0.5,
    exposure: 1.0,
    autoRotate: true,
    autoRotateSpeed: 0.25, // Halved speed
    paintColor: '#c0c0c0',
    bloom: true,
    bloomStrength: 0.3,
    wireframe: false,
    rimLightIntensity: 1.5,
    playAnimation: true,
    animationProgress: 0,
    explode: 0,
    glitch: false,
    colorCycle: false,
    discoLights: false,
    floorIsLava: false,
    cameraShake: false,
    xray: false,
    material: 'Standard',
    sparkles: false,
    vertexNoise: false,
    noiseAmount: 0.1,
    noiseSpeed: 0.5,
    noiseFreq: 1.0,
    showNormals: false,
    uvCheck: false,
    labyrinthMode: true,
    labyrinthSpeed: 0.5, // Slower default
    shuffleInterval: 3.0, // Slower shuffle
    // Parade Params
    paradeMode: false,
    paradeSpeed: 0.5,
    paradeSpread: 2.0,
    // Narrator Params
    narratorEnabled: false,
    narratorInterval: 15,
    narratorVolume: 0.8,
    // Skybox Params
    skyboxMode: true,
    dimensionScale: 1.5,
    timeScale: 0.2,
    alienIntensity: 1.5,
    colorShift: 0.0,
    // Video Skybox
    videoSkybox: 'None',
    // Music
    musicVolume: 0.5,
};

const environments = {
    'Parking Lot': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/parking_garage_1k.hdr',
    'Night Street': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/blouberg_sunrise_2_1k.hdr',
    'Studio': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr'
};
const envKeys = Object.keys(environments);

const videoOptions = ['None', 'sky1.mp4', 'sky2.mp4']; // Updated video list

const materials = {
    'Standard': { metalness: 0.9, roughness: 0.4 },
    'Chrome': { metalness: 1.0, roughness: 0.1 },
    'Matte': { metalness: 0.3, roughness: 0.8 },
};

initTTS();
init();
animate();

function init() {
    clock = new THREE.Clock();
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        loadingProgressEl.textContent = `${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
    };
    loadingManager.onLoad = () => {
        loadingEl.style.display = 'none';
    };

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); // Limited FOV (was 60)
    camera.position.set(15, 20, 25);

    const canvasContainer = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = 'none'; // Prevent scrolling on touch
    canvasContainer.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5; // Slower manual rotation
    controls.panSpeed = 0.5; // Slower manual panning
    controls.minDistance = 10; // More restricted zoom in
    controls.maxDistance = 60; // More restricted zoom out
    controls.target.set(0, 0, 0);
    controls.autoRotate = params.autoRotate;
    controls.autoRotateSpeed = params.autoRotateSpeed;

    updateEnvironment();
    createSkybox();
    setupLighting();
    createLabyrinthPlanes();
    setupAudio();

    loadModel('assets/models/zombie.glb');
    loadGhostTruck(); // Load Ghost Truck

    createSparkles();
    setupPostProcessing();
    createGUI();

    window.addEventListener('resize', onWindowResize);

    const startAudio = () => {
        if (!musicPlaying) {
            playNextTrack();
            musicPlaying = true;
        }
        if (videoElement) videoElement.play().catch(e => console.log("Video play failed:", e));

        window.removeEventListener('click', startAudio);
        window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);
}

function setupAudio() {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    sound = new THREE.Audio(listener);
    audioLoader = new THREE.AudioLoader(loadingManager);
    sound.setVolume(params.musicVolume);

    sound.onEnded = function () {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        playNextTrack();
    };
}

function playNextTrack() {
    if (!sound) return;
    const track = playlist[currentTrackIndex];
    const path = `assets/music/${track}`;

    audioLoader.load(path, function (buffer) {
        if (sound.isPlaying) sound.stop();
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(params.musicVolume);
        sound.play();
    }, undefined, function (err) {
        console.warn("Could not load music:", path);
    });
}

function createSkybox() {
    const geometry = new THREE.SphereGeometry(500, 64, 64);

    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `;

    const fragmentShader = `
        uniform float uTime;
        uniform float uScale;
        uniform float uTimeScale;
        uniform float uIntensity;
        uniform float uColorShift;
        varying vec3 vWorldPosition;

        // 4D Noise / Domain Warping
        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        float noise(vec3 x) {
            vec3 p = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            float n = p.x + p.y * 57.0 + 113.0 * p.z;
            return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                           mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                       mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                           mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
        }

        float fbm(vec3 p) {
            float f = 0.0;
            float amp = 0.5;
            for(int i=0; i<6; i++) {
                f += amp * noise(p);
                p *= 2.0;
                amp *= 0.5;
            }
            return f;
        }

        // Palette function (IQ style)
        vec3 palette(float t) {
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0, 1.0, 1.0);
            vec3 d = vec3(0.263, 0.416, 0.557) + uColorShift;
            return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
            vec3 dir = normalize(vWorldPosition);
            float time = uTime * uTimeScale;
            
            // Domain Warping
            vec3 p = dir * uScale + vec3(time * 0.1);
            float q = fbm(p);
            
            vec3 r = vec3(0.0);
            r.x = fbm(p + 1.0 * q + vec3(1.7, 9.2, 5.2) + 0.15 * time);
            r.y = fbm(p + 1.0 * q + vec3(8.3, 2.8, 1.1) + 0.126 * time);
            
            float f = fbm(p + r);

            // Color Mapping
            vec3 color = palette(f + q + time * 0.2);
            
            // Darken voids
            color *= pow(f, 0.5);
            
            // Add "stars" or digital artifacts
            float star = noise(dir * 100.0 + time);
            if (star > 0.98) color += vec3(1.0) * (star - 0.98) * 50.0;

            // Vignette/Atmosphere fade
            float horizon = abs(dir.y);
            color = mix(color, vec3(0.0), pow(1.0 - horizon, 5.0));

            gl_FragColor = vec4(color * uIntensity, 1.0);
        }
    `;

    skyboxMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uScale: { value: params.dimensionScale },
            uTimeScale: { value: params.timeScale },
            uIntensity: { value: params.alienIntensity },
            uColorShift: { value: params.colorShift }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    });

    skyboxMesh = new THREE.Mesh(geometry, skyboxMaterial);
    skyboxMesh.visible = params.skyboxMode;
    scene.add(skyboxMesh);
}

function updateSunPosition() {
    // No-op for this shader
}

function updateVideoSkybox() {
    if (params.videoSkybox === 'None') {
        if (videoElement) {
            videoElement.pause();
            videoElement = null;
        }
        scene.background = null;
        updateEnvironment();
        return;
    }

    if (skyboxMesh) skyboxMesh.visible = false;

    const videoPath = `assets/videos/${params.videoSkybox}`;

    if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.crossOrigin = 'anonymous';
    }

    videoElement.src = videoPath;
    videoElement.play().catch(e => console.warn("Video autoplay blocked, waiting for interaction"));

    videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = videoTexture;
    scene.environment = videoTexture;
}

function createLabyrinthPlanes() {
    labyrinthPlanes.forEach(plane => scene.remove(plane));
    labyrinthPlanes = [];
    gridPositions = [];

    // 20x20 Grid (5x larger)
    const rows = 20;
    const cols = 20;
    const planeSize = 0.8;
    const gap = 0.1;
    const spacing = planeSize + gap;
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = (c - (cols - 1) / 2) * spacing;
            const z = (r - (rows - 1) / 2) * spacing;
            gridPositions.push(new THREE.Vector3(x, -0.5, z));
        }
    }

    const textureLoader = new THREE.TextureLoader(loadingManager);

    const resumeImages = [
        '1776999258427.png', '1776999511555.png', '1777259613773.png',
        '1777564351688.png', '1777572580234.png', '1778046724946.png',
        '1779399993540.png', '1779556011960.png', '1779580347243.png',
        '1780363484428.png', '20260328_125701.jpg', '20260328_141456.jpg',
        '20260428_122303.jpg', '20260428_130811.jpg', '20260519_181438.jpg',
        '20260522_214511.jpg', '20260522_214516.jpg', '20260522_214518.jpg'
    ];

    for (let i = 0; i < gridPositions.length; i++) {
        const textureIndex = i % resumeImages.length;
        const texturePath = `assets/images/resume/${resumeImages[textureIndex]}`;
        const texture = textureLoader.load(texturePath);
        texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.5,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.receiveShadow = true;
        plane.castShadow = true;
        plane.rotation.x = -Math.PI / 2;

        plane.position.copy(gridPositions[i]);

        plane.userData = {
            id: i,
            currentGridIndex: i,
            targetGridIndex: i,
            startPos: gridPositions[i].clone(),
            targetPos: gridPositions[i].clone(),
            moveStartTime: 0,
            isMoving: false,
            moveDuration: 1.0
        };

        scene.add(plane);
        labyrinthPlanes.push(plane);
    }
}

function updateEnvironment() {
    if (params.videoSkybox !== 'None') return;

    if (params.skyboxMode) {
        scene.background = null;
        const rgbeLoader = new RGBELoader(loadingManager);
        rgbeLoader.load(environments[params.environment], (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
        });
        if (skyboxMesh) skyboxMesh.visible = true;
    } else {
        if (skyboxMesh) skyboxMesh.visible = false;
        const rgbeLoader = new RGBELoader(loadingManager);
        rgbeLoader.load(environments[params.environment], (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            scene.background = texture;
            scene.backgroundBlurriness = params.backgroundBlur;
        });
    }
}

function setupLighting() {
    dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(8, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    rimLight = new THREE.DirectionalLight(0xffffff, params.rimLightIntensity);
    rimLight.position.set(-5, 5, -10);
    scene.add(rimLight);

    pLight1 = new THREE.PointLight(0xff0000, 5, 10);
    pLight2 = new THREE.PointLight(0x00ff00, 5, 10);
    pLight3 = new THREE.PointLight(0x0000ff, 5, 10);
    pLight1.visible = pLight2.visible = pLight3.visible = false;
    scene.add(pLight1, pLight2, pLight3);
}

function loadModel(modelPath) {
    const loader = new GLTFLoader(loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    loader.load(modelPath, (gltf) => {
        model = gltf.scene;

        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        model.position.x -= center.x;
        model.position.z -= center.z;

        const scale = 6 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);

        model.updateMatrixWorld(true);

        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y -= box2.min.y;
        model.position.y += 0.5;

        normalsHelper = [];
        animatedMeshes = [];
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.originalMaterial = child.material;
                child.userData.originalPosition = child.position.clone();

                if (child.material.isMeshStandardMaterial) {
                    child.material.onBeforeCompile = (shader) => {
                        shader.uniforms.uTime = { value: 0 };
                        shader.uniforms.uNoiseAmount = { value: params.noiseAmount };
                        shader.uniforms.uNoiseSpeed = { value: params.noiseSpeed };
                        shader.uniforms.uNoiseFreq = { value: params.noiseFreq };
                        shader.uniforms.uVertexNoise = { value: params.vertexNoise };

                        shader.vertexShader = `
                            uniform float uTime;
                            uniform float uNoiseAmount;
                            uniform float uNoiseSpeed;
                            uniform float uNoiseFreq;
                            uniform bool uVertexNoise;
                            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                            float snoise(vec3 v) {
                                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                                vec3 i  = floor(v + dot(v, C.yyy));
                                vec3 x0 = v - i + dot(i, C.xxx);
                                vec3 g = step(x0.yzx, x0.xyz);
                                vec3 l = 1.0 - g;
                                vec3 i1 = min(g.xyz, l.zxy);
                                vec3 i2 = max(g.xyz, l.zxy);
                                vec3 x1 = x0 - i1 + C.xxx;
                                vec3 x2 = x0 - i2 + C.yyy;
                                vec3 x3 = x0 - D.yyy;
                                i = mod289(i);
                                vec4 p = permute(permute(permute(
                                            i.z + vec4(0.0, i1.z, i2.z, 1.0))
                                            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                                            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                                float n_ = 0.142857142857; // 1.0/7.0
                                vec3  ns = n_ * D.wyz - D.xzx;
                                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                                vec4 x_ = floor(j * ns.z);
                                vec4 y_ = floor(j - 7.0 * x_);
                                vec4 x = x_ * ns.x + ns.yyyy;
                                vec4 y = y_ * ns.x + ns.yyyy;
                                vec4 h = 1.0 - abs(x) - abs(y);
                                vec4 b0 = vec4(x.xy, y.xy);
                                vec4 b1 = vec4(x.zw, y.zw);
                                vec4 s0 = floor(b0)*2.0 + 1.0;
                                vec4 s1 = floor(b1)*2.0 + 1.0;
                                vec4 sh = -step(h, vec4(0.0));
                                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                                vec3 p0 = vec3(a0.xy,h.x);
                                vec3 p1 = vec3(a0.zw,h.y);
                                vec3 p2 = vec3(a1.xy,h.z);
                                vec3 p3 = vec3(a1.zw,h.w);
                                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                                p0 *= norm.x;
                                p1 *= norm.y;
                                p2 *= norm.z;
                                p3 *= norm.w;
                                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                                m = m * m;
                                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                            }
                        ` + shader.vertexShader;

                        shader.vertexShader = shader.vertexShader.replace(
                            '#include <begin_vertex>',
                            `
                            #include <begin_vertex>
                            if (uVertexNoise) {
                                float noise = snoise(position * uNoiseFreq + uTime * uNoiseSpeed) * uNoiseAmount;
                                transformed += normal * noise;
                            }
                            `
                        );
                        child.userData.shader = shader;
                        animatedMeshes.push(child);
                    };
                }

                if (!carPaintMaterial && child.material) carPaintMaterial = child.material;

                const helper = new VertexNormalsHelper(child, 0.2, 0x00ff00);
                helper.visible = params.showNormals;
                scene.add(helper);
                normalsHelper.push(helper);
            }
        });

        if (carPaintMaterial) {
            carPaintMaterial.color = new THREE.Color(params.paintColor);
            Object.assign(carPaintMaterial, materials[params.material]);
        }

        if (gltf.animations && gltf.animations.length) {
            mixer = new THREE.AnimationMixer(model);
            animationClip = gltf.animations[0];
            mixer.clipAction(animationClip).play();
        }

        scene.add(model);
    }, undefined, (error) => {
        console.error('Error loading model:', error);
        loadingEl.innerHTML = `<p style="color: #ff8a8a;">Failed to load model.</p>`;
        loadingEl.style.display = 'block';
    });
}

function loadGhostTruck() {
    const loader = new GLTFLoader(loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    loader.load('assets/models/truck1.glb', (gltf) => {
        ghostTruck = gltf.scene;

        // Ghost Material
        const ghostMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            emissive: 0x0088aa,
            emissiveIntensity: 0.5,
            roughness: 0.0,
            metalness: 1.0
        });

        ghostTruck.traverse((child) => {
            if (child.isMesh) {
                child.material = ghostMaterial;
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });

        ghostTruck.scale.set(0.5, 0.5, 0.5); // Smaller scale
        scene.add(ghostTruck);
    }, undefined, (error) => {
        console.warn("Ghost truck failed to load:", error);
    });
}

function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.enabled = params.bloom;
    bloomPass.strength = params.bloomStrength;
    composer.addPass(bloomPass);
    glitchPass = new GlitchPass();
    glitchPass.enabled = false;
    composer.addPass(glitchPass);
    composer.addPass(new OutputPass());
}

function createGUI() {
    const gui = new GUI({ title: "Viewer Controls" });

    const envFolder = gui.addFolder('Environment');
    envFolder.add(params, 'environment', envKeys).name('Scene').onChange(updateEnvironment);
    envFolder.add(params, 'backgroundBlur', 0, 1, 0.01).name('BG Blur').onChange(v => scene.backgroundBlurriness = v);
    envFolder.add({ cycle: () => { /* ... */ } }, 'cycle').name('Cycle Scene');

    const skyboxFolder = envFolder.addFolder('Dimensional Rift');
    skyboxFolder.add(params, 'skyboxMode').name('Enable Shader').onChange(updateEnvironment);
    skyboxFolder.add(params, 'dimensionScale', 0.1, 5).name('Dim Scale').onChange(v => { if (skyboxMaterial) skyboxMaterial.uniforms.uScale.value = v; });
    skyboxFolder.add(params, 'timeScale', 0, 2).name('Time Warp').onChange(v => { if (skyboxMaterial) skyboxMaterial.uniforms.uTimeScale.value = v; });
    skyboxFolder.add(params, 'alienIntensity', 0, 5).name('Intensity').onChange(v => { if (skyboxMaterial) skyboxMaterial.uniforms.uIntensity.value = v; });
    skyboxFolder.add(params, 'colorShift', 0, 1).name('Color Shift').onChange(v => { if (skyboxMaterial) skyboxMaterial.uniforms.uColorShift.value = v; });

    // Video Skybox
    skyboxFolder.add(params, 'videoSkybox', videoOptions).name('Video Skybox').onChange(updateVideoSkybox);

    const audioFolder = gui.addFolder('Music Player');
    audioFolder.add(params, 'musicVolume', 0, 1).name('Volume').onChange(v => { if (sound) sound.setVolume(v); });
    audioFolder.add({ next: () => { currentTrackIndex = (currentTrackIndex + 1) % playlist.length; playNextTrack(); } }, 'next').name('Next Track');

    const carFolder = gui.addFolder('Car Paint');
    carFolder.addColor(params, 'paintColor').name('Color').onChange(v => { if (carPaintMaterial) carPaintMaterial.color.set(v); });
    carFolder.add(params, 'material', Object.keys(materials)).name('Finish').onChange(v => {
        if (carPaintMaterial) Object.assign(carPaintMaterial, materials[v]);
    });

    const toolsFolder = gui.addFolder('Tools');
    toolsFolder.add({ exportGLB: exportGLB }, 'exportGLB').name('Export to .glb');

    const techFolder = gui.addFolder('Technical Tools');
    techFolder.add(params, 'showNormals').name('Show Normals').onChange(v => {
        if (normalsHelper) normalsHelper.forEach(h => h.visible = v);
    });
    techFolder.add(params, 'uvCheck').name('UV Checker').onChange(toggleUVChecker);
    const noiseFolder = techFolder.addFolder('Vertex Noise');
    noiseFolder.add(params, 'vertexNoise').name('Enable');
    noiseFolder.add(params, 'noiseAmount', 0, 1, 0.01).name('Amount');
    noiseFolder.add(params, 'noiseSpeed', 0, 2, 0.1).name('Speed');
    noiseFolder.add(params, 'noiseFreq', 0, 5, 0.1).name('Frequency');

    const crazyFolder = gui.addFolder('Crazy Tools');
    crazyFolder.add(params, 'explode', 0, 5, 0.1).onChange(updateExplode);
    crazyFolder.add(params, 'glitch').name('Glitch Effect').onChange(v => glitchPass.enabled = v);
    crazyFolder.add(params, 'colorCycle').name('Paint Color Cycle');
    crazyFolder.add(params, 'discoLights').name('Disco Lights').onChange(v => pLight1.visible = pLight2.visible = pLight3.visible = v);
    crazyFolder.add(params, 'floorIsLava').name('Floor is Lava').onChange(toggleFloorIsLava);
    crazyFolder.add(params, 'cameraShake').name('Camera Shake');
    crazyFolder.add(params, 'xray').name('X-Ray Vision').onChange(toggleXRay);
    crazyFolder.add(params, 'sparkles').name('Show Sparkles').onChange(v => { if (sparkles) sparkles.visible = v; });

    const labyrinthFolder = gui.addFolder('Labyrinth');
    labyrinthFolder.add(params, 'labyrinthMode').name('Enable Labyrinth');
    labyrinthFolder.add(params, 'labyrinthSpeed', 0.1, 2).name('Speed');
    labyrinthFolder.add(params, 'shuffleInterval', 1.0, 10).name('Shuffle Interval');

    const paradeFolder = gui.addFolder('Honda Parade');
    paradeFolder.add(params, 'paradeMode').name('Enable Parade').onChange(toggleParade);
    paradeFolder.add(params, 'paradeSpeed', 0, 2).name('Speed');
    paradeFolder.add(params, 'paradeSpread', 0, 10).name('Spread');

    const narratorFolder = gui.addFolder('S2 Narrator');
    narratorFolder.add(params, 'narratorEnabled').name('Enable Voice').onChange(toggleNarrator);
    narratorFolder.add(params, 'narratorInterval', 5, 60).name('Interval (s)');
    narratorFolder.add(params, 'narratorVolume', 0, 1).name('Volume');
}

function initTTS() {
    if ('speechSynthesis' in window) {
        voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
        };
    }
}

function speakRandomFact() {
    // Disabled random TTS fact alerts
    return;
}

function toggleNarrator(enabled) {
    if (enabled) {
        // Ensure voices are loaded
        if (voices.length === 0 && 'speechSynthesis' in window) {
            voices = window.speechSynthesis.getVoices();
        }
        speakRandomFact();
    } else {
        clearTimeout(narratorTimer);
        window.speechSynthesis.cancel();
    }
}

function toggleParade(value) {
    if (value) {
        if (!paradeGroup) createDisassemblyParade();
        paradeGroup.visible = true;
        paradeActive = true;
    } else {
        if (paradeGroup) paradeGroup.visible = false;
        paradeActive = false;
    }
}

function createDisassemblyParade() {
    if (!model) return;

    paradeGroup = new THREE.Group();
    scene.add(paradeGroup);
    paradeMeshes = [];

    // Clone the model to avoid messing up the original
    const clone = model.clone();

    // Extract all meshes
    clone.traverse((child) => {
        if (child.isMesh) {
            const mesh = child.clone();
            // Reset transforms to handle them manually in world space relative to group
            mesh.position.set(0, 0, 0);
            mesh.rotation.set(0, 0, 0);
            mesh.scale.setScalar(1);

            // Store original data if we wanted to reassemble, but for now just random ID
            mesh.userData.paradeId = Math.random() * 100;
            mesh.userData.paradeOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 10
            );

            paradeGroup.add(mesh);
            paradeMeshes.push(mesh);
        }
    });

    // Center the group
    paradeGroup.position.set(0, 5, 0);
}

function exportGLB() {
    const exporter = new GLTFExporter();
    exporter.parse(
        model,
        function (result) {
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 's2_scene.glb';
            link.click();
        },
        function (error) {
            console.error('An error happened during export', error);
        },
        { binary: true }
    );
}

function toggleUVChecker(value) {
    if (!carPaintMaterial) return;
    if (value) {
        if (!uvCheckerTexture) {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const context = canvas.getContext('2d');
            context.fillStyle = 'black';
            context.fillRect(0, 0, 512, 512);
            context.fillStyle = 'white';
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if ((i + j) % 2 === 0) context.fillRect(i * 64, j * 64, 64, 64);
                }
            }
            uvCheckerTexture = new THREE.CanvasTexture(canvas);
        }
        carPaintMaterial.userData.originalMap = carPaintMaterial.map;
        carPaintMaterial.map = uvCheckerTexture;
    } else {
        carPaintMaterial.map = carPaintMaterial.userData.originalMap || null;
    }
    carPaintMaterial.needsUpdate = true;
}

function updateExplode(value) { /* ... */ }
function toggleFloorIsLava(v) { /* ... */ }
function toggleXRay(v) { /* ... */ }
function createSparkles() {
    const geometry = new THREE.BufferGeometry();
    const count = 1000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10 + 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    sparkles = new THREE.Points(geometry, material);
    sparkles.visible = params.sparkles;
    scene.add(sparkles);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (animatedMeshes.length > 0) {
        animatedMeshes.forEach(child => {
            const shader = child.userData.shader;
            shader.uniforms.uTime.value = time;
            shader.uniforms.uVertexNoise.value = params.vertexNoise;
            shader.uniforms.uNoiseAmount.value = params.noiseAmount;
            shader.uniforms.uNoiseSpeed.value = params.noiseSpeed;
            shader.uniforms.uNoiseFreq.value = params.noiseFreq;
        });
    }

    if (skyboxMaterial) {
        skyboxMaterial.uniforms.uTime.value = time;
    }

    // Ghost Truck Animation
    if (ghostTruck) {
        ghostTruckAngle += delta * 0.2; // Slow orbit
        const radius = 25;
        ghostTruck.position.x = Math.cos(ghostTruckAngle) * radius;
        ghostTruck.position.z = Math.sin(ghostTruckAngle) * radius;
        ghostTruck.position.y = 0; // On ground
        ghostTruck.lookAt(0, 0, 0); // Face center (or tangent if we want it driving forward)
        ghostTruck.rotateY(-Math.PI / 2); // Adjust rotation to face forward along path
    }

    // Parade Animation
    if (paradeActive && paradeGroup) {
        paradeGroup.rotation.y += delta * 0.1 * params.paradeSpeed;

        paradeMeshes.forEach((mesh, i) => {
            const t = time * params.paradeSpeed + i * 0.1;

            // "Honda" Exploded View Motion
            // 1. Radial expansion
            const spread = params.paradeSpread;
            const ix = (i % 5) - 2;
            const iy = (Math.floor(i / 5) % 5) - 2;
            const iz = (Math.floor(i / 25)) - 2;

            // Lissajous-like floating
            mesh.position.x = Math.sin(t * 0.5 + i) * spread * 2 + ix * spread;
            mesh.position.y = Math.cos(t * 0.3 + i) * spread + iy * spread * 0.5;
            mesh.position.z = Math.sin(t * 0.7 + i) * spread * 2 + iz * spread;

            // Slow rotation of individual parts
            mesh.rotation.x = t * 0.2;
            mesh.rotation.y = t * 0.3;
        });
    }

    // --- Labyrinth Animation Logic (Armor Style) ---
    if (params.labyrinthMode && labyrinthPlanes.length > 0) {
        // Shuffle Trigger
        if (time - lastShuffleTime > params.shuffleInterval) {
            lastShuffleTime = time;

            // Pick multiple pairs to swap for a "busy" mechanical look
            const swaps = 10; // Increased swaps for larger grid
            for (let s = 0; s < swaps; s++) {
                const idx1 = Math.floor(Math.random() * labyrinthPlanes.length);
                let idx2 = Math.floor(Math.random() * labyrinthPlanes.length);
                while (idx1 === idx2) {
                    idx2 = Math.floor(Math.random() * labyrinthPlanes.length);
                }

                const plane1 = labyrinthPlanes[idx1];
                const plane2 = labyrinthPlanes[idx2];

                if (!plane1.userData.isMoving && !plane2.userData.isMoving) {
                    // Swap target grid indices
                    const tempTarget = plane1.userData.targetGridIndex;
                    plane1.userData.targetGridIndex = plane2.userData.targetGridIndex;
                    plane2.userData.targetGridIndex = tempTarget;

                    // Start Move
                    plane1.userData.isMoving = true;
                    plane1.userData.moveStartTime = time;
                    plane1.userData.startPos.copy(plane1.position);
                    plane1.userData.targetPos.copy(gridPositions[plane1.userData.targetGridIndex]);

                    plane2.userData.isMoving = true;
                    plane2.userData.moveStartTime = time;
                    plane2.userData.startPos.copy(plane2.position);
                    plane2.userData.targetPos.copy(gridPositions[plane2.userData.targetGridIndex]);
                }
            }
        }

        // Animation Update
        labyrinthPlanes.forEach(plane => {
            // Wave Effect
            if (!plane.userData.isMoving) {
                const dist = Math.sqrt(plane.position.x * plane.position.x + plane.position.z * plane.position.z);
                const waveY = Math.sin(dist * 0.5 - time * 2.0) * 0.2;
                plane.position.y = -0.5 + waveY;
                plane.userData.startPos.y = plane.position.y; // Update start pos for next move
            }

            if (plane.userData.isMoving) {
                const elapsed = time - plane.userData.moveStartTime;
                const duration = plane.userData.moveDuration / params.labyrinthSpeed;
                const progress = Math.min(elapsed / duration, 1.0);

                // Armor Animation Phases:
                // 0.0 - 0.2: Lift Up
                // 0.2 - 0.8: Move to Target (while staying up)
                // 0.8 - 1.0: Drop Down (Snap)

                const baseHeight = -0.5; // New base height
                const liftHeight = 0.0; // Lift up to 0 (which is 0.5 higher than base)
                const currentPos = new THREE.Vector3();

                if (progress < 0.2) {
                    // Phase 1: Lift
                    const liftProgress = progress / 0.2;
                    // Ease out cubic
                    const y = THREE.MathUtils.lerp(baseHeight, liftHeight, 1 - Math.pow(1 - liftProgress, 3));
                    currentPos.copy(plane.userData.startPos);
                    currentPos.y = y;

                    // Tilt slightly
                    plane.rotation.x = -Math.PI / 2 + Math.sin(liftProgress * Math.PI) * 0.1;
                    plane.rotation.z = Math.sin(liftProgress * Math.PI) * 0.1;

                } else if (progress < 0.8) {
                    // Phase 2: Move
                    const moveProgress = (progress - 0.2) / 0.6;
                    // Smooth step
                    const t = moveProgress * moveProgress * (3 - 2 * moveProgress);

                    currentPos.lerpVectors(plane.userData.startPos, plane.userData.targetPos, t);
                    currentPos.y = liftHeight; // Stay lifted

                    // Mechanical wobble
                    plane.rotation.z = Math.sin(moveProgress * Math.PI * 4) * 0.05;
                    plane.rotation.x = -Math.PI / 2;

                } else {
                    // Phase 3: Drop
                    const dropProgress = (progress - 0.8) / 0.2;
                    // Ease in bounce-like (just fast drop)
                    const y = THREE.MathUtils.lerp(liftHeight, baseHeight, dropProgress * dropProgress);
                    currentPos.copy(plane.userData.targetPos);
                    currentPos.y = y;

                    plane.rotation.x = -Math.PI / 2;
                    plane.rotation.z = 0;
                }

                plane.position.copy(currentPos);

                if (progress >= 1.0) {
                    plane.userData.isMoving = false;
                    plane.position.copy(plane.userData.targetPos); // Ensure exact final pos
                    plane.rotation.x = -Math.PI / 2; // Ensure flat
                    plane.rotation.z = 0;
                }
            }
        });
    }

    if (normalsHelper && params.showNormals) {
        normalsHelper.forEach(h => h.update());
    }

    if (mixer && params.playAnimation) mixer.update(delta);
    if (params.colorCycle && carPaintMaterial) carPaintMaterial.color.setHSL((time * 0.1) % 1, 1, 0.5);
    if (params.discoLights) { /* ... */ }
    if (params.cameraShake) { /* ... */ }
    if (sparkles && sparkles.visible) sparkles.rotation.y += delta * 0.1;

    controls.update();
    composer.render();
}