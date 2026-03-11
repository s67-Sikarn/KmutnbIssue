// 3D Map Core Logic
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

let scene, camera, renderer, labelRenderer, controls;
let currentMode = null; // 'reporter' or 'viewer'
let raycaster, mouse;
let onRoomSelectCallback = null;
let containerEl;
let animationFrameId;
const INTERSECTED = { obj: null, currentHex: null };
const selectableRooms = [];

// Create the mock building structure
function createMockBuilding(targetBld, targetFlr) {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);

    // Mock Rooms Data based on Django choices
    // bld: 61, 63, 65, 81, IT
    // flr: 1, 2, 3
    // rm: 101, 102, 201, 301, male_restroom_1, other

    // Create a hallway
    const hallGeo = new THREE.BoxGeometry(20, 0.2, 4);
    const hallMat = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 });
    const hall = new THREE.Mesh(hallGeo, hallMat);
    scene.add(hall);

    const roomGeo = new THREE.BoxGeometry(4, 3, 4);

    // Define some rooms for the mock floor
    const rooms = [
        { id: "101", x: -6, z: -4 },
        { id: "102", x: -2, z: -4 },
        { id: "201", x: 2, z: -4 },
        { id: "301", x: 6, z: -4 },
        { id: "male_restroom_1", x: -6, z: 4, name: "Male Restroom 1" },
        { id: "other", x: 6, z: 4, name: "Other" }
    ];

    rooms.forEach(rm => {
        const material = new THREE.MeshLambertMaterial({ color: 0x88ccff });
        const roomMesh = new THREE.Mesh(roomGeo, material);
        roomMesh.position.set(rm.x, 1.5, rm.z);

        // Ensure data perfectly matches <option value="..."> 
        roomMesh.userData = {
            bld: targetBld || "81", // default mock to 81
            flr: targetFlr || "1",  // default mock floor 1
            rm: rm.id,
            isRoom: true
        };

        scene.add(roomMesh);
        selectableRooms.push(roomMesh);

        // Add CSS2D Label
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-label';
        roomDiv.textContent = rm.name || rm.id;
        roomDiv.style.marginTop = '-1em';
        roomDiv.style.color = '#333';
        roomDiv.style.background = 'white';
        roomDiv.style.padding = '2px 5px';
        roomDiv.style.borderRadius = '3px';
        roomDiv.style.fontSize = '12px';
        roomDiv.style.fontWeight = 'bold';
        roomDiv.style.border = '1px solid #ccc';
        roomDiv.style.pointerEvents = 'none';

        const roomLabel = new CSS2DObject(roomDiv);
        roomLabel.position.set(0, 2, 0); // Position above the box
        roomMesh.add(roomLabel);
    });
}

function initThreeJS(containerId) {
    containerEl = document.getElementById(containerId);
    if (!containerEl) return false;

    // Clear any existing canvas
    containerEl.innerHTML = '';

    const width = containerEl.clientWidth || window.innerWidth * 0.8;
    const height = containerEl.clientHeight || 400;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 15, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerEl.appendChild(renderer.domElement);

    // CSS2D Renderer for labels
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none'; // IMPORTANT: Let clicks pass through to WebGL canvas
    containerEl.appendChild(labelRenderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't allow camera below ground

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    selectableRooms.length = 0; // Clear array

    window.addEventListener('resize', onWindowResize);

    return true;
}

function onWindowResize() {
    if (!containerEl || !renderer || !camera) return;
    // When resizing, we MUST get the new dimensions of the container
    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight;

    if (width === 0 || height === 0) return; // Happens if modal is hidden

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
}

// Ensure proper sizing when modal finishes opening
export function resizeModalCanvas() {
    onWindowResize();
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// --- Reporter Mode (Click to Select) ---

function onMouseMove(event) {
    if (currentMode !== 'reporter') return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableRooms);

    if (intersects.length > 0) {
        // We hovered over a room
        const object = intersects[0].object;
        renderer.domElement.style.cursor = 'pointer';

        if (INTERSECTED.obj !== object) {
            // Restore previous object's color
            if (INTERSECTED.obj) {
                INTERSECTED.obj.material.emissive.setHex(INTERSECTED.currentHex);
            }
            // Save current object's color and set emissive to yellow
            INTERSECTED.obj = object;
            INTERSECTED.currentHex = INTERSECTED.obj.material.emissive.getHex();
            INTERSECTED.obj.material.emissive.setHex(0x555500); // Yellow tint
        }
    } else {
        // Not hovering over room
        renderer.domElement.style.cursor = 'default';
        if (INTERSECTED.obj) {
            // Restore color
            INTERSECTED.obj.material.emissive.setHex(INTERSECTED.currentHex);
            INTERSECTED.obj = null;
        }
    }
}

function onClick(event) {
    if (currentMode !== 'reporter') return;

    if (INTERSECTED.obj && onRoomSelectCallback) {
        // User clicked on a valid room that was hovered
        const userData = INTERSECTED.obj.userData;
        onRoomSelectCallback(userData);
    }
}

export function initReporterMode(containerId, callback) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    if (!initThreeJS(containerId)) return;

    currentMode = 'reporter';
    onRoomSelectCallback = callback;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createMockBuilding(); // Load mock rooms

    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('click', onClick, false);

    animate();
}

// --- Viewer Mode (Dashboard) ---

export function initViewerMode(containerId, targetBld, targetFlr, targetRm) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    if (!initThreeJS(containerId)) return;

    currentMode = 'viewer';

    createMockBuilding(targetBld, targetFlr); // Load mock rooms for that specific building

    // Apply Ghosting Effect to non-target rooms, highlight target room
    let targetMesh = null;
    selectableRooms.forEach(roomMesh => {
        if (roomMesh.userData.rm === targetRm) {
            // Target Room - Highlight Red
            roomMesh.material.color.setHex(0xff3333);
            targetMesh = roomMesh;
        } else {
            // Non-Target Room - Ghosting Effect
            roomMesh.material.transparent = true;
            roomMesh.material.opacity = 0.3;
        }
    });

    // Optional: Add a 3D Marker (Cone pointing down) above the target room
    if (targetMesh) {
        const markerGeo = new THREE.ConeGeometry(0.5, 1.5, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.rotation.x = Math.PI; // point down
        // Position it above the room
        marker.position.copy(targetMesh.position);
        marker.position.y += 3;
        scene.add(marker);

        // Point camera at target
        controls.target.copy(targetMesh.position);
        camera.position.set(targetMesh.position.x, 15, targetMesh.position.z + 10);
    }

    animate();
}
