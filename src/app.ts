import * as THREE from 'three';
import { ParticleSystem, Rect } from './ParticleSystem';
import linspace from '@stdlib/array-linspace';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add depolarize button
const depolarizeBtn = document.createElement('button');
depolarizeBtn.textContent = 'Depolarize';
depolarizeBtn.style.position = 'absolute';
depolarizeBtn.style.top = '10px';
depolarizeBtn.style.left = '10px';
depolarizeBtn.style.padding = '8px 16px';
depolarizeBtn.style.fontSize = '16px';
depolarizeBtn.style.cursor = 'pointer';
document.body.appendChild(depolarizeBtn);

const simHalfWidth = 60;
const simHalfHeight = 20;
const particleSystem = new ParticleSystem(1000, new Rect(-simHalfWidth, simHalfWidth, -simHalfHeight, simHalfHeight));
particleSystem.addParticlesToScene(scene, 0xff0000);
particleSystem.addBoundaryToScene(scene, 0xffffff);
particleSystem.addBlockage(new Rect(-simHalfWidth, simHalfWidth, -1, 1), scene, 0x0000ff);
particleSystem.createParticles(30, new Rect(-simHalfWidth, simHalfWidth, 0.1, simHalfHeight));

let locs = linspace(-0.9*simHalfWidth, 0.9*simHalfWidth, 18, {endpoint: true});
for (let i = 0; i < locs.length; i++) {
    const chanWidth = 1;
    if (i % 4 == 0) {
        particleSystem.addPump(new Rect(locs[i]-chanWidth, locs[i]+chanWidth, -1.5, 1.5), scene, 0xff0000);
    } else {
        particleSystem.addGate(new Rect(locs[i]-chanWidth, locs[i]+chanWidth, -1.5, 1.5), scene);
    }
}

particleSystem.addConstantConcentration(new Rect(-simHalfWidth, simHalfWidth, -simHalfHeight, -0.5), 200);

// Add depolarize button click handler
depolarizeBtn.addEventListener('click', () => {
    particleSystem.forceOpenGates();
});

function animate() {
    particleSystem.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();