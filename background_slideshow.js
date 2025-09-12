document.addEventListener('DOMContentLoaded', () => {
    const slideshowContainer = document.getElementById('background-slideshow');
    if (!slideshowContainer) {
        console.error('Slideshow container not found.');
        return;
    }

    const backgroundImages = [
        'bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg', 'bg5.jpg',
        'bg6.jpg', 'bg7.jpg', 'bg8.jpg', 'bg9.jpg', 'bg10.jpg'
    ];

    let currentImageIndex = -1;

    function getRandomImage() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * backgroundImages.length);
        } while (newIndex === currentImageIndex); // Ensure different image each time
        currentImageIndex = newIndex;
        return `./videos/${backgroundImages[currentImageIndex]}`;
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
