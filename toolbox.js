import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getToolInfo } from './tool1.js';

// --- Basic Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 for performance
renderer.setClearColor(0x0A0F1A); // Match body background
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x00E5FF, 2, 50);
pointLight.position.set(-5, -5, 5);
scene.add(pointLight);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;

camera.position.z = 5;

// --- Create a Procedural Wrench Model ---
function createWrench() {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        metalness: 0.9,
        roughness: 0.4
    });

    // Handle
    const handleGeo = new THREE.BoxGeometry(0.4, 3, 0.2);
    const handle = new THREE.Mesh(handleGeo, material);
    group.add(handle);

    // Top Jaw
    const topJawGeo = new THREE.BoxGeometry(1, 0.5, 0.2);
    const topJaw = new THREE.Mesh(topJawGeo, material);
    topJaw.position.set(0.3, 1.75, 0);
    group.add(topJaw);

    // Bottom Jaw
    const bottomJawGeo = new THREE.BoxGeometry(0.6, 0.5, 0.2);
    const bottomJaw = new THREE.Mesh(bottomJawGeo, material);
    bottomJaw.position.set(-0.1, -1.75, 0);
    group.add(bottomJaw);

    group.rotation.x = -0.5;
    group.rotation.y = 0.5;

    return group;
}

const wrench = createWrench();
scene.add(wrench);

// --- Use function from tool1.js ---
const toolInfo = getToolInfo('wrench');
console.log('Tool Info:', toolInfo);
document.querySelector('#info-panel p').textContent = toolInfo.description;


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Animate the point light
    const time = Date.now() * 0.001;
    pointLight.position.x = Math.sin(time * 0.7) * 10;
    pointLight.position.y = Math.cos(time * 0.5) * 10;
    pointLight.position.z = Math.cos(time * 0.3) * 10;

    controls.update();
    renderer.render(scene, camera);
}

// --- Handle Window Resizing ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();