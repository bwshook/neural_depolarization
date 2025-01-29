import * as THREE from 'three';
import { ParticleSystem, Rect } from './ParticleSystem';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const particleSystem = new ParticleSystem(100, new Rect(-20, 20, -20, 20));
particleSystem.addToScene(scene, 0xff0000);
particleSystem.addBoundary(scene, 0xffffff);
particleSystem.addBlockage(new Rect(-20, 20, -1, 1), scene, 0x0000ff);
particleSystem.addPump(new Rect(-7, -3, -1.5, 1.5), scene, 0xff0000);
particleSystem.addPump(new Rect(3, 7, -1.5, 1.5), scene, 0xff0000);

function animate() {
    // camera.position.set(0, 0, 20*Math.sin(Date.now()/1000)**2);
    particleSystem.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
