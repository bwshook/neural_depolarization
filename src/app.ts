import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create an empty BufferGeometry
const geometry = new THREE.BufferGeometry();
const positions = [];
const numParticles = 100;
for (let i = 0; i < numParticles; i++) {
    // Push x, y, z coordinates
    positions.push(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
}

// Create a Float32Array and set it as the position attribute
const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
geometry.setAttribute('position', positionAttribute);
const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1.0 });
const particles = new THREE.Points(geometry, material);
scene.add(particles)

function updatePositions() {
    // Calculate new positions (example logic)
    for (let i = 0; i < numParticles; i++) {
        geometry.attributes.position.array[i * 3 + 0] += (Math.random() - 0.5) * 0.1;  // X
        geometry.attributes.position.array[i * 3 + 1] += (Math.random() - 0.5) * 0.1;  // Y
        geometry.attributes.position.array[i * 3 + 2] += (Math.random() - 0.5) * 0.1;  // Z
    }

    // Notify Three.js that the positions have changed
    geometry.attributes.position.needsUpdate = true;
}

function animate() {
    camera.position.set(0, 0, 20*Math.sin(Date.now()/1000)**2);
    updatePositions();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
