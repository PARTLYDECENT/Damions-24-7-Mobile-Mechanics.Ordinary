document.addEventListener('DOMContentLoaded', () => {
    const slideshowContainer = document.getElementById('background-slideshow');
    if (!slideshowContainer) {
        console.error('Slideshow container not found.');
        return;
    }

    const backgroundImages = [
        '1776999258427.png', '1776999511555.png', '1777259613773.png',
        '1777564351688.png', '1777572580234.png', '1778046724946.png',
        '1779399993540.png', '1779556011960.png', '1779580347243.png',
        '1780363484428.png', '20260328_125701.jpg', '20260328_141456.jpg',
        '20260428_122303.jpg', '20260428_130811.jpg', '20260519_181438.jpg',
        '20260522_214511.jpg', '20260522_214516.jpg', '20260522_214518.jpg'
    ];

    let currentImageIndex = -1;

    function getRandomImage() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * backgroundImages.length);
        } while (newIndex === currentImageIndex); // Ensure different image each time
        currentImageIndex = newIndex;
        return `./assets/images/resume/${backgroundImages[currentImageIndex]}`;
    }

    function applyGlitchEffect(element) {
        element.classList.add('glitch');
        // Remove glitch effect after a short duration
        setTimeout(() => {
            element.classList.remove('glitch');
        }, 500); // Glitch duration
    }

    function changeBackground() {
        const imageUrl = getRandomImage();
        slideshowContainer.style.backgroundImage = `url('${imageUrl}')`;
        applyGlitchEffect(slideshowContainer);
    }

    // Initial background set
    changeBackground();

    // Change background every 5 seconds (adjust as needed)
    setInterval(changeBackground, 5000);
});
