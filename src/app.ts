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

const simHalfWidth = 60;
const simHalfHeight = 20;
const particleSystem = new ParticleSystem(1000, new Rect(-simHalfWidth, simHalfWidth, -simHalfHeight, simHalfHeight));
particleSystem.addParticles(scene, 0xff0000);
particleSystem.addBoundary(scene, 0xffffff);
particleSystem.addBlockage(new Rect(-simHalfWidth, simHalfWidth, -1, 1), scene, 0x0000ff);


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

function animate() {
    // camera.position.set(0, 0, 20*Math.sin(Date.now()/1000)**2);
    particleSystem.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
