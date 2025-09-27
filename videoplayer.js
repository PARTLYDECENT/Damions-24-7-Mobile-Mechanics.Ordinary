const videoContainer = document.getElementById('video-player-container');
if (!videoContainer) {
    console.error('Video player container not found.');
}

// In a real application, you would fetch this list from a server.
// For this example, we'll hardcode some video names.
// Make sure these video files exist in the 'videos' directory.
const videoFiles = [
    'vid1.mp4',
    'vid2.mp4',
    'vid3.mp4',
    'vid4.mp4',
    'vid5.mp4',
    'vid6.mp4',
    'vid7.mp4',
    'vid8.mp4',
    'vid9.mp4',
    'vid10.mp4'
];

let currentVideoIndex = 0;

function createVideoPlayer() {
    videoContainer.innerHTML = ''; // Clear previous player if any

    const videoElement = document.createElement('video');
    videoElement.id = 'main-video-player';
    videoElement.controls = true;
    videoElement.autoplay = false;
    videoElement.style.width = '100%';
    videoElement.style.maxWidth = '800px';
    videoElement.style.display = 'block';
    videoElement.style.margin = '0 auto';

    const sourceElement = document.createElement('source');
    sourceElement.src = `./videos/${videoFiles[currentVideoIndex]}`;
    sourceElement.type = 'video/mp4'; // Assuming MP4 format

    videoElement.appendChild(sourceElement);
    videoContainer.appendChild(videoElement);

    // Add navigation controls
    const controlsDiv = document.createElement('div');
    controlsDiv.style.textAlign = 'center';
    controlsDiv.style.marginTop = '10px';

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.onclick = playPreviousVideo;
    controlsDiv.appendChild(prevButton);

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.onclick = playNextVideo;
    controlsDiv.appendChild(nextButton);

    videoContainer.appendChild(controlsDiv);

    videoElement.load(); // Load the new video source
}

function playNextVideo() {
    currentVideoIndex = (currentVideoIndex + 1) % videoFiles.length;
    createVideoPlayer();
}

function playPreviousVideo() {
    currentVideoIndex = (currentVideoIndex - 1 + videoFiles.length) % videoFiles.length;
    createVideoPlayer();
}

// Initialize the player
createVideoPlayer();