document.addEventListener('DOMContentLoaded', () => {
    const slideshowCanvas = document.getElementById('hero-slideshow-canvas');
    if (!slideshowCanvas) {
        console.error('Slideshow canvas not found.');
        return;
    }

    const ctx = slideshowCanvas.getContext('2d');

    const backgroundImages = [
        'bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg', 'bg5.jpg',
        'bg6.jpg', 'bg7.jpg', 'bg8.jpg', 'bg9.jpg', 'bg10.jpg'
    ];

    let currentImageIndex = -1;
    const loadedImages = [];

    // Preload images
    function preloadImages() {
        backgroundImages.forEach(imgName => {
            const img = new Image();
            img.src = `./videos/${imgName}`;
            img.onload = () => {
                loadedImages.push(img);
                if (loadedImages.length === backgroundImages.length) {
                    // All images loaded, start slideshow
                    changeBackground();
                    setInterval(changeBackground, 5000); // Change every 5 seconds
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${img.src}`);
            };
        });
    }

    function getRandomImage() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * loadedImages.length);
        } while (newIndex === currentImageIndex); // Ensure different image each time
        currentImageIndex = newIndex;
        return loadedImages[currentImageIndex];
    }

    function drawImageWithGlitch(image) {
        slideshowCanvas.width = slideshowCanvas.offsetWidth;
        slideshowCanvas.height = slideshowCanvas.offsetHeight;

        ctx.clearRect(0, 0, slideshowCanvas.width, slideshowCanvas.height);

        // Draw the main image
        ctx.drawImage(image, 0, 0, slideshowCanvas.width, slideshowCanvas.height);

        // Apply glitch effects
        const glitchAmount = 5; // Pixels for glitch offset
        const numGlitches = 5; // Number of glitch layers

        for (let i = 0; i < numGlitches; i++) {
            const xOffset = (Math.random() - 0.5) * glitchAmount * 2;
            const yOffset = (Math.random() - 0.5) * glitchAmount * 2;
            const width = slideshowCanvas.width;
            const height = slideshowCanvas.height;
            const sx = Math.random() * width;
            const sy = Math.random() * height;
            const sWidth = Math.random() * width / 3 + width / 6;
            const sHeight = Math.random() * height / 3 + height / 6;

            ctx.globalAlpha = Math.random() * 0.3 + 0.1; // Random transparency
            ctx.drawImage(image, sx, sy, sWidth, sHeight, xOffset, yOffset, width, height);
        }
        ctx.globalAlpha = 1.0; // Reset alpha
    }

    function changeBackground() {
        if (loadedImages.length === 0) return;
        const image = getRandomImage();
        drawImageWithGlitch(image);
    }

    preloadImages();
});
