const canvas = document.getElementById('waveformCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let timebase = 20; // ms per division
let vScale = 5; // Volts per division

// Dummy Data Generation
function generateWaveform(type, frequency, amplitude) {
    const points = [];
    const sampleRate = 10000; // Hz
    const duration = 1; // seconds
    for (let i = 0; i < sampleRate * duration; i++) {
        const t = i / sampleRate;
        let y = 0;
        if (type === 'sine') {
            y = Math.sin(2 * Math.PI * frequency * t) * amplitude;
        } else if (type === 'square') {
            y = Math.sign(Math.sin(2 * Math.PI * frequency * t)) * amplitude;
        }
        // Add some noise
        y += (Math.random() - 0.5) * 0.5;
        points.push(y);
    }
    return points;
}

const signalA = generateWaveform('square', 50, 12); // 50Hz square wave, 12V amplitude (0-12V roughly)

function resize() {
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;
    draw();
}

function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Vertical lines (Time)
    const numDivX = 10;
    const pxPerDivX = width / numDivX;
    for (let i = 1; i < numDivX; i++) {
        ctx.moveTo(i * pxPerDivX, 0);
        ctx.lineTo(i * pxPerDivX, height);
    }

    // Horizontal lines (Voltage)
    const numDivY = 8;
    const pxPerDivY = height / numDivY;
    for (let i = 1; i < numDivY; i++) {
        ctx.moveTo(0, i * pxPerDivY);
        ctx.lineTo(width, i * pxPerDivY);
    }

    ctx.stroke();

    // Center line
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
}

function drawWaveform(data, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const pxPerSec = width / (timebase * 10 / 1000); // 10 divisions
    const pxPerVolt = (height / 8) / vScale;
    const zeroY = height / 2;

    // Simple render loop (optimization needed for large datasets)
    for (let i = 0; i < data.length; i++) {
        const t = i / 10000; // 10k sample rate
        const x = t * pxPerSec;
        const y = zeroY - (data[i] * pxPerVolt);

        if (x > width) break;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    drawGrid();
    drawWaveform(signalA, '#00ff00'); // Green trace
}

window.addEventListener('resize', resize);
resize();

// Controls
document.getElementById('timebase').addEventListener('change', (e) => {
    timebase = parseInt(e.target.value);
    draw();
});

document.getElementById('vScale').addEventListener('change', (e) => {
    vScale = parseInt(e.target.value);
    draw();
});

// Animation loop to simulate live data (optional, just shifting phase)
let offset = 0;
function animate() {
    // In a real app, we'd shift the data buffer.
    // For now, static render is fine as per requirements.
    // requestAnimationFrame(animate);
}
animate();
