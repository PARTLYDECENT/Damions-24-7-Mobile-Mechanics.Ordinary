document.addEventListener('DOMContentLoaded', () => {
    console.log("Intro system initializing... Extended Cut.");

    // DOM Elements
    const enterContent = document.querySelector('.enter-content');
    const enterTitle = document.querySelector('.enter-title');
    const enterSubtitle = document.querySelector('.enter-subtitle');
    const enterDivider = document.querySelector('.enter-divider');
    const enterStatus = document.querySelector('.enter-status');
    const enterBtn = document.getElementById('enter-btn');
    const enterOverlay = document.getElementById('enter-overlay');
    const bgMusic = document.getElementById('background-music');

    // 1. Reset initial state
    enterTitle.style.opacity = '0';
    enterSubtitle.style.opacity = '0';
    enterDivider.style.width = '0';
    enterStatus.style.opacity = '0';
    enterBtn.style.opacity = '0';
    enterBtn.style.transform = 'scale(0.8)';
    enterBtn.style.pointerEvents = 'none';

    // 2. Create Terminal Output Container
    const terminal = document.createElement('div');
    terminal.id = 'intro-terminal';
    Object.assign(terminal.style, {
        position: 'absolute',
        bottom: '20vh',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'Share Tech Mono', monospace",
        color: '#00f2ea',
        fontSize: '14px',
        textAlign: 'left', // Better for typing lists
        width: '300px',
        opacity: '0.9',
        zIndex: '5',
        textShadow: '0 0 5px rgba(0, 242, 234, 0.5)',
        pointerEvents: 'none' // Prevent blocking clicks
    });
    enterContent.appendChild(terminal);
    enterContent.style.position = 'relative'; // Ensure context
    enterBtn.style.position = 'relative';
    enterBtn.style.zIndex = '20'; // Above terminal

    // Typing Effect Function
    const typeWriter = (text, element, speed = 30) => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return speed * text.length; // Return estimated duration
    };

    // Queue system for logs
    let currentTime = 0;
    const queueLog = (text, delayAfter = 500) => {
        setTimeout(() => {
            const line = document.createElement('div');
            line.style.marginBottom = '4px';
            line.textContent = '> '; // Prompt
            terminal.appendChild(line);

            // Auto scroll
            if (terminal.children.length > 8) terminal.removeChild(terminal.firstChild);

            // Start typing
            typeWriter(text, line);

        }, currentTime);
        currentTime += delayAfter;
    };

    // 4. Run Extended Sequence
    // Total sequence is roughly 8-10 seconds of "boot up" theater

    queueLog("INITIALIZING NEURAL LINK...", 800);
    queueLog("CHECKING CORE INTEGRITY...", 800);

    //Reveal Title
    setTimeout(() => {
        enterTitle.style.animation = 'fade-in-up 1s ease forwards';
    }, currentTime);

    queueLog("LOADING V8 ENGINE DRIVERS...", 600);
    queueLog("OPTIMIZING TORQUE VECTORS...", 600);
    queueLog("SYNCING WITH SATELLITE...", 1000);

    // Reveal Subtitle
    setTimeout(() => {
        enterSubtitle.style.animation = 'fade-in-up 1s ease forwards';
    }, currentTime);

    queueLog("DECRYPTING ASSETS...", 500);
    queueLog("ESTABLISHING SECURE CONNECTION...", 800);
    queueLog("BYPASSING MAIN FIREWALL...", 700);

    // Reveal Divider
    setTimeout(() => {
        enterDivider.style.transition = 'width 1s ease';
        enterDivider.style.width = '100px';
        enterDivider.style.opacity = '1';
    }, currentTime);

    queueLog("IGNITION SEQUENCE START...", 800);
    queueLog("FUEL PUMP PRIMED...", 600);
    queueLog("CHECKING FLUID LEVELS...", 600);
    queueLog("DISPLAY ADAPTER: ONLINE...", 500);
    queueLog("AUDIO SUBSYSTEM: GO...", 500);
    queueLog("SYSTEM DIAGNOSTIC: GREEN", 800);

    // Final Ready State
    setTimeout(() => {
        enterStatus.textContent = "SYSTEM READY";
        enterStatus.style.opacity = '1';

        // Blink effects
        enterStatus.animate([
            { opacity: 0.5 }, { opacity: 1 }
        ], { duration: 500, iterations: 3 });

    }, currentTime);

    queueLog("FAILSAFE DISENGAGED.", 500);
    queueLog("WAITING FOR USER INPUT...", 0);

    // Reveal Button
    setTimeout(() => {
        enterBtn.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        enterBtn.style.opacity = '1';
        enterBtn.style.transform = 'scale(1)';
        enterBtn.style.pointerEvents = 'auto';

        // Pulse effect
        enterBtn.animate([
            { boxShadow: '0 0 0 0 rgba(0, 242, 234, 0.7)' },
            { boxShadow: '0 0 0 20px rgba(0, 242, 234, 0)' }
        ], {
            duration: 1500,
            iterations: Infinity
        });
    }, currentTime + 200);


    // 5. Interaction - The "Spectacular" Exit
    enterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation(); // Stop default fade out in main.js if conflicting

        // Play Sound
        if (bgMusic) bgMusic.play().catch(console.error);

        // WARP SPEED
        if (window.triggerIntroWarp) {
            window.triggerIntroWarp();
        }

        // UI Explode
        enterTitle.style.transition = 'all 0.5s ease';
        enterTitle.style.transform = 'scale(2) translateZ(100px)';
        enterTitle.style.opacity = '0';
        enterTitle.style.filter = 'blur(10px)';

        enterSubtitle.style.transition = 'all 0.5s ease 0.1s';
        enterSubtitle.style.transform = 'scale(2)';
        enterSubtitle.style.opacity = '0';

        enterBtn.style.transition = 'all 0.2s';
        enterBtn.style.transform = 'scale(0)';

        terminal.style.display = 'none';

        // White flash cover
        const flash = document.createElement('div');
        Object.assign(flash.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100%', height: '100%',
            background: 'white',
            opacity: '0',
            zIndex: '10000',
            transition: 'opacity 0.2s ease-in'
        });
        document.body.appendChild(flash);

        // Timed sequence for exit
        setTimeout(() => {
            flash.style.opacity = '1'; // Flash white at peak warp
        }, 1800);

        setTimeout(() => {
            enterOverlay.style.display = 'none';

            // New Step: Intro Image Overlay
            const introImg = document.createElement('div');
            Object.assign(introImg.style, {
                position: 'fixed',
                top: '0', left: '0', width: '100%', height: '100%',
                backgroundImage: 'url("assets/images/intro.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: '9998', // Below flash (10000), above everything else
                opacity: '0',
                transition: 'opacity 0.5s ease'
            });
            document.body.appendChild(introImg);

            // Reveal image while flash is still covering, then fade flash
            requestAnimationFrame(() => {
                introImg.style.opacity = '1';
                flash.style.opacity = '0'; // Fade out flash to reveal Image
                setTimeout(() => flash.remove(), 1000);
            });

            // Hold for 10 seconds
            setTimeout(() => {
                introImg.style.transition = 'opacity 1s ease';
                introImg.style.opacity = '0'; // Fade out image to reveal site

                setTimeout(() => {
                    introImg.remove();

                    // Trigger site animations
                    document.querySelectorAll('.animate-on-scroll').forEach(el => {
                        el.classList.add('loaded'); // Force load immediate items
                    });

                    // Start Hero Typing Greeting
                    if (window.startHeroTyping) {
                        window.startHeroTyping();
                    }
                }, 1000);

            }, 10000); // 10 seconds hold

        }, 2200); // 2.2s total wait matches warp ramp
    });
});
