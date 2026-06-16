import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.05);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 20;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Materials (Emotion-based)
// Base material that we will modify based on mouse movement
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.1,
    roughness: 0.9,
});

// Environment (Walls/Pillars)
const objects = [];
const geometry = new THREE.BoxGeometry(1, 4, 1);
for (let i = 0; i < 20; i++) {
    const mesh = new THREE.Mesh(geometry, wallMaterial);
    const angle = (i / 20) * Math.PI * 2;
    const radius = 6 + Math.random() * 4;
    mesh.position.x = Math.cos(angle) * radius;
    mesh.position.z = Math.sin(angle) * radius;
    mesh.position.y = 2;
    // Look at center
    mesh.lookAt(0, 2, 0);
    scene.add(mesh);
    objects.push(mesh);
}

// Courtyard Indicator (Center Area)
const courtyardGeo = new THREE.CylinderGeometry(3, 3, 0.1, 32);
const courtyardMat = new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true });
const courtyard = new THREE.Mesh(courtyardGeo, courtyardMat);
courtyard.position.y = 0.05;
scene.add(courtyard);

const floorGeo = new THREE.PlaneGeometry(50, 50);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Interaction State
let mouseSpeed = 0;
let lastMousePos = { x: 0, y: 0 };
let inCourtyard = false;

// Audio Context (Mock for now, just logical state)
// In a real app we'd use Web Audio API to filter noise

// Event Listeners
window.addEventListener('resize', onWindowResize);
document.addEventListener('mousemove', onMouseMove);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    const currentPos = { x: event.clientX, y: event.clientY };
    const dx = currentPos.x - lastMousePos.x;
    const dy = currentPos.y - lastMousePos.y;
    
    // Calculate simple speed
    const speed = Math.sqrt(dx * dx + dy * dy);
    mouseSpeed = THREE.MathUtils.lerp(mouseSpeed, speed, 0.1);
    
    lastMousePos = currentPos;
}

// UI Elements
const uiCoords = document.getElementById('gps-coords');
const uiState = document.getElementById('state-indicator');
const uiLayer = document.getElementById('ui-layer');

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    
    // 1. Emotion-based Material Logic
    // Decay mouse speed
    mouseSpeed *= 0.95; 
    
    // Map speed to material properties (High speed = anxious/metallic, Low speed = calm/rough)
    const targetMetalness = THREE.MathUtils.clamp(mouseSpeed * 0.05, 0.1, 0.9);
    const targetRoughness = THREE.MathUtils.clamp(1.0 - (mouseSpeed * 0.05), 0.1, 0.9);
    
    wallMaterial.metalness = THREE.MathUtils.lerp(wallMaterial.metalness, targetMetalness, 0.1);
    wallMaterial.roughness = THREE.MathUtils.lerp(wallMaterial.roughness, targetRoughness, 0.1);
    
    if (mouseSpeed > 10) {
        wallMaterial.color.setHex(0x884444); // Slight reddish tint when agitated
    } else {
        wallMaterial.color.lerp(new THREE.Color(0x555555), 0.05); // Back to calm grey
    }

    // 2. Courtyard Detection
    // Check distance of camera to center (0,0,0)
    const distToCenter = camera.position.length();
    const wasInCourtyard = inCourtyard;
    
    if (distToCenter < 4.0) {
        inCourtyard = true;
    } else {
        inCourtyard = false;
    }
    
    // Handle State Change
    if (inCourtyard && !wasInCourtyard) {
        // Entered Courtyard
        uiCoords.classList.add('glitch');
        uiCoords.innerText = "LAT ER.ROR | LON GL.ITCH";
        uiState.innerText = "State: Cognitive Reset (Silence)";
        scene.fog.color.setHex(0xffffff); // White out effect
        scene.fog.density = 0.2;
    } else if (!inCourtyard && wasInCourtyard) {
        // Exited Courtyard
        uiCoords.classList.remove('glitch');
        uiCoords.innerText = "LAT 48.8566 | LON 2.3522";
        uiState.innerText = "State: Exploring";
        scene.fog.color.setHex(0x000000);
        scene.fog.density = 0.05;
    }
    
    renderer.render(scene, camera);
}

animate();
