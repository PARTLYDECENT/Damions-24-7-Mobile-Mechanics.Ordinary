document.addEventListener('DOMContentLoaded', () => {
    console.log("Intro system: Playing intro.mp4 video.");

    const enterOverlay = document.getElementById('enter-overlay');
    const bgMusic = document.getElementById('background-music');

    // 1. Hide the old overlay entirely
    if (enterOverlay) {
        enterOverlay.style.display = 'none';
    }

    // 2. Create high-quality video intro overlay
    const videoOverlay = document.createElement('div');
    videoOverlay.id = 'video-intro-overlay';
    Object.assign(videoOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: '#000', zIndex: '10000', display: 'flex',
        justifyContent: 'center', alignItems: 'center'
    });

    const video = document.createElement('video');
    video.src = 'videos/intro.mp4';
    // Muted is required for most browsers to allow auto-play
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    Object.assign(video.style, {
        width: '100%', height: '100%', objectFit: 'cover'
    });

    const skipBtn = document.createElement('button');
    skipBtn.textContent = "SKIP INTRO [X]";
    Object.assign(skipBtn.style, {
        position: 'absolute', bottom: '40px', right: '40px',
        padding: '12px 24px', backgroundColor: 'rgba(0,0,0,0.6)',
        color: 'var(--accent-color, #00f2ea)', border: '1px solid var(--accent-color, #00f2ea)', cursor: 'pointer',
        fontFamily: "'Share Tech Mono', 'Courier New', monospace", zIndex: '10001',
        fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase'
    });

    // Add elements to the page
    videoOverlay.appendChild(video);
    videoOverlay.appendChild(skipBtn);
    document.body.appendChild(videoOverlay);

    // 3. Intro finish logic
    let introFinished = false;
    const finishIntro = () => {
        if (introFinished) return;
        introFinished = true;
        
        videoOverlay.style.transition = 'opacity 0.8s ease';
        videoOverlay.style.opacity = '0';
        
        setTimeout(() => {
            if (videoOverlay.parentNode) videoOverlay.remove();
            
            // Trigger site animations immediately
            document.querySelectorAll('.animate-on-scroll').forEach(el => {
                el.classList.add('loaded');
            });

            // Start Hero Typing Greeting
            if (window.startHeroTyping) {
                window.startHeroTyping();
            }
        }, 800);
    };

    // Attach finish events
    video.addEventListener('ended', finishIntro);
    video.addEventListener('error', finishIntro); // fallback if video fails to load
    skipBtn.addEventListener('click', finishIntro);

    // 4. Handle Background Music (wait for first interaction to comply with autoplay policies)
    let musicStarted = false;
    const startMusic = () => {
        if (bgMusic && !musicStarted) {
            musicStarted = true;
            bgMusic.play().catch(e => console.log("Music autoplay prevented, waiting for interaction..."));
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
        }
    };

    document.addEventListener('click', startMusic);
    document.addEventListener('keydown', startMusic);
});
