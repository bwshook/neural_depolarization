import { MersenneTwister19937, real } from "random-js"
import * as THREE from 'three';

export class Rect {
    public left: number;
    public right: number;
    public bottom: number;
    public top: number;

    constructor(left = 0, right = 0, bottom = 0, top = 0) {
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
    }

    isPointInside(x: number, y: number) {
        return x >= this.left && x <= this.right && y >= this.bottom && y <= this.top;
    }
}

export class ParticleSystem {
    private positions: Float32Array;
    private velocities: Float32Array;
    private maxNumParticles: number;
    private activeParticles: boolean[];
    private boundaryBox: Rect;
    private rng: MersenneTwister19937;
    private geometry = new THREE.BufferGeometry();
    private blockages: Rect[] = [];
    private pumps: Rect[] = [];

    constructor(maxNumParticles: number, boundaryBox: Rect) {
        this.maxNumParticles = maxNumParticles;
        this.positions = new Float32Array(maxNumParticles * 3);
        this.velocities = new Float32Array(maxNumParticles * 3);
        this.activeParticles = new Array(maxNumParticles).fill(true);
        this.boundaryBox = boundaryBox;
        this.rng = MersenneTwister19937.seed(1234);

        const xPosDist = real(boundaryBox.left, boundaryBox.right);
        const yPosDist = real(boundaryBox.bottom, boundaryBox.top);
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
        const brownian = real(-0.01, 0.01);
        for (let i = 0; i < this.maxNumParticles; i++) {
            let x = i * 3;
            let y = x + 1;

            if (this.activeParticles[i]) {
                this.positions[x] += this.velocities[x];
                this.positions[y] += this.velocities[y];

                this.velocities[x] *= 0.99;
                this.velocities[y] *= 0.99;

                this.velocities[x] += brownian(this.rng);
                this.velocities[y] += brownian(this.rng);

                // Charge interaction
                const charge = -0.0005;
                for (let j = 0; j < this.maxNumParticles; j++) {
                    if (i !== j && this.activeParticles[j]) {
                        let jx = j * 3;
                        let jy = jx + 1;
                        let dx = this.positions[jx] - this.positions[x];
                        let dy = this.positions[jy] - this.positions[y];
                        let r2 = dx * dx + dy * dy;
                        let r1 = Math.sqrt(r2);
                        // Limit the interaction range
                        if (r1 < 0.1) {
                            continue;
                        }
                        let r3 = r1*r2;
                        this.velocities[x] += charge * dx / r3;
                        this.velocities[y] += charge * dy / r3;
                    }
                }

                // Boundary collision
                if (this.positions[x] < this.boundaryBox.left || this.positions[x] > this.boundaryBox.right) {
                    this.velocities[x] = -this.velocities[x];
                }
                if (this.positions[y] < this.boundaryBox.bottom || this.positions[y] > this.boundaryBox.top) {
                    this.velocities[y] = -this.velocities[y];
                }

                // Pump collision
                let pumpCollision = false;
                for (let pump of this.pumps) {
                    if (pump.isPointInside(this.positions[x], this.positions[y])) {
                        // Apply a force to move the particle towards the pump
                        this.velocities[x] = 0;
                        this.velocities[y] = 0.1;
                        pumpCollision = true;
                    }
                }
                if (pumpCollision) {
                    continue;
                }

                // Blockage collision
                for (let blockage of this.blockages) {
                    if (blockage.isPointInside(this.positions[x], this.positions[y])) {
                        // Apply a force to move the particle away from the blockage
                        this.velocities[y] = -0.9*this.velocities[y];
                    }
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

    addBoundary(scene: THREE.Scene, color: number) {
        const boundbox = createWireBox2D(this.boundaryBox, color);
        scene.add(boundbox);
    }

    addBlockage(blockage: Rect, scene: THREE.Scene, color: number) {
        const blockageBox = createWireBox2D(blockage, color);
        scene.add(blockageBox);
        this.blockages.push(blockage);
    }

    addPump(pump: Rect, scene: THREE.Scene, color: number) {
        const pumpBox = createWireBox2D(pump, color);
        scene.add(pumpBox);
        this.pumps.push(pump);
    }
}

function createWireBox2D(box: Rect, color: number) {
    const xSize = box.right - box.left;
    const ySize = box.top - box.bottom;
    const boxGeo = new THREE.BoxGeometry(xSize, ySize, 0);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxMat = new THREE.LineBasicMaterial({ color: color });
    const boxSegs = new THREE.LineSegments(boxEdges, boxMat);
    boxSegs.position.x = (box.left + box.right) / 2;
    boxSegs.position.y = (box.bottom + box.top) / 2;
    return boxSegs;
}