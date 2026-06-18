/**
 * Cybernetic Voice Narrator Module
 * Damion's 24/7 Mobile Mechanics
 */

class VoiceNarrator {
    constructor() {
        this.narratorText = "Welcome to Damion's 24/7 Mobile Automotive and Professional Roofing Solutions. Whether you need an emergency roadside mechanic or expert roof leak repair, I come directly to your location, day or night. Select a service below or tap the hotline to connect with me immediately. Professional assistance is just one call away.";
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.words = [];
        this.activeWordIndex = -1;
        
        // Voice Settings
        this.isMuted = localStorage.getItem('musicMuted') === 'true';
        this.voiceMode = 'standard'; // 'standard' or 'robotic'
        this.isPlaying = false;
        
        // Canvas Animation Properties
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.waveAmplitude = 0;
        this.targetAmplitude = 0;
        this.wavePhase = 0;

        // Initialize elements
        this.initDOM();
        this.parseWords();
        this.initCanvas();
        this.initAudioMuteObserver();
    }

    /**
     * Parse text into words with start and end index mappings for highlighting subtitles
     */
    parseWords() {
        const regex = /\s+/;
        let currentPos = 0;
        
        // Split by spaces but preserve characters for index lookup
        const rawWords = this.narratorText.split(regex);
        
        this.words = rawWords.map(word => {
            const start = this.narratorText.indexOf(word, currentPos);
            const end = start + word.length;
            currentPos = end;
            return {
                text: word,
                start: start,
                end: end
            };
        });
    }

    /**
     * Create and inject the Holographic Voice HUD UI Panel
     */
    initDOM() {
        // Main panel container
        this.panel = document.createElement('div');
        this.panel.className = 'narrator-hud-panel';
        this.panel.id = 'narrator-hud-widget';
        
        // Dynamic HTML structure matching modern HUD aesthetic
        this.panel.innerHTML = `
            <div class="narrator-header">
                <div class="narrator-tag">Mech-Voice Unit</div>
                <div class="narrator-controls">
                    <button class="narrator-btn play-btn" title="Replay Message" id="narrator-replay-btn">⚙</button>
                    <button class="narrator-btn voice-btn" title="Toggle Modulator" id="narrator-voice-toggle-btn">🤖</button>
                    <button class="narrator-btn dismiss-btn" title="Close Panel" id="narrator-close-btn">&times;</button>
                </div>
            </div>
            <div class="narrator-waveform-container">
                <canvas class="narrator-waveform-canvas" id="narrator-canvas"></canvas>
            </div>
            <div class="narrator-subtitle-box" id="narrator-subtitles">
                ${this.words.map((w, idx) => `<span id="narrator-word-${idx}">${w.text}</span>`).join(' ')}
            </div>
            <div class="narrator-status">
                <span>Vocal Core Active</span>
                <span id="narrator-mode-lbl">Mod: STANDARD</span>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        
        // Grab elements
        this.subtitlesContainer = document.getElementById('narrator-subtitles');
        this.replayBtn = document.getElementById('narrator-replay-btn');
        this.voiceToggleBtn = document.getElementById('narrator-voice-toggle-btn');
        this.closeBtn = document.getElementById('narrator-close-btn');
        this.modeLabel = document.getElementById('narrator-mode-lbl');
        
        // Event Listeners
        this.replayBtn.addEventListener('click', () => this.speak());
        this.voiceToggleBtn.addEventListener('click', () => this.toggleVoiceMode());
        this.closeBtn.addEventListener('click', () => this.hidePanel());
    }

    /**
     * Setup procedural canvas visualizer
     */
    initCanvas() {
        this.canvas = document.getElementById('narrator-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        const resizeCanvas = () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width * (window.devicePixelRatio || 1);
            this.canvas.height = rect.height * (window.devicePixelRatio || 1);
            this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Start animation loop
        this.animateWave();
    }

    /**
     * Listen to global website mute status changes
     */
    initAudioMuteObserver() {
        // Periodically verify mute state based on localStorage or mutual bindings
        setInterval(() => {
            const globalMute = localStorage.getItem('musicMuted') === 'true';
            if (globalMute !== this.isMuted) {
                this.isMuted = globalMute;
                if (this.isMuted && this.isPlaying) {
                    this.synth.cancel();
                    this.onSpeechEnd();
                }
            }
        }, 1000);
    }

    /**
     * Toggle voice pitch / robotic modulation mode
     */
    toggleVoiceMode() {
        if (this.voiceMode === 'standard') {
            this.voiceMode = 'robotic';
            this.modeLabel.textContent = "Mod: AI-DIAGNOSTIC";
            this.voiceToggleBtn.style.color = "var(--hud-orange, #ff5e00)";
            this.voiceToggleBtn.style.borderColor = "var(--hud-orange, #ff5e00)";
        } else {
            this.voiceMode = 'standard';
            this.modeLabel.textContent = "Mod: STANDARD";
            this.voiceToggleBtn.style.color = "var(--hud-cyan, #00f2ea)";
            this.voiceToggleBtn.style.borderColor = "rgba(0, 242, 234, 0.3)";
        }
        
        // If speaking, restart with new modulation
        if (this.isPlaying) {
            this.speak();
        }
    }

    /**
     * Renders a glowing organic 2D oscilloscope waveform onto the canvas
     */
    animateWave() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Smoothly interpolate amplitude to follow speech activities
        this.waveAmplitude += (this.targetAmplitude - this.waveAmplitude) * 0.15;
        this.wavePhase += this.isPlaying ? 0.25 : 0.04;
        
        const cy = height / 2;
        
        // Render 3 layering waves for tech texture
        const renderWave = (frequency, amplitude, phaseOffset, color, lineWidth) => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = lineWidth;
            
            for (let x = 0; x < width; x++) {
                // Fade amplitudes at boundaries for neat aesthetics
                const edgeFade = Math.sin((x / width) * Math.PI);
                const y = cy + Math.sin(x * frequency + this.wavePhase + phaseOffset) * amplitude * edgeFade * 15;
                
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        };

        // Standard cyan theme, orange details if robotic
        const themeColor = this.voiceMode === 'robotic' ? '255, 94, 0' : '0, 242, 234';
        
        // Draw waves
        renderWave(0.04, this.waveAmplitude * 1.0, 0, `rgba(${themeColor}, 0.85)`, 2);
        renderWave(0.08, this.waveAmplitude * 0.5, Math.PI / 2, `rgba(${themeColor}, 0.4)`, 1);
        renderWave(0.02, this.waveAmplitude * 0.3, Math.PI, `rgba(${themeColor}, 0.25)`, 1.5);
        
        this.animationId = requestAnimationFrame(() => this.animateWave());
    }

    /**
     * Main action to speak the text using SpeechSynthesis Utterance
     */
    speak() {
        // Cancel ongoing speak requests
        this.synth.cancel();
        
        if (this.isMuted) {
            console.log("Speech Synthesis cancelled because site is currently muted.");
            return;
        }

        this.isPlaying = true;
        this.panel.classList.add('visible');
        this.targetAmplitude = 1.0;
        this.resetSubtitles();
        
        this.utterance = new SpeechSynthesisUtterance(this.narratorText);
        
        // Configure standard vs robotic mechanical modulation
        if (this.voiceMode === 'robotic') {
            this.utterance.pitch = 0.55; // Low mechanic robotic tone
            this.utterance.rate = 0.85;  // Cybernetic processing rate
        } else {
            this.utterance.pitch = 1.0;  // Standard natural tone
            this.utterance.rate = 1.0;   // Human speech rate
        }

        // Try to pick a highly qualitative local voice matching English
        const voices = this.synth.getVoices();
        let selectedVoice = null;
        
        if (voices.length > 0) {
            // Prefer US English voices for technical mechanics, otherwise local system voice
            selectedVoice = voices.find(v => v.lang.includes('en-US') && v.name.toLowerCase().includes('google')) ||
                            voices.find(v => v.lang.includes('en-US')) ||
                            voices.find(v => v.lang.startsWith('en'));
            if (selectedVoice) {
                this.utterance.voice = selectedVoice;
            }
        }

        // Word Boundary synchronization listener
        this.utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const charIndex = event.charIndex;
                this.highlightWord(charIndex);
            }
        };

        this.utterance.onend = () => this.onSpeechEnd();
        this.utterance.onerror = () => this.onSpeechEnd();

        // Speak!
        this.synth.speak(this.utterance);
    }

    /**
     * Highlight subtitle word dynamically
     */
    highlightWord(charIndex) {
        // Find which parsed word maps to this character index
        const wordIndex = this.words.findIndex(w => charIndex >= w.start && charIndex < w.end);
        
        if (wordIndex !== -1 && wordIndex !== this.activeWordIndex) {
            // Remove previous active highlights
            if (this.activeWordIndex !== -1) {
                const prevElem = document.getElementById(`narrator-word-${this.activeWordIndex}`);
                if (prevElem) {
                    prevElem.className = 'spoken-word';
                }
            }

            this.activeWordIndex = wordIndex;
            const activeElem = document.getElementById(`narrator-word-${wordIndex}`);
            if (activeElem) {
                activeElem.className = 'active-word';
                // Auto scroll subtitle container to follow active words
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            // Randomly jump canvas wave modulation details
            this.targetAmplitude = 0.8 + Math.random() * 0.4;
        }
    }

    /**
     * Reset active states upon voice completion
     */
    onSpeechEnd() {
        this.isPlaying = false;
        this.targetAmplitude = 0.15; // Slow idle ripple
        this.activeWordIndex = -1;
        
        // Turn all subtitles to fully spoken
        this.words.forEach((_, idx) => {
            const el = document.getElementById(`narrator-word-${idx}`);
            if (el) el.className = 'spoken-word';
        });

        setTimeout(() => {
            if (!this.isPlaying) {
                // If still idle, dim panel opacity slightly to merge with page HUD
                this.panel.style.opacity = '0.85';
            }
        }, 1500);
    }

    /**
     * Clear subtitle element classes
     */
    resetSubtitles() {
        this.activeWordIndex = -1;
        this.words.forEach((_, idx) => {
            const el = document.getElementById(`narrator-word-${idx}`);
            if (el) el.className = '';
        });
        if (this.subtitlesContainer) {
            this.subtitlesContainer.scrollTop = 0;
        }
    }

    /**
     * Hide / dismiss widget panel gracefully
     */
    hidePanel() {
        this.synth.cancel();
        this.onSpeechEnd();
        this.panel.classList.remove('visible');
    }
}

// Instantiate voice modules inside a global scope
window.addEventListener('DOMContentLoaded', () => {
    // Expose engine to other scripts
    window.CyberNarrator = new VoiceNarrator();
    
    // Enable system trigger function
    window.triggerNarratorWelcome = () => {
        setTimeout(() => {
            if (window.CyberNarrator) {
                window.CyberNarrator.speak();
            }
        }, 600); // Slight delay after warp transition completes
    };
});
