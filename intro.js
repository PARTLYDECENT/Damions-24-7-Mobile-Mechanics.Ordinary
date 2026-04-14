document.addEventListener('DOMContentLoaded', () => {
    const enterOverlay = document.getElementById('enter-overlay');
    const hudOverlay = document.getElementById('hud-overlay');
    const shutterWrapper = document.getElementById('shutter-wrapper');
    const progressBar = document.getElementById('hud-progress-bar');
    const statusText = document.getElementById('hud-status');
    const enterBtn = document.getElementById('enter-btn');

    // Hide original enter button initially to show telemetry
    if (enterBtn) enterBtn.style.opacity = '0';

    // 1. Create high-quality video intro overlay (now as the background layer)
    const videoContainer = document.createElement('div');
    videoContainer.id = 'video-intro-container';
    Object.assign(videoContainer.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: '#000', zIndex: '10001', display: 'flex',
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
    });

    const video = document.createElement('video');
    video.src = 'videos/intro.mp4';
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    Object.assign(video.style, {
        width: '100%', height: '100%', objectFit: 'cover', opacity: '0.6'
    });

    videoContainer.appendChild(video);
    document.body.appendChild(videoContainer);

    // 2. Start System Boot Sequence
    const startBootSequence = () => {
        if (enterOverlay) {
            enterOverlay.style.display = 'block';
            enterOverlay.style.opacity = '1';
        }
        if (hudOverlay) hudOverlay.classList.add('active');

        // --- Diagnostics & Warning Engine ---
        const alertFeed = document.getElementById('alert-feed');
        const failureModes = [
            { text: "CRITICAL: Piston Ring Clearance < 0.002mm", type: 'critical' },
            { text: "ALARM: Crankshaft Bearing Temp Exceeded", type: 'critical' },
            { text: "WARNING: Cyl-7 Compression Loss (85 PSI)", type: 'warning' },
            { text: "FAILURE: Hydraulic Valve Lash Seizure", type: 'critical' },
            { text: "ERROR: Oil Pump Cavitation Detected", type: 'warning' },
            { text: "WARN: Low Fuel Rail Pressure detected", type: 'warning' },
            { text: "ALARM: Main Core Harmonic Imbalance", type: 'critical' },
            { text: "DECODING VIN: 1GCEC19... [FAILED]", type: 'warning' },
            { text: "DETECTION: Micro-fracture in Block Casting", type: 'critical' }
        ];

        const triggerAlert = () => {
            const failure = failureModes[Math.floor(Math.random() * failureModes.length)];
            const alertDiv = document.createElement('div');
            alertDiv.className = `hud-alert ${failure.type}`;
            alertDiv.textContent = `> ${failure.text}`;
            alertFeed.appendChild(alertDiv);

            // Limit visible alerts
            if (alertFeed.children.length > 5) alertFeed.removeChild(alertFeed.firstChild);

            // Jitter for critical errors
            if (failure.type === 'critical' && hudOverlay) {
                hudOverlay.classList.add('hud-jitter');
                setTimeout(() => hudOverlay.classList.remove('hud-jitter'), 500);
            }
        };

        // Animate Telemetry
        let progress = 0;
        const bootInterval = setInterval(() => {
            progress += Math.random() * 5;
            
            // Periodically trigger alerts during boot
            if (Math.random() > 0.8) triggerAlert();

            if (progress >= 100) {
                progress = 100;
                clearInterval(bootInterval);
                statusText.textContent = "SYSTEM READY // HAZARD LEVEL 4";
                statusText.style.color = "var(--hud-orange)";
                
                // Final critical alert on load
                triggerAlert();

                // Open Mechanical Shutter
                setTimeout(() => {
                    if (shutterWrapper) shutterWrapper.classList.add('open');
                    if (enterBtn) {
                        enterBtn.style.opacity = '1';
                        enterBtn.style.transform = 'translateY(0)';
                    }
                }, 500);
            }
            if (progressBar) progressBar.style.width = `${progress}%`;
            
            // Randomize telemetry noise
            if (Math.random() > 0.8) {
                const volts = (12 + Math.random() * 2).toFixed(1);
                document.getElementById('hud-vitals').textContent = `${volts}V | 92°C`;
            }
        }, 80);
    };

    // 3. Intro finish logic (Warp Transition)
    let introFinished = false;
    const finishIntro = () => {
        if (introFinished) return;
        introFinished = true;

        // Trigger the Warp Effect from enter_shader.js if available
        if (window.triggerIntroWarp) {
            window.triggerIntroWarp();
        }

        // Fade out overlay and container
        setTimeout(() => {
            if (enterOverlay) enterOverlay.style.transition = 'opacity 1.2s ease';
            if (enterOverlay) enterOverlay.style.opacity = '0';
            videoContainer.style.transition = 'opacity 1.2s ease, transform 1.2s ease-in';
            videoContainer.style.opacity = '0';
            videoContainer.style.transform = 'scale(1.5)';

            setTimeout(() => {
                if (videoContainer.parentNode) videoContainer.remove();
                if (enterOverlay) enterOverlay.style.display = 'none';

                // Trigger site animations
                document.querySelectorAll('.animate-on-scroll').forEach(el => {
                    el.classList.add('loaded');
                });

                if (window.startHeroTyping) window.startHeroTyping();
            }, 1200);
        }, 100);
    };

    // Initialize boot on load
    setTimeout(startBootSequence, 500);

    // Attach finish events
    if (enterBtn) enterBtn.addEventListener('click', finishIntro);
    video.addEventListener('ended', finishIntro);
    video.addEventListener('error', finishIntro);
});

