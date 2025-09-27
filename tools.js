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

let scene, camera, renderer, controls, model, composer, carPaintMaterial, dirLight, rimLight, mixer, animationClip, clock, ground, glitchPass, uvCheckerTexture;
let pLight1, pLight2, pLight3, sparkles;
let normalsHelper = [];
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
};

const environments = {
    'Parking Lot': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/parking_garage_1k.hdr',
    'Night Street': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/blouberg_sunrise_2_1k.hdr',
    'Studio': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr'
};
const envKeys = Object.keys(environments);

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
    camera.position.set(4, 1.5, 5);

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
    controls.maxDistance = 15;
    controls.target.set(0, 0.5, 0);
    controls.autoRotate = params.autoRotate;
    controls.autoRotateSpeed = params.autoRotateSpeed;

    updateEnvironment();
    setupLighting();

    const groundGeo = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.8 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    loadModel('s2.glb');
    createSparkles();
    setupPostProcessing();
    createGUI();

    window.addEventListener('resize', onWindowResize);
}

function updateEnvironment() {
    const rgbeLoader = new RGBELoader(loadingManager);
    rgbeLoader.load(environments[params.environment], (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = texture;
        scene.backgroundBlurriness = params.backgroundBlur;
    });
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
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.sub(center);
        const scale = 2 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.y += size.y * scale / 2;

        normalsHelper = [];
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
    envFolder.add({ cycle: () => { /* ... */ }}, 'cycle').name('Cycle Scene');

    const carFolder = gui.addFolder('Car Paint');
    carFolder.addColor(params, 'paintColor').name('Color').onChange(v => { if (carPaintMaterial) carPaintMaterial.color.set(v); });
    carFolder.add(params, 'material', Object.keys(materials)).name('Finish').onChange(v => {
        if(carPaintMaterial) Object.assign(carPaintMaterial, materials[v]);
    });

    const toolsFolder = gui.addFolder('Tools');
    toolsFolder.add({ exportGLB: exportGLB }, 'exportGLB').name('Export to .glb');

    const techFolder = gui.addFolder('Technical Tools');
    techFolder.add(params, 'showNormals').name('Show Normals').onChange(v => { 
        if(normalsHelper) normalsHelper.forEach(h => h.visible = v);
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
    crazyFolder.add(params, 'sparkles').name('Show Sparkles').onChange(v => sparkles.visible = v);
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
function createSparkles() { /* ... */ }
function onWindowResize() { /* ... */ }

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (model) {
        model.traverse(child => {
            if (child.isMesh && child.userData.shader) {
                const shader = child.userData.shader;
                shader.uniforms.uTime.value = time;
                shader.uniforms.uVertexNoise.value = params.vertexNoise;
                shader.uniforms.uNoiseAmount.value = params.noiseAmount;
                shader.uniforms.uNoiseSpeed.value = params.noiseSpeed;
                shader.uniforms.uNoiseFreq.value = params.noiseFreq;
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