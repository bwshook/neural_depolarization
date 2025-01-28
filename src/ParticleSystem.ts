import { MersenneTwister19937, real } from "random-js"
import * as THREE from 'three';

export class ParticleSystem {
    private positions: Float32Array;
    private velocities: Float32Array;
    private maxNumParticles: number;
    private activeParticles: boolean[];
    private boundaryBox: [left: number, right: number, bottom: number, top: number];
    private rng: MersenneTwister19937;
    private geometry = new THREE.BufferGeometry();

    constructor(maxNumParticles: number, left: number, right: number, bottom: number, top: number) {
        this.maxNumParticles = maxNumParticles;
        this.positions = new Float32Array(maxNumParticles * 3);
        this.velocities = new Float32Array(maxNumParticles * 3);
        this.activeParticles = new Array(maxNumParticles).fill(true);
        this.boundaryBox = [left, right, bottom, top];
        this.rng = MersenneTwister19937.seed(1234);

        const xPosDist = real(left, right);
        const yPosDist = real(bottom, top);
        const xVelDist = real(-0.1, 0.1);
        const yVelDist = real(-0.1, 0.1);
        for (let i = 0; i < maxNumParticles; i++) {
            let x = i * 3;
            let y = x + 1;
            let z = x + 2;

            this.positions[x] = xPosDist(this.rng);
            this.positions[y] = yPosDist(this.rng);
            this.positions[z] = 0;

            this.velocities[x] = xVelDist(this.rng);
            this.velocities[y] = yVelDist(this.rng);
            this.velocities[z] = 0;
        }
    }

    setParticleActive(index: number, active: boolean) {
        if (index >= 0 && index < this.maxNumParticles) {
            this.activeParticles[index] = active;
            if (!active) {
                // Move particle off-screen when inactive
                this.positions[index * 3] = 1000;
                this.positions[index * 3 + 1] = 1000;
            }
        }
    }

    update() {
        for (let i = 0; i < this.maxNumParticles; i++) {
            let x = i * 3;
            let y = x + 1;

            if (this.activeParticles[i]) {
                this.positions[x] += this.velocities[x];
                this.positions[y] += this.velocities[y];

                if (this.positions[x] < this.boundaryBox[0] || this.positions[x] > this.boundaryBox[1]) {
                    this.velocities[x] = -this.velocities[x];
                }
                if (this.positions[y] < this.boundaryBox[2] || this.positions[y] > this.boundaryBox[3]) {
                    this.velocities[y] = -this.velocities[y];
                }
            }
        }
        this.geometry.attributes.position.needsUpdate = true;
    }

    getPositions() {
        return this.positions;
    }

    getVelocities() {
        return this.velocities;
    }

    addToScene(scene: THREE.Scene, color: number) {
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.getPositions(), 3));
        const material = new THREE.PointsMaterial({ color: color, size: 0.2 });
        const points = new THREE.Points(this.geometry, material);
        scene.add(points);
        return points;
    }

    getParticleGeometry() {
        return this.geometry;
    }

    addBoundariesToScene(scene: THREE.Scene, color: number) {
        function createWireBox(xSize: number, ySize: number, zSize: number, color: number) {
            const boxGeo = new THREE.BoxGeometry(xSize, ySize, zSize);
            const boxEdges = new THREE.EdgesGeometry(boxGeo);
            const boxMat = new THREE.LineBasicMaterial({ color: color });
            return new THREE.LineSegments(boxEdges, boxMat);
        }

        const simWidth = this.boundaryBox[1] - this.boundaryBox[0];
        const simHeight = this.boundaryBox[3] - this.boundaryBox[2];
        const upperSimBox = createWireBox(simWidth, simHeight, 0, color);
        upperSimBox.position.x = (this.boundaryBox[1] + this.boundaryBox[0]) / 2;
        upperSimBox.position.y = (this.boundaryBox[3] + this.boundaryBox[2]) / 2;
        scene.add(upperSimBox);
    }
}
