const steps = [
    {
        id: 1,
        title: "Verify Meter Integrity (Live)",
        instruction: "Test your multimeter on a known 12V source (e.g., the vehicle's 12V battery) to ensure it is functioning correctly.",
        visual: "meter_test_12v.png", // Placeholder
        visualText: "Visual Aid: Multimeter reading 12.6V on 12V Battery"
    },
    {
        id: 2,
        title: "Locate Manual Service Disconnect",
        instruction: "Locate the High Voltage Manual Service Disconnect (MSD) or First Responder Loop. See the location map below.",
        visual: "frunk_location.png",
        visualText: "3D Map: Frunk Area - Under Cowl",
        hasMarker: true,
        markerPos: { top: '30%', left: '45%' }
    },
    {
        id: 3,
        title: "Disable System",
        instruction: "Remove the MSD or cut the First Responder Loop according to the manufacturer procedure. Wait 5 minutes for capacitors to discharge.",
        visual: "msd_removal.png",
        visualText: "Visual Aid: Pulling the Orange MSD Lever"
    },
    {
        id: 4,
        title: "Verify Zero Voltage (Dead)",
        instruction: "Test for voltage at the High Voltage bus terminals. The reading must be 0V.",
        visual: "hv_test_0v.png",
        visualText: "Visual Aid: Probing HV Lines - Reading 0.0V"
    },
    {
        id: 5,
        title: "Re-Verify Meter (Live)",
        instruction: "Test your multimeter AGAIN on the known 12V source to ensure it did not fail during the procedure.",
        visual: "meter_retest.png",
        visualText: "Visual Aid: Multimeter reading 12.6V on 12V Battery (Again)"
    }
];

let currentStep = 0;

const contentContainer = document.getElementById('step-content');
const nextBtn = document.getElementById('next-btn');
const confirmCheck = document.getElementById('confirm-check');

function renderStep(index) {
    const step = steps[index];

    // Update Indicators
    document.querySelectorAll('.step-item').forEach((el, i) => {
        el.classList.remove('active');
        if (i === index) el.classList.add('active');
        if (i < index) el.classList.add('completed');
    });

    // Render Content
    let visualHtml = `<div class="visual-aid">${step.visualText}`;
    if (step.hasMarker) {
        visualHtml += `<div class="map-marker" style="top: ${step.markerPos.top}; left: ${step.markerPos.left};"></div>`;
    }
    visualHtml += `</div>`;

    contentContainer.innerHTML = `
        <div class="instruction-header">
            <h2>${step.title}</h2>
            <p>${step.instruction}</p>
        </div>
        ${visualHtml}
    `;

    // Reset Controls
    confirmCheck.checked = false;
    nextBtn.disabled = true;

    if (index === steps.length - 1) {
        nextBtn.textContent = "Complete Protocol";
    } else {
        nextBtn.textContent = "Next Step \u2192";
    }
}

confirmCheck.addEventListener('change', (e) => {
    nextBtn.disabled = !e.target.checked;
});

nextBtn.addEventListener('click', () => {
    if (currentStep < steps.length - 1) {
        currentStep++;
        renderStep(currentStep);
    } else {
        alert("Protocol Complete. Safe to proceed with repairs.");
        // Redirect or reset
        window.location.href = 'hub.html';
    }
});

// Initialize
renderStep(0);
