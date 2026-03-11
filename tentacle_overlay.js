/**
 * 2D Physics Tentacle Overlay
 * Advanced fluid kinematics with procedural organic noise and mouse tracking.
 */

class TentacleOverlay {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isActive = false;
        this.tentacles = [];
        this.config = {
            numTentacles: 5,        // Cluster size
            segmentCount: 35,
            segmentLength: 18,
            baseRadius: 25,
            tipRadius: 2,
            gravity: -0.15,         // Upward float
            friction: 0.88,         // Damping
            swaySpeed: 0.0015,
            swayMagnitude: 0.8,
            reachForce: 0.05,       // Mouse attraction pull
            colorBase: 'rgba(20, 0, 40, 0.95)',
            colorMid: 'rgba(80, 10, 80, 0.9)',
            colorTip: 'rgba(0, 255, 200, 0.95)' // Cyberpunk glow tip
        };
        this.lastTime = 0;

        // Mouse tracking
        this.mouse = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            active: false
        };

        this.resizeHandler = this.resize.bind(this);
        this.mouseMoveHandler = this.onMouseMove.bind(this);
        this.mouseEnterHandler = () => this.mouse.active = true;
        this.mouseLeaveHandler = () => this.mouse.active = false;
    }

    init() {
        if (this.canvas) return;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'tentacle-overlay-canvas';
        Object.assign(this.canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Click through
            zIndex: '9999'
        });
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        window.addEventListener('resize', this.resizeHandler);
        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('mouseenter', this.mouseEnterHandler);
        document.addEventListener('mouseleave', this.mouseLeaveHandler);

        this.resize();
        this.createTentacles();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Update root positions if needed
        this.tentacles.forEach((t, index) => {
            const spread = (this.canvas.width * 0.4);
            const offsetX = (index / (this.config.numTentacles - 1) - 0.5) * spread;
            const rootX = (this.canvas.width / 2) + offsetX;
            if (t.segments.length > 0) {
                t.segments[0].x = rootX;
                t.segments[0].y = this.canvas.height + 50;
            }
        });
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.active = true;
    }

    createTentacles() {
        this.tentacles = [];
        const spread = (this.canvas.width * 0.4); // Spread them across 40% of screen width

        for (let t = 0; t < this.config.numTentacles; t++) {
            const segments = [];
            // Space roots evenly
            const offsetX = this.config.numTentacles > 1
                ? (t / (this.config.numTentacles - 1) - 0.5) * spread
                : 0;
            const startX = (this.canvas.width / 2) + offsetX;
            const startY = this.canvas.height + 50;

            // Randomize phase and lengths slightly per tentacle for organic variation
            const phaseOffset = Math.random() * Math.PI * 2;
            const lengthVariant = this.config.segmentLength * (0.8 + Math.random() * 0.4);

            for (let i = 0; i < this.config.segmentCount; i++) {
                segments.push({
                    x: startX,
                    y: startY - (i * lengthVariant),
                    oldX: startX,
                    oldY: startY - (i * lengthVariant),
                    radius: this.lerp(this.config.baseRadius, this.config.tipRadius, i / this.config.segmentCount)
                });
            }

            this.tentacles.push({
                segments,
                startX,
                startY,
                phaseOffset,
                length: lengthVariant
            });
        }
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    start() {
        if (!this.canvas) this.init();
        this.isActive = true;
        this.lastTime = performance.now();
        this.animate(performance.now());

        // Fade in
        this.canvas.style.opacity = '0';
        this.canvas.style.transition = 'opacity 1s ease';
        setTimeout(() => this.canvas.style.opacity = '1', 10);
    }

    stop() {
        this.isActive = false;
        if (this.canvas) {
            this.canvas.style.opacity = '0';
            setTimeout(() => {
                if (this.canvas && this.canvas.parentNode) {
                    this.canvas.parentNode.removeChild(this.canvas);
                }
                this.canvas = null;
                window.removeEventListener('resize', this.resizeHandler);
                document.removeEventListener('mousemove', this.mouseMoveHandler);
                document.removeEventListener('mouseenter', this.mouseEnterHandler);
                document.removeEventListener('mouseleave', this.mouseLeaveHandler);
            }, 1000);
        }
    }

    animate(time) {
        if (!this.isActive) return;

        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.update(deltaTime || 16, time);
        this.draw();
    }

    update(dt, time) {
        for (let t = 0; t < this.tentacles.length; t++) {
            const tentacle = this.tentacles[t];
            const segments = tentacle.segments;

            // 1. Move segments (Verlet)
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];

                if (i === 0) {
                    // Pin root
                    seg.x = tentacle.startX;
                    seg.y = this.canvas.height + 20;
                    continue;
                }

                const vx = (seg.x - seg.oldX) * this.config.friction;
                const vy = (seg.y - seg.oldY) * this.config.friction;

                seg.oldX = seg.x;
                seg.oldY = seg.y;

                seg.x += vx;
                seg.y += vy;

                // Constant upward gravity
                seg.y += this.config.gravity;

                // Organic Sway (using multiple sine waves for noise)
                const swayTime = time * this.config.swaySpeed + tentacle.phaseOffset;
                const noise1 = Math.sin(swayTime + i * 0.1);
                const noise2 = Math.cos(swayTime * 1.5 + i * 0.05);
                const sway = (noise1 + noise2 * 0.5) * this.config.swayMagnitude;

                seg.x += sway * (i * 0.15); // Emphasize sway at the tip

                // Mouse Tracking (Attraction force, stronger towards the tip)
                if (this.mouse.active) {
                    const tipInfluence = i / this.config.segmentCount; // 0 at base, 1 at tip
                    const dx = this.mouse.x - seg.x;
                    const dy = this.mouse.y - seg.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Only attract if within a certain radius, or just pull globally gently
                    if (distance > 0 && distance < 800) {
                        const pullStrength = Math.max(0, 1 - distance / 800) * this.config.reachForce * tipInfluence;
                        seg.x += dx * pullStrength;
                        seg.y += dy * pullStrength;
                    }
                }
            }

            // 2. Inverse Kinematics Constraints
            for (let iter = 0; iter < 5; iter++) { // 5 iterations for stiffness
                for (let i = 1; i < segments.length; i++) {
                    const seg = segments[i];
                    const prev = segments[i - 1];

                    const dx = seg.x - prev.x;
                    const dy = seg.y - prev.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist === 0) continue;

                    const diff = dist - tentacle.length;
                    const percent = diff / dist / 2;

                    const offsetX = dx * percent;
                    const offsetY = dy * percent;

                    if (i > 1) {
                        // Normal segment
                        seg.x -= offsetX;
                        seg.y -= offsetY;
                        prev.x += offsetX;
                        prev.y += offsetY;
                    } else {
                        // Root attachment (prev is pinned)
                        seg.x -= offsetX * 2;
                        seg.y -= offsetY * 2;
                    }
                }
            }
        }
    }

    draw() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw each tentacle
        for (let t = 0; t < this.tentacles.length; t++) {
            this.drawRibbon(this.tentacles[t].segments);
        }
    }

    drawRibbon(segments) {
        if (segments.length < 2) return;

        this.ctx.beginPath();

        const leftPoints = [];
        const rightPoints = [];

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            let next = segments[i + 1] || seg;
            let prev = segments[i - 1] || seg;

            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;

            // Perpendicular Normal vector
            const nx = -dy / len;
            const ny = dx / len;

            leftPoints.push({
                x: seg.x + nx * seg.radius,
                y: seg.y + ny * seg.radius
            });
            rightPoints.push({
                x: seg.x - nx * seg.radius,
                y: seg.y - ny * seg.radius
            });
        }

        // Draw left side (smooth spline)
        this.ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
        for (let i = 1; i < leftPoints.length - 1; i++) {
            const xc = (leftPoints[i].x + leftPoints[i + 1].x) / 2;
            const yc = (leftPoints[i].y + leftPoints[i + 1].y) / 2;
            this.ctx.quadraticCurveTo(leftPoints[i].x, leftPoints[i].y, xc, yc);
        }
        this.ctx.lineTo(leftPoints[leftPoints.length - 1].x, leftPoints[leftPoints.length - 1].y);

        // Tip rounding
        const tipL = leftPoints[leftPoints.length - 1];
        const tipR = rightPoints[rightPoints.length - 1];
        const tipCenter = segments[segments.length - 1];
        // Create an arc for the tip
        this.ctx.arc(tipCenter.x, tipCenter.y, tipCenter.radius,
            Math.atan2(tipL.y - tipCenter.y, tipL.x - tipCenter.x),
            Math.atan2(tipR.y - tipCenter.y, tipR.x - tipCenter.x),
            true);

        // Draw right side backwards (smooth spline)
        for (let i = rightPoints.length - 2; i > 0; i--) {
            const xc = (rightPoints[i].x + rightPoints[i - 1].x) / 2;
            const yc = (rightPoints[i].y + rightPoints[i - 1].y) / 2;
            this.ctx.quadraticCurveTo(rightPoints[i].x, rightPoints[i].y, xc, yc);
        }
        this.ctx.lineTo(rightPoints[0].x, rightPoints[0].y);

        // Base rounding
        this.ctx.closePath();

        // Fill mapping: Dark magenta base to bright cyan tip
        const startY = segments[0].y;
        const endY = segments[Math.floor(segments.length * 0.8)].y; // Peak glow before the very tip

        const grad = this.ctx.createLinearGradient(0, startY, 0, endY);
        grad.addColorStop(0, this.config.colorBase);
        grad.addColorStop(0.5, this.config.colorMid);
        grad.addColorStop(1, this.config.colorTip);

        this.ctx.fillStyle = grad;
        this.ctx.fill();

        // High tech cyber-glow effect
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.config.colorTip;
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = 'rgba(0, 255, 200, 0.4)';
        this.ctx.stroke();

        // Reset shadow for next draw
        this.ctx.shadowBlur = 0;

        // Draw a glowing neural core line down the center
        this.ctx.beginPath();
        this.ctx.moveTo(segments[0].x, segments[0].y);
        for (let i = 1; i < segments.length; i++) {
            this.ctx.lineTo(segments[i].x, segments[i].y);
        }
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        this.ctx.stroke();
    }
}

window.TentacleOverlay = new TentacleOverlay();
