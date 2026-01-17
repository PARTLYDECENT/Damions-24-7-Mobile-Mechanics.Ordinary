
// 3D Cursor Implementation with On-Screen Debugging

// Configuration
const CURSOR_MODEL_PATH = 'assets/models/cursor.glb';
const LERP_FACTOR = 0.2;
const SCALE = 2.0;

// Global variables
let scene, camera, renderer, cursorMesh;
let debugMesh;
let mouse = new THREE.Vector2();
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let debugConsole;

// --- on-screen debugger ---
function createDebugConsole() {
    debugConsole = document.createElement('div');
    debugConsole.style.position = 'fixed';
    debugConsole.style.bottom = '10px';
    debugConsole.style.left = '10px';
    debugConsole.style.backgroundColor = 'rgba(0,0,0,0.8)';
    debugConsole.style.color = '#ff0000';
    debugConsole.style.zIndex = '1000000';
    debugConsole.style.padding = '10px';
    debugConsole.style.maxWidth = '300px';
    debugConsole.style.maxHeight = '200px';
    debugConsole.style.overflowY = 'auto';
    debugConsole.style.fontFamily = 'monospace';
    debugConsole.style.fontSize = '12px';
    debugConsole.style.pointerEvents = 'none';
    debugConsole.innerHTML = '<strong>3D Cursor Debugger</strong><br>';
    document.body.appendChild(debugConsole);
}

function logToScreen(message, isError = false) {
    if (!debugConsole) createDebugConsole();
    const msg = document.createElement('div');
    msg.style.color = isError ? '#ff5555' : '#55ff55';
    msg.textContent = `> ${message}`;
    debugConsole.appendChild(msg);
    debugConsole.scrollTop = debugConsole.scrollHeight;
    console.log(message);
}
// --------------------------

function init3DCursor() {
    try {
        logToScreen('Initializing 3D Cursor...');

        // Check for THREE
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js library not loaded!');
        }

        // 1. Scene Setup
        scene = new THREE.Scene();

        // 2. Camera Setup
        camera = new THREE.OrthographicCamera(
            -window.innerWidth / 2, window.innerWidth / 2,
            window.innerHeight / 2, -window.innerHeight / 2,
            1, 1000
        );
        camera.position.z = 100;

        // 3. Renderer Setup
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        renderer.domElement.id = 'cursor-canvas';
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.pointerEvents = 'none';
        renderer.domElement.style.zIndex = '999999';
        document.body.appendChild(renderer.domElement);
        logToScreen('Renderer attached to DOM');

        // 4. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(0, 0, 100);
        scene.add(directionalLight);

        // 5. Debug Mesh (Red Cube)
        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        debugMesh = new THREE.Mesh(geometry, material);
        debugMesh.position.set(0, 0, 0);
        scene.add(debugMesh);
        logToScreen('Debug cube added');

        // 6. Load GLB Model
        logToScreen(`Loading: ${CURSOR_MODEL_PATH}`);

        // Check if GLTFLoader is loaded
        if (!THREE.GLTFLoader) {
            throw new Error('THREE.GLTFLoader is unavailable.');
        }

        const loader = new THREE.GLTFLoader();

        loader.load(
            CURSOR_MODEL_PATH,
            function (gltf) {
                logToScreen('Model loaded!');
                // Remove debug mesh
                if (debugMesh) {
                    scene.remove(debugMesh);
                    debugMesh = null;
                }

                cursorMesh = gltf.scene;
                cursorMesh.scale.set(SCALE, SCALE, SCALE);

                const cursorX = mouse.x - windowHalfX;
                const cursorY = -(mouse.y - windowHalfY);
                cursorMesh.position.set(cursorX, cursorY, 0);

                scene.add(cursorMesh);
            },
            function (xhr) {
                // report progress if needed
            },
            function (error) {
                logToScreen(`Load Error: ${error.message || error}`, true);
                if (debugMesh) {
                    debugMesh.material.color.setHex(0xffff00); // Yellow warnings
                }
            }
        );

        // 7. Event Listeners
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        window.addEventListener('resize', onWindowResize, false);

        // Start loop
        animate();
        logToScreen('Animation loop started');

    } catch (e) {
        logToScreen(`FATAL ERROR: ${e.message}`, true);
        console.error(e);
    }
}

function onDocumentMouseMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.left = -window.innerWidth / 2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = -window.innerHeight / 2;

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const targetX = mouse.x - windowHalfX;
    const targetY = -(mouse.y - windowHalfY);

    if (cursorMesh) {
        cursorMesh.position.x += (targetX - cursorMesh.position.x) * LERP_FACTOR;
        cursorMesh.position.y += (targetY - cursorMesh.position.y) * LERP_FACTOR;

        cursorMesh.rotation.y += 0.02;
        cursorMesh.rotation.z += 0.01;
    }
    else if (debugMesh) {
        debugMesh.position.x += (targetX - debugMesh.position.x) * LERP_FACTOR;
        debugMesh.position.y += (targetY - debugMesh.position.y) * LERP_FACTOR;
        debugMesh.rotation.x += 0.05;
        debugMesh.rotation.y += 0.05;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DCursor);
} else {
    init3DCursor();
}
