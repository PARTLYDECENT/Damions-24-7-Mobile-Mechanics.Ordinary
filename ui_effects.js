document.addEventListener('DOMContentLoaded', () => {

    // --- 3D Tilt Effect for Cards ---
    const tiltElements = document.querySelectorAll('.service-card, .news-card, .feature-item');

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', handleTilt);
        el.addEventListener('mouseleave', resetTilt);
    });

    function handleTilt(e) {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max rotation deg
        const rotateY = ((x - centerX) / centerX) * 10;

        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    }

    function resetTilt(e) {
        const el = e.currentTarget;
        el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }

    // --- Magnetic Buttons ---
    const magneticButtons = document.querySelectorAll('.cta-button, .nav-links a');

    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Magnetic pull strength
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });

    // --- Cyber Text Glitch Effect ---
    const glitchTexts = document.querySelectorAll('.hero h1, .section-title, .enter-title');

    glitchTexts.forEach(text => {
        text.setAttribute('data-text', text.innerText);
        text.classList.add('glitch-effect');

        // Random glitch trigger
        setInterval(() => {
            if (Math.random() > 0.95) {
                text.classList.add('active-glitch');
                setTimeout(() => text.classList.remove('active-glitch'), 200);
            }
        }, 2000);
    });

    // --- Advanced Scroll Reveal (Blur & Lift) ---
    // Overriding the basic observer in main.js if needed, or enhancing CSS
    // The CSS update will handle the visual part of .loaded
});
