document.addEventListener('DOMContentLoaded', () => {

    // --- Enter Site Button ---
    const enterOverlay = document.getElementById('enter-overlay');
    const enterBtn = document.getElementById('enter-btn');
    const backgroundMusic = document.getElementById('background-music');

    enterBtn.addEventListener('click', () => {
        enterOverlay.style.opacity = '0';
        setTimeout(() => {
            enterOverlay.style.display = 'none';
        }, 1000); // Match this to the transition duration

        // Play background music
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(error => {
                console.log("Autoplay was prevented. User will need to interact more to play audio.");
            });
        }
    });

    // --- Blood Rain Animation ---
    const bloodRainContainer = document.getElementById('blood-rain');

    function createRaindrop() {
        const drop = document.createElement('div');
        drop.classList.add('raindrop');
        drop.style.left = `${Math.random() * 100}vw`;
        drop.style.animationDuration = `${Math.random() * 1 + 0.5}s`; // Random duration
        
        bloodRainContainer.appendChild(drop);

        // Remove the drop after it falls
        drop.addEventListener('animationend', () => {
            drop.remove();
        });
    }

    function rainBurst() {
        const burstSize = Math.floor(Math.random() * 5) + 1; // 1 to 5 drops per burst
        for (let i = 0; i < burstSize; i++) {
            setTimeout(createRaindrop, Math.random() * 1000); // create drops within a 1 second window
        }
    }

    function generateRain() {
        rainBurst();
        setTimeout(generateRain, Math.random() * 5000 + 3000); // new burst every 3 to 8 seconds
    }

    generateRain();

    // --- Upgraded Info Popup Logic ---
    const infoPopup = document.getElementById('info-popup');
    const popupContent = document.querySelector('.popup-content');
    const closeBtn = document.querySelector('.close-btn');
    const popupTitle = document.getElementById('popup-title');
    const popupText = document.getElementById('popup-text');
    const mechanicTips = [
        {
            title: "Beyond the Jump Start",
            text: "Our emergency services cover more than just batteries. We can diagnose starter failures, alternator issues, and fuel delivery problems on the spot, often getting you running without a tow.",
            icon: "🚨"
        },
        {
            title: "The Mobile Command Center",
            text: "Our diagnostic tablets are dealership-level tools. We can reprogram keys, diagnose complex CAN bus communication errors, and analyze live sensor data right at your curb.",
            icon: "🔍"
        },
        {
            title: "The Myth of 'Squeaky' Brakes",
            text: "While squeaking can indicate worn pads, it can also be caused by moisture or dust. We measure pad thickness and check for rotor warping to give you an accurate and honest assessment.",
            icon: "🛑"
        },
        {
            title: "The Heart of the Machine",
            text: "Modern engines are complex. We carry specialized tools like digital borescopes to inspect cylinder walls and thermal cameras to spot hidden heat issues, preventing catastrophic failures.",
            icon: "⚙️"
        },
        {
            title: "Chasing the Gremlins",
            text: "Electrical issues can be frustrating. We use advanced circuit testers and wiring diagrams to trace parasitic draws that kill your battery and fix faulty connections that other shops might miss.",
            icon: "🔋"
        },
        {
            title: "Uptime is Everything",
            text: "For our fleet clients, we create a custom digital profile for each vehicle, tracking maintenance history and predicting future needs to maximize reliability and minimize costly downtime.",
            icon: "🚛"
        }
    ];

    function showRandomTip() {
        if (popupsDisabled) return;

        const randomIndex = Math.floor(Math.random() * mechanicTips.length);
        const tip = mechanicTips[randomIndex];

        popupTitle.textContent = tip.title;
        popupText.textContent = tip.text;
        document.querySelector('.popup-icon').textContent = tip.icon;
        
        infoPopup.style.display = 'block';
    }

    function hidePopup() {
        popupContent.style.animation = 'popup-scale-out 0.5s forwards cubic-bezier(0.165, 0.84, 0.44, 1)';
        infoPopup.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            infoPopup.style.display = 'none';
            popupContent.style.animation = 'popup-scale-in 0.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            infoPopup.style.animation = 'fadeIn 0.5s forwards';
        }, 500);
    }

    function scheduleRandomPopup() {
        const randomInterval = Math.random() * (30000 - 15000) + 15000; // 15 to 30 seconds
        setTimeout(() => {
            showRandomTip();
            scheduleRandomPopup();
        }, randomInterval);
    }

    closeBtn.addEventListener('click', hidePopup);

    window.addEventListener('click', (event) => {
        if (event.target == infoPopup) {
            hidePopup();
        }
    });

    dontShowBtn.addEventListener('click', () => {
        popupsDisabled = true;
        localStorage.setItem('popupsDisabled', 'true');
        dontShowBtn.textContent = "Popups Disabled";
        hidePopup();
    });

    // Start the random popup scheduler after a delay
    setTimeout(scheduleRandomPopup, 10000); // First popup after 10 seconds

    // --- Header Scroll Effect ---
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // --- Scroll Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    // --- Interactive Engine Bay ---
    const engineAreas = document.querySelectorAll('#engine-bay map area');
    const engineInfoBox = document.querySelector('#engine-bay .engine-info-box');

    engineAreas.forEach(area => {
        area.addEventListener('click', (e) => {
            e.preventDefault();
            engineInfoBox.textContent = area.dataset.info;
        });
    });

    // --- Sound Effects ---
    const hoverSound = new Audio('./videos/rare1.mp3');
    const clickSound = new Audio('./videos/impact.mp3');
    hoverSound.volume = 0.3;
    clickSound.volume = 0.5;

    document.querySelectorAll('.service-card, .cta-button, .nav-links a, .footer-links a, .read-more-btn, .dropdown a').forEach(el => {
        el.addEventListener('mouseenter', () => {
            hoverSound.currentTime = 0;
            hoverSound.play();
        });
        el.addEventListener('click', () => {
            clickSound.currentTime = 0;
            clickSound.play();
        });
    });

    // --- Engine Quiz ---
    const quizContainer = document.getElementById('quiz');
    const resultsContainer = document.getElementById('quiz-results');
    const submitButton = document.getElementById('submit-quiz');

    const myQuestions = [
        {
            question: "What does ICE stand for?",
            answers: {
                a: "Internal Combustion Engine",
                b: "Internal Cooling Engine",
                c: "Icy Cool Engine"
            },
            correctAnswer: "a"
        },
        {
            question: "Who is credited with inventing the first successful four-stroke engine?",
            answers: {
                a: "Karl Benz",
                b: "Henry Ford",
                c: "Nicolaus Otto"
            },
            correctAnswer: "c"
        },
        {
            question: "What is the purpose of a crankshaft?",
            answers: {
                a: "To open and close the valves",
                b: "To convert linear motion to rotational motion",
                c: "To ignite the fuel"
            },
            correctAnswer: "b"
        }
    ];

    function buildQuiz(){
        const output = [];
        myQuestions.forEach((currentQuestion, questionNumber) => {
            const answers = [];
            for(letter in currentQuestion.answers){
                answers.push(
                    `<label>
                        <input type="radio" name="question${questionNumber}" value="${letter}">
                        ${letter} :
                        ${currentQuestion.answers[letter]}
                    </label>`
                );
            }
            output.push(
                `<div class="question"> ${currentQuestion.question} </div>
                <div class="answers"> ${answers.join('')} </div>`
            );
        });
        quizContainer.innerHTML = output.join('');
    }

    function showResults(){
        const answerContainers = quizContainer.querySelectorAll('.answers');
        let numCorrect = 0;
        myQuestions.forEach((currentQuestion, questionNumber) => {
            const answerContainer = answerContainers[questionNumber];
            const selector = `input[name=question${questionNumber}]:checked`;
            const userAnswer = (answerContainer.querySelector(selector) || {}).value;
            if(userAnswer === currentQuestion.correctAnswer){
                numCorrect++;
                answerContainers[questionNumber].style.color = 'lightgreen';
            } else {
                answerContainers[questionNumber].style.color = 'red';
            }
        });
        resultsContainer.innerHTML = `${numCorrect} out of ${myQuestions.length}`;
    }

    buildQuiz();
    submitButton.addEventListener('click', showResults);

    // --- New WebGL Hero Shader ---
    // This code has been moved to shader.js

    // --- Panel Shaders ---
    const panelCanvases = [
        { id: 'services-canvas', options: { color: [0.0, 0.5, 0.6], speed: 0.5 } },
        { id: 'why-us-canvas', options: { color: [0.1, 0.3, 0.7], speed: 0.3 } },
        { id: 'news-canvas', options: { color: [0.2, 0.4, 0.5], speed: 0.6 } },
        { id: 'video-promo-canvas', options: { color: [0.1, 0.5, 0.5], speed: 0.4 } },
        { id: 'slideshow-section-canvas', options: { color: [0.3, 0.3, 0.6], speed: 0.7 } },
        { id: 'videoplayer-section-canvas', options: { color: [0.2, 0.5, 0.7], speed: 0.5 } },
        { id: 'facts-canvas', options: { color: [0.1, 0.4, 0.6], speed: 0.3 } },
        { id: 'engine-bay-canvas', options: { color: [0.3, 0.5, 0.8], speed: 0.6 } },
    ];

    panelCanvases.forEach(panel => {
        const canvas = document.getElementById(panel.id);
        if (canvas) {
            initializePanelShader(canvas, panel.options);
        }
    });
});