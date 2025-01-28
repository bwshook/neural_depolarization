import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const topParticleSystem = new ParticleSystem(30, -20, 20, -20, 0);
const botParticleSystem = new ParticleSystem(30, -20, 20, 0, 20);
topParticleSystem.addToScene(scene, 0xff0000);
topParticleSystem.addBoundariesToScene(scene, 0xffffff);
botParticleSystem.addToScene(scene, 0x0000ff);
botParticleSystem.addBoundariesToScene(scene, 0xffffff);

function animate() {
    // camera.position.set(0, 0, 20*Math.sin(Date.now()/1000)**2);
    topParticleSystem.update();
    botParticleSystem.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
