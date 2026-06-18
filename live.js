class LiveFeedConsole {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.width = 380;
        this.height = 280;
        
        // 2026 Era automotive void diagnostics and facts
        this.messages = [
            "CRITICAL: Autopilot refused to merge, claiming the other vehicle had 'bad vibes'.",
            "ALARM: Cyber-Truck battery swelled to size of a queen mattress. Venting gas.",
            "WARNING: OTA firmware update failed. Car is now legally registered as a toaster.",
            "INFO: Steering-wheel subscription expired. Purchase 50 Miles for $4.99?",
            "ALERT: Drive-by-wire latency exceeds 1.5 seconds. Initiating prayer mode.",
            "CRITICAL: Quantum ECU has achieved sentience and is currently crying in the garage.",
            "ALARM: EV motor mining dogecoin at traffic lights. Cooling loop at 105°C.",
            "WARNING: LiDAR sensor blinded by dynamic holographic advertisement billboard.",
            "INFO: Solid-state battery cooling fan playing Lo-Fi hip hop beats.",
            "ALARM: Smart suspension set itself to 'Trampoline Mode' after hitting pothole.",
            "CRITICAL: Digital key decrypted by nearby microwave oven. Doors unlocked.",
            "WARN: Neural-link steering interface reporting 'intense boredom' from driver.",
            "INFO: Exhaust emulator speaker has caught fire reproducing V8 engine sounds.",
            "FAILURE: AR windshield HUD is showing a red line that doesn't exist.",
            "WARN: Passenger seat ejected after voice command 'open the glovebox' was misheard.",
            "FACT: A loose gas cap can trigger the Check Engine Light.",
            "FACT: sweet maple syrup smell often indicates a coolant leak.",
            "FACT: brake fluid absorbs water from the air over time.",
            "FACT: Right to Repair laws ensure independent shop access.",
            "FACT: dirty LiDAR cameras make lane detection feel nervous.",
            "FACT: EV battery packs expand up to 4% during fast charging."
        ];

        this.logs = [];
        this.maxLogs = 6;
        this.particles = [];
        this.occurrenceCount = 0;
        
        // Ready bar telemetry states
        this.readyBarProgress = 0;
        this.readyBarDirection = 1;
        this.readyBarState = "CONNECTED";
        this.readyBarTimer = 0;
        
        this.tornEdgeSeed = Math.random() * 1000;
        
        // Loop controllers
        this.lastTime = 0;
        this.messageTimer = 0;
        this.flickerIntensity = 1.0;
        this.globalTime = 0;
        this.elapsedTime = 0;

        // Hidden canvas to scan letters for 3D coordinates
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = 16;
        this.offscreenCanvas.height = 16;
        this.offCtx = this.offscreenCanvas.getContext('2d');
    }

    init() {
        this.container = document.getElementById('info-stream-console');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'info-stream-console';
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

        // Initial logs
        this.addLog("SYSTEM BOOT: CONNECTING TO 2026 AUTO-VOID...", true);
        this.addLog("COSMIC QUANTUM CODES LOADED.", false);

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

    // Rasterizes a glyph to find target particle positions
    getGlyphNodes(char) {
        this.offCtx.clearRect(0, 0, 16, 16);
        this.offCtx.font = 'bold 10px "Share Tech Mono", monospace';
        this.offCtx.fillStyle = '#ffffff';
        this.offCtx.textBaseline = 'middle';
        this.offCtx.textAlign = 'center';
        this.offCtx.fillText(char, 8, 8);

        const imgData = this.offCtx.getImageData(0, 0, 16, 16);
        const data = imgData.data;
        const nodes = [];

        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const alpha = data[(y * 16 + x) * 4 + 3];
                if (alpha > 130) {
                    // Coordinates relative to character center
                    nodes.push({
                        tx: (x - 8) * 0.9,
                        ty: (y - 8) * 0.9,
                        // Initial 3D coordinates on a sphere shell
                        x3d: (Math.random() - 0.5) * 20,
                        y3d: (Math.random() - 0.5) * 20,
                        z3d: (Math.random() - 0.5) * 20
                    });
                }
            }
        }
        return nodes;
    }

    addLog(text, isHighlight = false) {
        this.occurrenceCount++;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const prefix = `[${timestamp}] `;
        
        const chars = [];
        let staggerDelay = 0;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nodes = this.getGlyphNodes(char);
            
            chars.push({
                targetChar: char,
                nodes: nodes,
                state: char === ' ' ? 'resolved' : 'waiting',
                timer: 0,
                delay: staggerDelay,
                duration: 400, // duration of morph in milliseconds
                x: 0,
                y: 0
            });
            
            // Stagger typing sequence
            staggerDelay += 45;
        }

        this.logs.push({
            prefix: prefix,
            chars: chars,
            isHighlight: isHighlight,
            complete: false
        });

        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Bloop event trigger if this is an automotive fact
        if (text.startsWith("FACT:")) {
            const rect = this.canvas.getBoundingClientRect();
            window.dispatchEvent(new CustomEvent('automotive-fact-triggered', {
                detail: {
                    text: text.replace("FACT: ", ""),
                    sourceX: rect.left + 150,
                    sourceY: rect.top + 100
                }
            }));
        }
    }

    getNoise(seed, val) {
        const x = Math.sin(seed + val) * 10000;
        return x - Math.floor(x);
    }

    drawTornEdge(x1, y1, x2, y2, seed, roughness = 5, detail = 8) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(5, Math.floor(dist / detail));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            let px = x1 + dx * t;
            let py = y1 + dy * t;

            if (i > 0 && i < steps) {
                const perpX = -dy / dist;
                const perpY = dx / dist;
                const noiseVal = this.getNoise(seed, i * 7.7);
                const offset = (noiseVal - 0.5) * roughness;
                px += perpX * offset;
                py += perpY * offset;
            }
            this.ctx.lineTo(px, py);
        }
    }

    drawTornBox(x, y, w, h, roughness, seed) {
        this.ctx.beginPath();
        this.drawTornEdge(x, y, x + w, y, seed, roughness);
        this.drawTornEdge(x + w, y, x + w, y + h, seed + 1.2, roughness);
        this.drawTornEdge(x + w, y + h, x, y + h, seed + 2.4, roughness);
        this.drawTornEdge(x, y + h, x, y, seed + 3.6, roughness);
        this.ctx.closePath();
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
        this.elapsedTime += delta;
        this.messageTimer += delta;

        // Custom timing schedule:
        // - first 1 minute (0s to 60s): every 5 seconds
        // - next 2 minutes (60s to 180s): every 30 seconds
        // - after 3 minutes (> 180s): every 5 minutes
        let interval = 5000;
        if (this.elapsedTime >= 60000 && this.elapsedTime < 180000) {
            interval = 30000;
        } else if (this.elapsedTime >= 180000) {
            interval = 300000;
        }

        if (this.messageTimer > interval) {
            const msg = this.messages[Math.floor(Math.random() * this.messages.length)];
            this.addLog(msg, Math.random() > 0.8);
            this.messageTimer = 0;
        }

        // Ready Bar loading animation
        this.readyBarProgress += delta * 0.0012 * this.readyBarDirection;
        if (this.readyBarProgress > 1.0) {
            this.readyBarProgress = 1.0;
            this.readyBarDirection = -1;
        } else if (this.readyBarProgress < 0.0) {
            this.readyBarProgress = 0.0;
            this.readyBarDirection = 1;
        }

        // Blinking system ready indicator
        this.readyBarTimer += delta;
        if (this.readyBarTimer > 500) {
            this.readyBarState = this.readyBarState === "CONNECTED" ? "ONLINE" : "CONNECTED";
            this.readyBarTimer = 0;
        }

        // Screen intensity fluctuations
        if (Math.random() > 0.97) {
            this.flickerIntensity = 0.85 + Math.random() * 0.15;
        } else {
            this.flickerIntensity = 0.97 + Math.random() * 0.03;
        }

        // Update morph status
        this.logs.forEach(log => {
            let allComplete = true;
            log.chars.forEach(char => {
                if (char.state === 'resolved') return;
                allComplete = false;

                if (char.state === 'waiting') {
                    char.delay -= delta;
                    if (char.delay <= 0) {
                        char.state = 'geometric';
                    }
                } else if (char.state === 'geometric') {
                    char.timer += delta;
                    if (char.timer >= char.duration) {
                        char.state = 'resolved';
                        this.spawnParticles(char.x, char.y, log.isHighlight ? '#fff' : '#00e5ff');
                    }
                }
            });
            log.complete = allComplete;
        });

        // Update particle debris
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= delta * 0.0025;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 2.0,
                vy: (Math.random() - 0.5) * 2.0 - 0.5,
                size: Math.random() * 2 + 1,
                alpha: 1.0,
                color: color
            });
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.globalAlpha = this.flickerIntensity;

        const boxX = 15;
        const boxY = 15;
        const boxW = this.width - 30;
        const boxH = this.height - 30;
        const extrusion = 10;

        // 1. RENDER 3D REAR EXTRUSION (Glowing Cyber-Amber Outline with Torn Edge)
        this.ctx.shadowColor = 'rgba(255, 94, 0, 0.4)';
        this.ctx.shadowBlur = 12;
        this.ctx.fillStyle = 'rgba(255, 94, 0, 0.12)';
        this.drawTornBox(boxX + extrusion, boxY + extrusion, boxW, boxH, 6, this.tornEdgeSeed + 15);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(255, 94, 0, 0.5)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // 2. RENDER FOREGROUND PANEL (Solid Jet-Black Screen)
        this.ctx.fillStyle = '#020306';
        this.drawTornBox(boxX, boxY, boxW, boxH, 5, this.tornEdgeSeed);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();

        // 3. CLIP CONTENT INSIDE TORN SCREEN SHAPE
        this.ctx.save();
        this.drawTornBox(boxX, boxY, boxW, boxH, 5, this.tornEdgeSeed);
        this.ctx.clip();

        // Matrix background dots
        this.ctx.fillStyle = 'rgba(0, 229, 255, 0.05)';
        for (let x = boxX + 10; x < boxX + boxW; x += 15) {
            for (let y = boxY + 10; y < boxY + boxH; y += 15) {
                this.ctx.fillRect(x, y, 1.2, 1.2);
            }
        }

        // 4. TECH READY BAR
        const barX = boxX + 20;
        const barY = boxY + 22;
        const barW = boxW - 40;
        const barH = 12;

        this.ctx.fillStyle = 'rgba(0, 229, 255, 0.03)';
        this.ctx.fillRect(barX, barY, barW, barH);
        this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
        this.ctx.strokeRect(barX, barY, barW, barH);

        // Pulsing fill
        const fillW = barW * this.readyBarProgress;
        this.ctx.fillStyle = 'rgba(255, 94, 0, 0.4)';
        this.ctx.fillRect(barX + 2, barY + 2, fillW - 4, barH - 4);

        // HUD Text
        this.ctx.font = '8px "Share Tech Mono", monospace';
        this.ctx.fillStyle = '#00e5ff';
        this.ctx.shadowColor = '#00e5ff';
        this.ctx.shadowBlur = 4;

        // Dynamic uptime
        const totalSeconds = Math.floor(this.globalTime / 1000);
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        const uptimeStr = `T+${mins}:${secs}`;
        const occurrencesStr = `OCCURRENCES: ${this.occurrenceCount.toString().padStart(3, '0')}`;

        this.ctx.fillText(`STREAM // ${this.readyBarState}`, barX + 6, barY + 9);
        this.ctx.fillText(`${uptimeStr} // ${occurrencesStr}`, barX + barW - 145, barY + 9);
        this.ctx.shadowBlur = 0;

        // 5. EXTRACT AND RENDER LOGS WITH TRUE 3D CONSTELLATION MORPH
        const textStartX = boxX + 20;
        const textStartY = barY + 32;
        const lineSpacing = 17;

        this.logs.forEach((log, index) => {
            const y = textStartY + (index * lineSpacing);

            // Print Date/Time stamp
            this.ctx.font = '10px "Share Tech Mono", monospace';
            this.ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
            this.ctx.fillText(log.prefix, textStartX, y);

            let currentX = textStartX + this.ctx.measureText(log.prefix).width;

            log.chars.forEach(char => {
                // Keep track of character center for particle emission
                char.x = currentX + 3;
                char.y = y - 4;

                if (char.state === 'resolved') {
                    // Letter fully resolved with high intensity SDF-like shadow glow
                    this.ctx.font = 'bold 10px "Share Tech Mono", monospace';
                    this.ctx.fillStyle = log.isHighlight ? '#ffffff' : '#00e5ff';
                    this.ctx.shadowColor = log.isHighlight ? '#ffffff' : '#00e5ff';
                    this.ctx.shadowBlur = log.isHighlight ? 6 : 4;
                    this.ctx.fillText(char.targetChar, currentX, y);
                    this.ctx.shadowBlur = 0;
                } else if (char.state === 'geometric') {
                    // Render true 3D perspective morphing constellation
                    const t = Math.min(1.0, char.timer / char.duration); // 0.0 -> 1.0
                    
                    // 3D rotation angles based on global time
                    const ry = this.globalTime * 0.003;
                    const rx = this.globalTime * 0.002;

                    const projectedPoints = [];
                    
                    char.nodes.forEach(node => {
                        // 1. ROTATE NODE IN 3D SPACE
                        // Rotate Y
                        let x1 = node.x3d * Math.cos(ry) - node.z3d * Math.sin(ry);
                        let z1 = node.x3d * Math.sin(ry) + node.z3d * Math.cos(ry);
                        
                        // Rotate X
                        let y1 = node.y3d * Math.cos(rx) - z1 * Math.sin(rx);
                        let z1Rot = node.y3d * Math.sin(rx) + z1 * Math.cos(rx);

                        // 2. INTERPOLATE VERTEX POSITIONS TO FLAT 2D GLYPH TARGETS
                        const currX = x1 * (1 - t) + node.tx * t;
                        const currY = y1 * (1 - t) + node.ty * t;
                        const currZ = z1Rot * (1 - t);

                        // 3. PERSPECTIVE CAMERA PROJECTION
                        const cameraDist = 40;
                        const scale = 220 / (currZ + cameraDist);
                        
                        // Center projected point around the character position
                        const px = char.x + currX * scale;
                        const py = char.y + currY * scale;

                        projectedPoints.push({ x: px, y: py });
                    });

                    // 4. DRAW EXTRAVAGANT GEOMETRIC INTERCONNECTIONS (Nearest neighbors)
                    this.ctx.strokeStyle = `rgba(255, 94, 0, ${0.4 * (1 - t) + 0.2})`;
                    this.ctx.lineWidth = 0.55;
                    
                    for (let i = 0; i < projectedPoints.length; i++) {
                        const p1 = projectedPoints[i];
                        
                        // Draw connection lines if points are within threshold
                        const limit = 6 * (1 - t) + 2.5 * t;
                        for (let j = i + 1; j < projectedPoints.length; j++) {
                            const p2 = projectedPoints[j];
                            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                            if (dist < limit) {
                                this.ctx.beginPath();
                                this.ctx.moveTo(p1.x, p1.y);
                                this.ctx.lineTo(p2.x, p2.y);
                                this.ctx.stroke();
                            }
                        }
                    }

                    // 5. DRAW GLOWING NODES (3D vertex particles)
                    this.ctx.fillStyle = `rgba(0, 229, 255, ${0.5 * (1 - t) + 0.5 * t})`;
                    projectedPoints.forEach(p => {
                        this.ctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1);
                    });
                }
                
                currentX += 6.5; // Staggered spacing
            });

            // Blinking cursor ready bar slash
            if (!log.complete) {
                if (Math.floor(this.globalTime / 180) % 2 === 0) {
                    this.ctx.fillStyle = '#ff5e00';
                    this.ctx.fillRect(currentX, y - 8, 4, 10);
                }
            }
        });

        // 6. DRAW FLOATING DEBRIS PARTICLES
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        // Restore clipping mask
        this.ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const liveConsole = new LiveFeedConsole();
    liveConsole.init();
});
