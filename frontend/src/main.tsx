import * as THREE from 'three';
import { savePlayerPosition } from './logic.js';

// 1. Basic Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Add Visual Reference (Cube)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Initial Camera Position
camera.position.z = 5;

// 3. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate cube for visual feedback
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Simulate Camera Movement (Orbiting)
    // This ensures coordinates change so the logic.js throttle check passes
    const time = Date.now() * 0.0005;
    camera.position.x = Math.sin(time) * 3;
    camera.position.z = Math.cos(time) * 3;
    camera.lookAt(0, 0, 0);

    // 4. Call Firestore Logic
    // Passing current coordinates to the throttled saver
    savePlayerPosition(
        camera.position.x, 
        camera.position.y, 
        camera.position.z
    );

    renderer.render(scene, camera);
}

// Start Loop
animate();