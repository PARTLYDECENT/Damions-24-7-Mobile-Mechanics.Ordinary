class AutomotiveFactConsole {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.width = 340;
        this.height = 280;

        // Dodecahedron mathematical constants
        this.phi = (1 + Math.sqrt(5)) / 2;
        this.invPhi = 1 / this.phi;

        // Outer Dodecahedron Vertices (20 vertices)
        this.baseVertices = [
            // Cube vertices
            {x: -1, y: -1, z: -1}, {x: -1, y: -1, z: 1}, {x: -1, y: 1, z: -1}, {x: -1, y: 1, z: 1},
            {x: 1, y: -1, z: -1}, {x: 1, y: -1, z: 1}, {x: 1, y: 1, z: -1}, {x: 1, y: 1, z: 1},
            // Golden ratio plane points
            {x: 0, y: -this.invPhi, z: -this.phi}, {x: 0, y: -this.invPhi, z: this.phi},
            {x: 0, y: this.invPhi, z: -this.phi}, {x: 0, y: this.invPhi, z: this.phi},
            {x: -this.invPhi, y: -this.phi, z: 0}, {x: -this.invPhi, y: this.phi, z: 0},
            {x: this.invPhi, y: -this.phi, z: 0}, {x: this.invPhi, y: this.phi, z: 0},
            {x: -this.phi, y: 0, z: -this.invPhi}, {x: -this.phi, y: 0, z: this.invPhi},
            {x: this.phi, y: 0, z: -this.invPhi}, {x: this.phi, y: 0, z: this.invPhi}
        ];

        this.edges = [];
        this.generateEdges();

        // Inner Evolved Core: Icosahedron (12 vertices, 30 edges)
        // Scaled smaller (e.g. scale factor 0.5) to sit nested inside the dodecahedron
        this.innerVertices = [
            {x: 0, y: -1, z: -this.phi}, {x: 0, y: -1, z: this.phi},
            {x: 0, y: 1, z: -this.phi}, {x: 0, y: 1, z: this.phi},
            {x: -1, y: -this.phi, z: 0}, {x: -1, y: this.phi, z: 0},
            {x: 1, y: -this.phi, z: 0}, {x: 1, y: this.phi, z: 0},
            {x: -this.phi, y: 0, z: -1}, {x: -this.phi, y: 0, z: 1},
            {x: this.phi, y: 0, z: -1}, {x: this.phi, y: 0, z: 1}
        ].map(v => ({ x: v.x * 0.52, y: v.y * 0.52, z: v.z * 0.52 })); // scale down

        this.innerEdges = [];
        this.generateInnerEdges();

        // Animation states
        this.activeFact = "";
        this.displayText = "";
        this.textProgress = 0;
        this.textTimer = 0;

        // Bloop & morph states
        this.bloopParticles = [];
        this.morphProgress = 1.0; // Starts resolved
        this.dodecaScale = 38;

        // Fade in/out controls
        this.opacity = 0;
        this.displayTimer = 0;
        this.isDisplaying = false;
        
        // Loop controllers
        this.lastTime = 0;
        this.globalTime = 0;
        this.flickerIntensity = 1.0;
    }

    generateEdges() {
        const targetDist = 2 / this.phi;
        for (let i = 0; i < this.baseVertices.length; i++) {
            for (let j = i + 1; j < this.baseVertices.length; j++) {
                const dx = this.baseVertices[i].x - this.baseVertices[j].x;
                const dy = this.baseVertices[i].y - this.baseVertices[j].y;
                const dz = this.baseVertices[i].z - this.baseVertices[j].z;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (Math.abs(dist - targetDist) < 0.02) {
                    this.edges.push([i, j]);
                }
            }
        }
    }

    generateInnerEdges() {
        // Icosahedron edge length is 2 (before scaling).
        // Since we scaled vertices by 0.52, target edge length is 2 * 0.52 = 1.04
        const targetDist = 2 * 0.52;
        for (let i = 0; i < this.innerVertices.length; i++) {
            for (let j = i + 1; j < this.innerVertices.length; j++) {
                const dx = this.innerVertices[i].x - this.innerVertices[j].x;
                const dy = this.innerVertices[i].y - this.innerVertices[j].y;
                const dz = this.innerVertices[i].z - this.innerVertices[j].z;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (Math.abs(dist - targetDist) < 0.05) {
                    this.innerEdges.push([i, j]);
                }
            }
        }
    }

    init() {
        this.container = document.getElementById('automotive-fact-dodecahedron');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'automotive-fact-dodecahedron';
            document.body.appendChild(this.container);
        }

        this.container.innerHTML = '';

        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        this.container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.handleMobileState();
        });

        // Listen for fact triggers from live.js
        window.addEventListener('automotive-fact-triggered', (e) => {
            this.triggerFact(e.detail.text, e.detail.sourceX, e.detail.sourceY);
        });

        this.isLooping = true;
        this.handleMobileState();

        requestAnimationFrame((t) => this.tick(t));
    }

    handleMobileState() {
        const isMobile = window.innerWidth <= 1024;
        if (isMobile) {
            if (this.container) {
                this.container.style.display = 'none';
            }
            this.isLooping = false;
        } else {
            if (this.container) {
                this.container.style.display = 'block';
            }
            if (!this.isLooping) {
                this.isLooping = true;
                requestAnimationFrame((t) => this.tick(t));
            }
        }
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    triggerFact(text, sourceX, sourceY) {
        this.activeFact = text;
        this.displayText = "";
        this.textProgress = 0;
        this.textTimer = 0;

        const rect = this.canvas.getBoundingClientRect();
        const localSourceX = sourceX - rect.left;
        const localSourceY = sourceY - rect.top;

        // Reset morph to assemble a new dodecahedron
        this.morphProgress = 0.0;
        this.bloopParticles = [];
        this.isDisplaying = true;
        this.displayTimer = 9000; // Display for 9 seconds total

        // Generate 20 particles that represent vertices blooping from live feed
        for (let i = 0; i < 20; i++) {
            const vertex = this.baseVertices[i];
            this.bloopParticles.push({
                x: localSourceX,
                y: localSourceY,
                targetVertexIndex: i,
                controlX: localSourceX + (Math.random() - 0.5) * 120,
                controlY: Math.min(localSourceY, 140) - 100 - Math.random() * 80,
                alpha: 1.0
            });
        }
    }

    wrapText(text, maxChars) {
        const words = text.split(" ");
        const lines = [];
        let currentLine = "";

        words.forEach(word => {
            if ((currentLine + word).length < maxChars) {
                currentLine += (currentLine ? " " : "") + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    tick(time) {
        if (!this.isLooping) return;

        if (!this.lastTime) this.lastTime = time;
        const delta = time - this.lastTime;
        this.lastTime = time;
        this.globalTime += delta;

        this.update(delta);
        this.render();

        requestAnimationFrame((t) => this.tick(t));
    }

    update(delta) {
        // Handle fade in / out transition
        if (this.isDisplaying) {
            this.displayTimer -= delta;
            if (this.displayTimer > 1000) {
                this.opacity = Math.min(1.0, this.opacity + delta * 0.002);
            } else if (this.displayTimer <= 1000 && this.displayTimer > 0) {
                this.opacity = Math.max(0.0, this.opacity - delta * 0.0015);
            } else {
                this.opacity = 0;
                this.isDisplaying = false;
            }
        } else {
            this.opacity = 0;
        }

        if (!this.isDisplaying) return;

        // Handle typewriter progression
        if (this.morphProgress >= 1.0 && this.textProgress < this.activeFact.length) {
            this.textTimer += delta;
            if (this.textTimer > 25) {
                this.textProgress++;
                this.displayText = this.activeFact.substring(0, this.textProgress);
                this.textTimer = 0;
            }
        }

        // Screen flickering
        if (Math.random() > 0.98) {
            this.flickerIntensity = 0.88 + Math.random() * 0.12;
        } else {
            this.flickerIntensity = 0.98 + Math.random() * 0.02;
        }

        // Particle bloop progress
        if (this.morphProgress < 1.0) {
            this.morphProgress += delta * 0.0015;
            if (this.morphProgress >= 1.0) {
                this.morphProgress = 1.0;
            }

            const t = this.morphProgress;
            const targetCenterX = 85;
            const targetCenterY = 140;

            this.bloopParticles.forEach(p => {
                const ry = this.globalTime * 0.001;
                const rx = this.globalTime * 0.0007;
                const vertex = this.baseVertices[p.targetVertexIndex];

                let x1 = vertex.x * Math.cos(ry) - vertex.z * Math.sin(ry);
                let z1 = vertex.x * Math.sin(ry) + vertex.z * Math.cos(ry);
                let y1 = vertex.y * Math.cos(rx) - z1 * Math.sin(rx);
                let z1Rot = vertex.y * Math.sin(rx) + z1 * Math.cos(rx);

                const scale3d = 250 / (z1Rot * (1 - t) + 60);
                const localTargetX = targetCenterX + x1 * this.dodecaScale * scale3d * 0.025;
                const localTargetY = targetCenterY + y1 * this.dodecaScale * scale3d * 0.025;

                const mt = 1 - t;
                p.x = mt * mt * p.x + 2 * mt * t * p.controlX + t * t * localTargetX;
                p.y = mt * mt * p.y + 2 * mt * t * p.controlY + t * t * localTargetY;
            });
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.opacity <= 0) return;

        this.ctx.globalAlpha = this.opacity * this.flickerIntensity;

        // 1. RENDER BLACK FLUID LAKE BACKGROUND (Sine wave ripple backdrop layers)
        const waveBaseY = this.height - 35;
        this.ctx.save();
        
        // Loop to render 3 overlapping fluid layers
        for (let layer = 0; layer < 3; layer++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);
            this.ctx.lineTo(0, waveBaseY - 40);

            const phase = this.globalTime * 0.0008 + layer * 1.8;
            const amplitude = 9 - layer * 2.5;
            const waveFrequency = 0.012 + layer * 0.006;

            for (let x = 0; x <= this.width; x += 15) {
                const y = waveBaseY - 30 - Math.sin(x * waveFrequency + phase) * amplitude;
                this.ctx.lineTo(x, y);
            }
            this.ctx.lineTo(this.width, this.height);
            this.ctx.closePath();

            // Set dark void fluid lake gradient
            const grad = this.ctx.createLinearGradient(0, waveBaseY - 60, 0, this.height);
            if (layer === 0) {
                grad.addColorStop(0, 'rgba(2, 4, 10, 0.35)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
            } else if (layer === 1) {
                grad.addColorStop(0, 'rgba(0, 100, 115, 0.12)');
                grad.addColorStop(1, 'rgba(1, 2, 5, 0.95)');
            } else {
                grad.addColorStop(0, 'rgba(255, 94, 0, 0.06)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 1.0)');
            }

            this.ctx.fillStyle = grad;
            this.ctx.fill();

            // Draw glowing boundary line at top of fluid lake layer
            this.ctx.strokeStyle = layer === 1 ? 'rgba(0, 229, 255, 0.25)' : 
                                   layer === 2 ? 'rgba(255, 94, 0, 0.2)' : 'rgba(0, 229, 255, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        this.ctx.restore();

        const boxY = 15;
        const centerX = 85;
        const centerY = 140;

        // 2. DRAW DODECAHEDRON / BLOOP PARTICLES
        if (this.morphProgress < 1.0) {
            // Render incoming flying particle streams
            this.ctx.fillStyle = '#00e5ff';
            this.ctx.shadowColor = '#00e5ff';
            this.ctx.shadowBlur = 8;
            this.bloopParticles.forEach(p => {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.shadowBlur = 0;
        } else {
            // RENDER FULLY EVOLVED 3D DUAL-ROTATING HEDRON MATRIX
            
            // outer rotation angles
            const ryOuter = this.globalTime * 0.001;
            const rxOuter = this.globalTime * 0.0007;

            // inner core rotation angles (opposite spin & offset speed)
            const ryInner = -this.globalTime * 0.0015;
            const rxInner = -this.globalTime * 0.0011;

            const cameraDist = 55;

            // Project 20 outer vertices (Dodecahedron)
            const projectedOuter = [];
            this.baseVertices.forEach(v => {
                let x1 = v.x * Math.cos(ryOuter) - v.z * Math.sin(ryOuter);
                let z1 = v.x * Math.sin(ryOuter) + v.z * Math.cos(ryOuter);
                let y1 = v.y * Math.cos(rxOuter) - z1 * Math.sin(rxOuter);
                let z1Rot = v.y * Math.sin(rxOuter) + z1 * Math.cos(rxOuter);

                const scale = 250 / (z1Rot + cameraDist);
                const px = centerX + x1 * this.dodecaScale * scale * 0.22;
                const py = centerY + y1 * this.dodecaScale * scale * 0.22;

                projectedOuter.push({ x: px, y: py, z: z1Rot });
            });

            // Project 12 inner vertices (Icosahedron Core)
            const projectedInner = [];
            this.innerVertices.forEach(v => {
                let x1 = v.x * Math.cos(ryInner) - v.z * Math.sin(ryInner);
                let z1 = v.x * Math.sin(ryInner) + v.z * Math.cos(ryInner);
                let y1 = v.y * Math.cos(rxInner) - z1 * Math.sin(rxInner);
                let z1Rot = v.y * Math.sin(rxInner) + z1 * Math.cos(rxInner);

                const scale = 250 / (z1Rot + cameraDist);
                const px = centerX + x1 * this.dodecaScale * scale * 0.22;
                const py = centerY + y1 * this.dodecaScale * scale * 0.22;

                projectedInner.push({ x: px, y: py, z: z1Rot });
            });

            // 2A. Draw connecting lattice web (between outer and nearest inner points)
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
            this.ctx.lineWidth = 0.8;
            this.ctx.setLineDash([2, 3]);
            for (let i = 0; i < projectedOuter.length; i++) {
                // Find nearest inner vertex
                let minDist = 999999;
                let nearestIdx = 0;
                for (let j = 0; j < projectedInner.length; j++) {
                    const dx = projectedOuter[i].x - projectedInner[j].x;
                    const dy = projectedOuter[i].y - projectedInner[j].y;
                    const d = dx*dx + dy*dy;
                    if (d < minDist) {
                        minDist = d;
                        nearestIdx = j;
                    }
                }
                // Draw link
                this.ctx.beginPath();
                this.ctx.moveTo(projectedOuter[i].x, projectedOuter[i].y);
                this.ctx.lineTo(projectedInner[nearestIdx].x, projectedInner[nearestIdx].y);
                this.ctx.stroke();
            }
            this.ctx.setLineDash([]); // clear dash

            // 2B. Draw Outer Dodecahedron edges
            this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
            this.ctx.lineWidth = 1;
            this.edges.forEach(edge => {
                const p1 = projectedOuter[edge[0]];
                const p2 = projectedOuter[edge[1]];
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
            });

            // 2C. Draw Inner Icosahedron Core edges (Glowing Orange wireframe)
            this.ctx.strokeStyle = 'rgba(255, 94, 0, 0.5)';
            this.ctx.lineWidth = 0.8;
            this.innerEdges.forEach(edge => {
                const p1 = projectedInner[edge[0]];
                const p2 = projectedInner[edge[1]];
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
            });

            // 2D. Draw glowing vertex node points (Cyan outer, Orange inner)
            this.ctx.shadowBlur = 4;
            
            // Outer cyan nodes
            this.ctx.fillStyle = '#00e5ff';
            this.ctx.shadowColor = '#00e5ff';
            projectedOuter.forEach(p => {
                this.ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
            });

            // Inner orange core nodes
            this.ctx.fillStyle = '#ff5e00';
            this.ctx.shadowColor = '#ff5e00';
            projectedInner.forEach(p => {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            });

            this.ctx.shadowBlur = 0;
        }

        // 3. DRAW AUTOMOTIVE FACT TYPEWRITER TEXT BACKGROUND BUBBLE
        const textX = 165;
        const textY = boxY + 45;

        // Protective translucent black bubble
        this.ctx.beginPath();
        this.ctx.roundRect(textX - 12, textY - 15, 155, 145, 6);
        this.ctx.fillStyle = 'rgba(2, 3, 6, 0.88)';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 8;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Subtly frame the legibility bubble
        this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.font = '10px "Share Tech Mono", monospace';
        this.ctx.fillStyle = '#00e5ff';
        this.ctx.shadowColor = '#00e5ff';
        this.ctx.shadowBlur = 4;

        const lines = this.wrapText(this.displayText, 20);
        lines.forEach((line, idx) => {
            this.ctx.fillText(line, textX, textY + (idx * 16));
        });

        // Blinking cursor
        if (this.morphProgress >= 1.0 && this.textProgress < this.activeFact.length) {
            const lastLineIdx = lines.length - 1;
            const lastLineText = lines[lastLineIdx] || "";
            const cursorX = textX + this.ctx.measureText(lastLineText).width + 2;
            const cursorY = textY + (lastLineIdx * 16) - 8;

            if (Math.floor(this.globalTime / 150) % 2 === 0) {
                this.ctx.fillStyle = '#ff5e00';
                this.ctx.fillRect(cursorX, cursorY, 4, 10);
            }
        }
        this.ctx.shadowBlur = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const factConsole = new AutomotiveFactConsole();
    factConsole.init();
});
