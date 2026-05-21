class InfoConsole {
    constructor() {
        this.container = null;
        this.logContainer = null;
        this.messages = [
            "CRITICAL: Ford F-150 spark plug ejected into low Earth orbit.",
            "ALARM: Toyota Hilux survived a direct mortar strike. Running fine.",
            "WARNING: Ford EcoBoost engine has converted itself to structural dust.",
            "ALERT: 10mm socket has escaped through a tear in spacetime.",
            "INFO: Toyota Corolla continuing to run spitefully with no engine oil.",
            "ALARM: Customer states: 'The engine knock sounds like a drum solo.'",
            "CRITICAL: Ford PowerStroke 6.0 head gasket has entered the stratosphere.",
            "WARNING: Owner attempting to secure the transmission with a single zip tie.",
            "WARN: Blinker fluid level critical. Refill immediately.",
            "FAILURE: Bluetooth driveshaft has disconnected from the front axle.",
            "ALARM: Ford transmission shifted into 'R' for 'Racing' at 70mph.",
            "INFO: Toyota Tacoma frame successfully rusted into a beautiful lace pattern.",
            "CRITICAL: Check Engine light has burned out from pure exhaustion.",
            "WARN: Engine oil has been replaced with crunchy peanut butter.",
            "INFO: Toyota 22R running on thoughts, prayers, and pure spite.",
            "ALARM: Exhaust pipe is playing a sad trombone sound at 3000 RPM.",
            "CRITICAL: Ford Triton V10 is holding a rods-out block party.",
            "WARN: Muffler bearings running dangerously dry.",
            "ALERT: Customer states: 'I heard a slight pop and then the engine left.'",
            "CRITICAL: Socket wrench has declared a union strike.",
            "INFO: Toyota Land Cruiser 1993 refuses to die despite active sabotage.",
            "WARN: Cylinder 3 has left the chat."
        ];
    }

    init() {
        // Create DOM elements
        this.container = document.createElement('div');
        this.container.id = 'info-stream-console';
        Object.assign(this.container.style, {
            position: 'fixed',
            left: '20px',
            bottom: '20px', // Bottom left
            width: '250px',
            height: '200px',
            background: 'rgba(5, 8, 15, 0.85)',
            border: '1px solid rgba(0, 242, 234, 0.3)',
            boxShadow: '0 0 15px rgba(0, 242, 234, 0.1)',
            backdropFilter: 'blur(5px)',
            borderRadius: '5px',
            padding: '10px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '12px',
            color: '#00f2ea',
            zIndex: '9000', // High but below overlays
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none' // Don't block background interactions
        });

        // Header
        const header = document.createElement('div');
        header.textContent = "/// LIVE FEED ///";
        Object.assign(header.style, {
            borderBottom: '1px solid rgba(0, 242, 234, 0.3)',
            paddingBottom: '5px',
            marginBottom: '5px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textShadow: '0 0 5px rgba(0, 242, 234, 0.5)'
        });
        this.container.appendChild(header);

        // Log Container
        this.logContainer = document.createElement('div');
        Object.assign(this.logContainer.style, {
            flex: '1',
            overflowY: 'hidden', // Auto scroll will handle visibility
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
        });
        this.container.appendChild(this.logContainer);

        document.body.appendChild(this.container);

        // Start Stream
        this.addLog("WE ARE OPEN FOR BUSINESS", true); // Highlight start
        this.startLoop();
    }

    addLog(text, isHighlight = false) {
        const line = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        line.innerHTML = `<span style="opacity:0.5">[${timestamp}]</span> ${text}`;

        Object.assign(line.style, {
            opacity: '0',
            transform: 'translateX(-10px)',
            transition: 'all 0.3s ease',
            marginBottom: '2px',
            lineHeight: '1.4'
        });

        if (isHighlight) {
            line.style.color = '#fff';
            line.style.textShadow = '0 0 5px #fff';
            line.style.fontWeight = 'bold';
        }

        this.logContainer.appendChild(line);

        // Animate in
        requestAnimationFrame(() => {
            line.style.opacity = '1';
            line.style.transform = 'translateX(0)';
        });

        // Cleanup old logs
        if (this.logContainer.children.length > 10) {
            this.logContainer.removeChild(this.logContainer.firstChild);
        }
    }

    startLoop() {
        // Random intervals
        const scheduleNext = () => {
            const delay = Math.random() * 2000 + 1000; // 1-3 seconds
            setTimeout(() => {
                const randomMsg = this.messages[Math.floor(Math.random() * this.messages.length)];
                this.addLog(randomMsg);
                scheduleNext();
            }, delay);
        };
        scheduleNext();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for intro to finish? Or just start immediately? 
    // Let's hide it initially and reveal it after intro via a global event or check.
    // Ideally intro.js would trigger this. For now, we'll start it but hide it until "bg-loaded" or similar?
    // Actually simplicity: Start it, but set initial opacity to 0 in CSS animation if needed.
    // Or just let it run.

    const consoleSystem = new InfoConsole();
    consoleSystem.init();

    // Optional: Hook into global 'introComplete' event if we made one, 
    // but for now we'll just let it appear. 
    // If the intro overlay is z-index 9999, it will cover this anyway.
});
