/**
 * 2D Physics Tentacle Overlay
 * Ported from Babylon.js logic to vanilla Canvas API
 */

class TentacleOverlay {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isActive = false;
        this.segments = [];
        this.config = {
            segmentCount: 40,
            segmentLength: 15, // pixels
            baseRadius: 20,
            tipRadius: 2,
            gravity: 0.2, // Upward float if negative, downward if positive. Let's do upward -0.2
            friction: 0.9,
            swaySpeed: 0.002,
            swayMagnitude: 0.5,
            colorBase: 'rgba(100, 0, 0, 0.9)',
            colorTip: 'rgba(255, 50, 50, 0.9)'
        };
        this.lastTime = 0;

        this.resizeHandler = this.resize.bind(this);
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
            zIndex: '9999' // On top of image (9998) but below flash (10000)
        });
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        window.addEventListener('resize', this.resizeHandler);
        this.resize();
        this.createTentacle();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Re-center base
        if (this.segments.length > 0) {
            this.segments[0].x = this.canvas.width / 2;
            this.segments[0].y = this.canvas.height + 50; // Just off screen
        }
    }

    createTentacle() {
        this.segments = [];
        const startX = this.canvas.width / 2;
        const startY = this.canvas.height + 50;

        for (let i = 0; i < this.config.segmentCount; i++) {
            this.segments.push({
                x: startX,
                y: startY - (i * this.config.segmentLength),
                oldX: startX,
                oldY: startY - (i * this.config.segmentLength),
                radius: this.lerp(this.config.baseRadius, this.config.tipRadius, i / this.config.segmentCount)
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
        this.animate();

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
            }, 1000);
        }
    }

    animate(time) {
        if (!this.isActive) return;

        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.update(deltaTime || 16);
        this.draw();
    }

    update(dt) {
        // Physics update (Verlet Integration)

        // 1. Move segments
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];

            if (i === 0) {
                // Pin base
                seg.x = this.canvas.width / 2;
                seg.y = this.canvas.height + 20;
                continue;
            }

            const vx = (seg.x - seg.oldX) * this.config.friction;
            const vy = (seg.y - seg.oldY) * this.config.friction;

            seg.oldX = seg.x;
            seg.oldY = seg.y;

            seg.x += vx;
            seg.y += vy;

            // Gravity (Upward float) -- actually lets do upward gravity to make it stand up
            seg.y -= 0.5;

            // Sway Force
            const sway = Math.sin(performance.now() * this.config.swaySpeed + i * 0.2) * this.config.swayMagnitude;
            seg.x += sway * (i * 0.1); // Sway more at tip
        }

        // 2. Constraints (Inverse Kinematics)
        // Run multiple iterations for stiffness
        for (let iter = 0; iter < 10; iter++) {
            for (let i = 1; i < this.segments.length; i++) {
                const seg = this.segments[i];
                const prev = this.segments[i - 1];

                const dx = seg.x - prev.x;
                const dy = seg.y - prev.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist === 0) continue;

                const diff = dist - this.config.segmentLength;
                const percent = diff / dist / 2;

                const offsetX = dx * percent;
                const offsetY = dy * percent;

                // Move both towards each other (unless pinned)
                if (i !== 1) { // Don't move index 0 (pinned), but 1 is attached to 0
                    // Actually 0 is pinned. So 1 can move. 0 cannot.
                    // If prev is 0, prev doesn't move.

                    // Simple logic:
                    if (i > 0) {
                        seg.x -= offsetX;
                        seg.y -= offsetY;

                        if (i > 1) { // Don't move base
                            prev.x += offsetX;
                            prev.y += offsetY;
                        }
                    }
                } else {
                    // Start is pinned, only move current
                    seg.x -= offsetX * 2;
                    seg.y -= offsetY * 2;
                }
            }
        }
    }

    draw() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Tentacle
        this.ctx.beginPath();

        // Draw standard spline
        if (this.segments.length > 0) {
            this.ctx.moveTo(this.segments[0].x, this.segments[0].y);

            for (let i = 1; i < this.segments.length - 2; i++) {
                const xc = (this.segments[i].x + this.segments[i + 1].x) / 2;
                const yc = (this.segments[i].y + this.segments[i + 1].y) / 2;
                this.ctx.quadraticCurveTo(this.segments[i].x, this.segments[i].y, xc, yc);
            }

            // Last 2 segments
            if (this.segments.length > 2) {
                const last = this.segments[this.segments.length - 1];
                const secondLast = this.segments[this.segments.length - 2];
                this.ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
            }
        }

        // Stroke with gradient
        const grad = this.ctx.createLinearGradient(
            this.segments[0].x, this.segments[0].y,
            this.segments[this.segments.length - 1].x, this.segments[this.segments.length - 1].y
        );
        grad.addColorStop(0, '#4a0000');
        grad.addColorStop(0.5, '#a00000');
        grad.addColorStop(1, '#ff3333');

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = grad;

        // Dynamic Width? Canvas stroke is constant width.
        // To do tapered width we need to fill a shape or draw circles.
        // Let's draw circles for cheap tapering (blobs) or fill a path.

        // Let's optimize: Draw filled path (Ribbon)

        this.drawRibbon();
    }

    drawRibbon() {
        // Create a closed shape based on normals
        this.ctx.beginPath();

        const leftPoints = [];
        const rightPoints = [];

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            // Next segment for normal
            let next = this.segments[i + 1];
            if (!next) next = seg;

            let prev = this.segments[i - 1];
            if (!prev) prev = seg;

            // Direction vector
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;

            // Normal vector
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
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

        // Build path
        this.ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
        for (let i = 1; i < leftPoints.length; i++) {
            this.ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
        }
        // Link to right side (reverse)
        for (let i = rightPoints.length - 1; i >= 0; i--) {
            this.ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
        }
        this.ctx.closePath();

        // Fill
        const grad = this.ctx.createLinearGradient(
            0, this.canvas.height, 0, this.canvas.height / 2
        );
        grad.addColorStop(0, '#2a0000'); // Dark Base
        grad.addColorStop(0.4, '#800000');
        grad.addColorStop(1, '#ff1a1a'); // Bright Tip

        this.ctx.fillStyle = grad;
        this.ctx.fill();

        // Shine/Glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        this.ctx.stroke(); // Outline
        this.ctx.shadowBlur = 0;
    }
}

window.TentacleOverlay = new TentacleOverlay();
