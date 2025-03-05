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

// Add potential plot canvas
const plotCanvas = document.createElement('canvas');
plotCanvas.width = 300;
plotCanvas.height = 150;
plotCanvas.style.position = 'absolute';
plotCanvas.style.bottom = '10px';
plotCanvas.style.right = '10px';
plotCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
plotCanvas.style.border = '1px solid #444';
plotCanvas.style.width = '300px';  // Force display size
plotCanvas.style.height = '150px'; // Force display size
document.body.appendChild(plotCanvas);

const ctx = plotCanvas.getContext('2d')!;
ctx.strokeStyle = '#00ff00';
ctx.lineWidth = 2;

// Store last 300 potential values (1 per pixel width)
const potentialHistory: number[] = new Array(300).fill(1);
let currentIndex = 0;

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

function updatePotentialPlot() {
    const potential = particleSystem.getMembranePotential();
    potentialHistory[currentIndex] = potential;
    currentIndex = (currentIndex + 1) % potentialHistory.length;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, plotCanvas.width, plotCanvas.height);

    // Draw grid
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = i * plotCanvas.height / 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotCanvas.width, y);
        ctx.stroke();
    }

    // Draw potential line
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < potentialHistory.length; i++) {
        const x = i;
        const y = plotCanvas.height - (potentialHistory[(i + currentIndex) % potentialHistory.length] * plotCanvas.height / 4);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('Time →', plotCanvas.width - 50, plotCanvas.height - 5);
    ctx.fillText('Vm', 5, 15);
}

function animate() {
    particleSystem.update();
    updatePotentialPlot();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();