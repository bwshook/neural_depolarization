import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// const geometry = new THREE.BufferGeometry();
// const material = new THREE.PointsMaterial({ color: 0xffffff, size: 10.0 });
// const particles = new THREE.Points(geometry, material);
// scene.add(particles);

const material = new THREE.LineBasicMaterial({ color: 0xffffff });
const points = [];
points.push(new THREE.Vector3(-10, 0, 0));
points.push(new THREE.Vector3(0, 10, 0));
points.push(new THREE.Vector3(10, 0, 0));
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const line = new THREE.Line(geometry, material);
scene.add(line)

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
