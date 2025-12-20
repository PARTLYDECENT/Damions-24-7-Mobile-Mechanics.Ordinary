import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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

const loadingManager = new THREE.LoadingManager();
const loadingEl = document.getElementById('loading');
const loadingProgressEl = document.getElementById('loading-progress');

// --- Configuration ---
const params = {
    environment: 'Parking Lot',
    backgroundBlur: 0.5,
    exposure: 1.0,
    autoRotate: true,
    autoRotateSpeed: 0.5,
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
    labyrinthSpeed: 1.0,
    shuffleInterval: 1.5,
    // Skybox Params
    skyboxMode: true,
    skyboxSpeed: 0.2,
    skyboxScale: 1.0,
    skyboxIntensity: 1.0,
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
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 7);

    const canvasContainer = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvasContainer.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 2;
    controls.maxDistance = 20;
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
    const geometry = new THREE.SphereGeometry(50, 64, 64);

    const vertexShader = `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform float uTime;
        uniform float uSpeed;
        uniform float uScale;
        uniform float uIntensity;
        varying vec2 vUv;
        varying vec3 vPosition;

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
            f += 0.5000 * noise(p); p *= 2.02;
            f += 0.2500 * noise(p); p *= 2.03;
            f += 0.1250 * noise(p); p *= 2.01;
            f += 0.0625 * noise(p);
            return f;
        }

        void main() {
            vec3 pos = normalize(vPosition) * uScale * 2.0;
            float t = uTime * uSpeed * 0.1;

            float stars = pow(noise(pos * 20.0), 20.0) * 2.0;
            
            vec3 cloudPos = pos + vec3(t * 0.5, t * 0.2, 0.0);
            float n = fbm(cloudPos);
            float n2 = fbm(cloudPos * 2.0 + vec3(n)); 
            
            vec3 darkSpace = vec3(0.0, 0.0, 0.05);
            vec3 nebulaColor1 = vec3(0.1, 0.0, 0.3); 
            vec3 nebulaColor2 = vec3(0.0, 0.2, 0.4); 
            vec3 nebulaColor3 = vec3(0.4, 0.1, 0.1); 
            
            vec3 color = darkSpace;
            color = mix(color, nebulaColor1, n * 1.5);
            color = mix(color, nebulaColor2, n2 * 1.2);
            color += nebulaColor3 * pow(n * n2, 2.0);
            
            color += vec3(stars);

            gl_FragColor = vec4(color * uIntensity, 1.0);
        }
    `;

    skyboxMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uSpeed: { value: params.skyboxSpeed },
            uScale: { value: params.skyboxScale },
            uIntensity: { value: params.skyboxIntensity }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    });

    skyboxMesh = new THREE.Mesh(geometry, skyboxMaterial);
    skyboxMesh.visible = params.skyboxMode;
    scene.add(skyboxMesh);
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

    // 4x4 Grid
    const rows = 4;
    const cols = 4;
    const planeSize = 1.8;
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

    for (let i = 0; i < gridPositions.length; i++) {
        const textureIndex = (i % 8) + 1;
        const texturePath = `assets/images/tile${textureIndex}.png`;
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

        const scale = 2 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);

        model.updateMatrixWorld(true);

        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y -= box2.min.y;
        model.position.y += 0.05;

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

    const skyboxFolder = envFolder.addFolder('Wild Skybox');
    skyboxFolder.add(params, 'skyboxMode').name('Enable Shader').onChange(updateEnvironment);
    skyboxFolder.add(params, 'skyboxSpeed', 0, 5).name('Speed').onChange(v => { if (skyboxMaterial) skyboxMaterial.uniforms.uSpeed.value = v; });
    skyboxFolder.add(params, 'skyboxScale', 0.1, 10).name('Scale').onChange(v => { if (skyboxMaterial) skyboxMaterial.uniforms.uScale.value = v; });
    skyboxFolder.add(params, 'skyboxIntensity', 0, 5).name('Intensity').onChange(v => { if (skyboxMaterial) skyboxMaterial.uniforms.uIntensity.value = v; });

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
    labyrinthFolder.add(params, 'labyrinthSpeed', 0.1, 5).name('Speed');
    labyrinthFolder.add(params, 'shuffleInterval', 0.5, 5).name('Shuffle Interval');
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

    // --- Labyrinth Animation Logic (Armor Style) ---
    if (params.labyrinthMode && labyrinthPlanes.length > 0) {
        // Shuffle Trigger
        if (time - lastShuffleTime > params.shuffleInterval) {
            lastShuffleTime = time;

            // Pick multiple pairs to swap for a "busy" mechanical look
            const swaps = 2; // Swap 2 pairs at once
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