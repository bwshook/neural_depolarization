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

    getCenter() {
        return new THREE.Vector2((this.left + this.right) / 2, (this.bottom + this.top) / 2);
    }
}

class Gate extends Rect {
    public isOpen: boolean = false;
    public gateBox: THREE.LineSegments;
    public fieldVector: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
    public fieldArrow: THREE.ArrowHelper;

    constructor(rect: Rect, scene: THREE.Scene) {
        super(rect.left, rect.right, rect.bottom, rect.top);

        this.gateBox = createWireBox2D(rect, 0xffffff);
        scene.add(this.gateBox);

        const origin = new THREE.Vector3((rect.left+rect.right)/2, (rect.bottom+rect.top)/2, 0);
        this.fieldArrow = new THREE.ArrowHelper(this.fieldVector, origin, 1, 0xffffff);
        scene.add(this.fieldArrow);

        this.close();
    }

    open() {
        this.isOpen = true;
        this.gateBox.material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    }

    close() {
        this.isOpen = false;
        this.gateBox.material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    }

    update(particlePositions: Float32Array, particleCount: number) {
        // Integrate electric field to determine if the gate is open
        let efield = new THREE.Vector3(0, 0, 0);
        for (let i = 0; i < particleCount; i++) {
            let x = i * 3;
            let y = x + 1;
            let mx = (this.left + this.right) / 2;
            let my = (this.bottom + this.top) / 2;
            let r12 = new THREE.Vector3(mx - particlePositions[x], my - particlePositions[y], 0);
            let r12n = r12.clone().normalize();
            efield.add(r12n.divideScalar(r12.lengthSq()));
        }
        this.fieldArrow.setDirection(efield.clone().normalize());
        this.fieldArrow.setLength(efield.length());

        // const debugElement = document.getElementById("debug");
        // if (debugElement) {
        //     debugElement.innerText = efield.y.toFixed(2);
        // }

        if (efield.y < -0.4) {
            this.open();
            this.fieldArrow.setColor(0xff0000);
        } 
        else if (efield.y > 0.0) {
            this.close();
        }
    }
}

class ConstantConcentration extends Rect {
    public concentration: number;

    constructor(rect: Rect, concentration: number) {
        super(rect.left, rect.right, rect.bottom, rect.top);
        this.concentration = concentration;
    }

    update(particlePositions: Float32Array, activeParticles: boolean[], particleCount: number, rng: MersenneTwister19937) {
        let count = countParticles(particlePositions, this, particleCount);

        if (count < this.concentration) {
            let xDist = real(this.left, this.right);
            let yDist = real(this.bottom, this.top);
            for (let i = 0; i < particleCount; i++) {
                if (!activeParticles[i]) {
                    let x = i * 3;
                    let y = x + 1;
                    particlePositions[x] = xDist(rng);
                    particlePositions[y] = yDist(rng);
                    activeParticles[i] = true;
                    break;
                }
            }
        }

        if (count > this.concentration) {
            for (let i = 0; i < particleCount; i++) {
                if (activeParticles[i]) {
                    let x = i * 3;
                    let y = x + 1;
                    particlePositions[x] = 1000;
                    particlePositions[y] = 1000;
                    activeParticles[i] = false;
                    break;
                }
            }
        }

        const debugElement = document.getElementById("debug2");
        if (debugElement) {
            debugElement.innerText = count.toString();
        }
    }
}

function countParticles(particlePositions: Float32Array, area: Rect, particleCount: number) {
    let count = 0;
    for (let i = 0; i < particleCount; i++) {
        let x = i * 3;
        let y = x + 1;
        if (area.isPointInside(particlePositions[x], particlePositions[y])) {
            count++;
        }
    }
    return count;
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
    private gates: Gate[] = [];
    private constantConcentrations: ConstantConcentration[] = [];

    constructor(maxNumParticles: number, boundaryBox: Rect) {
        this.maxNumParticles = maxNumParticles;
        this.positions = new Float32Array(maxNumParticles * 3);
        this.velocities = new Float32Array(maxNumParticles * 3);
        this.activeParticles = new Array(maxNumParticles).fill(false);
        this.boundaryBox = boundaryBox;
        this.rng = MersenneTwister19937.seed(1234);

        // const xPosDist = real(boundaryBox.left, boundaryBox.right);
        // const yPosDist = real(boundaryBox.bottom, boundaryBox.top);
        // const yPosDist = real(2, boundaryBox.top);
        // const yPosDist = real(boundaryBox.bottom, -2);
        // const xVelDist = real(-0.1, 0.1);
        // const yVelDist = real(-0.1, 0.1);
        for (let i = 0; i < maxNumParticles; i++) {
            let x = i * 3;
            let y = x + 1;
            let z = x + 2;

            this.positions[x] = 1000;
            this.positions[y] = 1000;
            this.positions[z] = 0;

            this.velocities[x] = 0;
            this.velocities[y] = 0;
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
        // Gate update
        for (let gate of this.gates) {
            gate.update(this.positions, this.maxNumParticles);
        }

        // Constant concentration update
        for (let concentration of this.constantConcentrations) {
            concentration.update(this.positions, this.activeParticles, this.maxNumParticles, this.rng);
        }

        // Particle movement
        const brownian = real(-0.04, 0.04);
        const Cdrag = 0.08;
        const charge = 0.02;
        for (let i = 0; i < this.maxNumParticles; i++) {
            if (!this.activeParticles[i]) {
                continue;
            }
            let x = i * 3;
            let y = x + 1;

            this.positions[x] += this.velocities[x];
            this.positions[y] += this.velocities[y];

            // Charge interaction
            const r1 = new THREE.Vector3(this.positions[x], this.positions[y], 0);
            let fx = 0;
            let fy = 0;
            for (let j = 0; j < this.maxNumParticles; j++) {
                const forceLimit = 0.10;
                // Charge interaction
                if (i !== j && this.activeParticles[j]) {
                    const jx = j * 3;
                    const jy = jx + 1;
                    const r2 = new THREE.Vector3(this.positions[jx], this.positions[jy], 0);
                    const f = chargeForce(charge, r1, r2);
                    fx += clamp(f.x, -forceLimit, forceLimit);
                    fy += clamp(f.y, -forceLimit, forceLimit);
                }
            }

            // Pump interaction
            const pumpCharge = 0.2;
            for (let pump of this.pumps) {
                if (pump.isPointInside(this.positions[x], this.positions[y])) {
                    continue;
                }
                // Charge 1
                const forceLimit = 0.5;
                const mx = (pump.left + pump.right) / 2;
                let r2 = new THREE.Vector3(mx, pump.top, 0);
                let f = chargeForce(pumpCharge, r1, r2);
                fx += clamp(f.x, -forceLimit, forceLimit);
                fy += clamp(f.y, -forceLimit, forceLimit);

                // Charge 2
                r2 = new THREE.Vector3(mx, pump.bottom, 0);
                f = chargeForce(-pumpCharge, r1, r2);
                fx += clamp(f.x, -forceLimit, forceLimit);
                fy += clamp(f.y, -forceLimit, forceLimit);
            }

            this.velocities[x] += fx;
            this.velocities[y] += fy;

            // Brownian motion
            // this.velocities[x] += brownian(this.rng);
            // this.velocities[y] += brownian(this.rng);

            // Apply drag force
            this.velocities[x] -= Cdrag*this.velocities[x];
            this.velocities[y] -= Cdrag*this.velocities[y];

            // Boundary collision
            let nextX = this.positions[x] + this.velocities[x];
            let nextY = this.positions[y] + this.velocities[y];
            if (nextX < this.boundaryBox.left || nextX > this.boundaryBox.right) {
                this.velocities[x] = -this.velocities[x];
            }
            if (nextY < this.boundaryBox.bottom || nextY > this.boundaryBox.top) {
                this.velocities[y] = -this.velocities[y];
            }

            // Pump collision
            let pumpCollision = false;
            for (let pump of this.pumps) {
                if (pump.isPointInside(this.positions[x], this.positions[y])) {
                    // Apply a force to move the particle towards the pump
                    this.positions[y] = pump.top+1;
                    this.velocities[x] = 0.1*this.velocities[x];
                    this.velocities[y] = 0.1*this.velocities[y];
                    pumpCollision = true;
                }
            }
            if (pumpCollision) {
                continue;
            }

            // Gate collision
            let gateCollision = false;
            for (let gate of this.gates) {
                if (gate.isOpen) {
                    if (gate.isPointInside(this.positions[x], this.positions[y])) {
                        this.positions[y] = gate.bottom-1;
                        gateCollision = true;
                        break;
                    }
                } else if (gate.isPointInside(nextX, nextY)) {
                    // Apply force to move the particle away from the gate
                    let origin = gate.getCenter();
                    this.velocities[x] += 0.01*(this.positions[x] - origin.x);
                    this.velocities[y] += 0.01*(this.positions[y] - origin.y);
                    gateCollision = true;
                    break;
                }
            }
            if (gateCollision) {
                continue;
            }

            // Blockage collision
            for (let blockage of this.blockages) {
                if (blockage.isPointInside(this.positions[x], this.positions[y])) {
                    // Apply a force to move the particle away from the blockage
                    let dy = this.positions[y] - (blockage.bottom + blockage.top) / 2;
                    this.velocities[y] += 0.05*dy;
                }
            }
        }
        this.geometry.attributes.position.needsUpdate = true;

        let count = countParticles(
            this.positions, 
            new Rect(this.boundaryBox.left, this.boundaryBox.right, 0.5, this.boundaryBox.top), 
            this.maxNumParticles
        );
        const debugElement = document.getElementById("debug1");
        if (debugElement) {
            debugElement.innerText = count.toString();
        }
    }

    getPositions() {
        return this.positions;
    }

    getVelocities() {
        return this.velocities;
    }

    addParticles(scene: THREE.Scene, color: number) {
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

    addGate(gate: Rect, scene: THREE.Scene) {
        this.gates.push(new Gate(gate, scene));
    }

    addConstantConcentration(area: Rect, concentration: number) {
        let constantConstraint = new ConstantConcentration(area, concentration);
        this.constantConcentrations.push(constantConstraint);
    }

}

function chargeForce(charge: number, r1: THREE.Vector3, r2: THREE.Vector3) {
    const r12 = r1.clone().sub(r2);
    const r12n = r12.clone().normalize();
    return r12n.multiplyScalar(charge/r12.lengthSq());
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
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