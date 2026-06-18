// materials1.js - Budget Tubing & Materials Estimator for Project Hantu Raya
// Calculates exactly how much tubing is needed and highlights components in 3D scene.

(function() {
    // Inject custom CSS styles for the materials button and modal
    const styles = `
        /* Spec container pointer events */
        .specs {
            pointer-events: auto !important;
        }

        /* Budget Estimate Button */
        #materials-calc-btn {
            margin-top: 15px;
            width: 100%;
            background: rgba(255, 109, 0, 0.12);
            border: 1px solid #ff6d00;
            color: #ff6d00;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.85rem;
            font-weight: bold;
            padding: 12px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            letter-spacing: 1px;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 0 10px rgba(255, 109, 0, 0.05);
        }

        #materials-calc-btn:hover {
            background: #ff6d00;
            color: #000;
            box-shadow: 0 0 20px rgba(255, 109, 0, 0.4);
            transform: translateY(-2px);
        }

        #materials-calc-btn:active {
            transform: translateY(0);
        }

        /* Modal Overlay */
        #materials-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(4px);
        }

        #materials-modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* Modal Container */
        #materials-modal-container {
            background: rgba(10, 14, 18, 0.95);
            border: 1px solid #ff6d00;
            box-shadow: 0 0 35px rgba(255, 109, 0, 0.3);
            width: 90%;
            max-width: 580px;
            padding: 30px;
            font-family: 'Courier New', Courier, monospace;
            color: #fff;
            box-sizing: border-box;
            transform: scale(0.9) translateY(20px);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        #materials-modal-overlay.active #materials-modal-container {
            transform: scale(1) translateY(0);
        }

        /* Modal Header */
        .materials-modal-header {
            border-bottom: 2px dashed rgba(255, 109, 0, 0.5);
            padding-bottom: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .materials-modal-title {
            font-size: 1.15rem;
            font-weight: bold;
            color: #ff6d00;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 0 0 10px rgba(255, 109, 0, 0.2);
        }

        .materials-modal-close {
            background: transparent;
            border: 1px solid #ff6d00;
            color: #ff6d00;
            font-family: inherit;
            font-weight: bold;
            font-size: 0.8rem;
            padding: 6px 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
        }

        .materials-modal-close:hover {
            background: #ff6d00;
            color: #000;
            box-shadow: 0 0 12px rgba(255, 109, 0, 0.4);
        }

        /* Material Item */
        .materials-item {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid #222;
            padding: 15px;
            margin-bottom: 15px;
            transition: all 0.2s ease;
            cursor: pointer;
            position: relative;
        }

        .materials-item:hover {
            background: rgba(255, 109, 0, 0.03);
            border-color: rgba(255, 109, 0, 0.4);
        }

        .materials-item.highlight-frame:hover {
            box-shadow: 0 0 15px rgba(255, 109, 0, 0.15);
        }

        .materials-item.highlight-cage:hover {
            box-shadow: 0 0 15px rgba(0, 229, 255, 0.15);
            border-color: rgba(0, 229, 255, 0.4);
        }

        .materials-item-title {
            font-weight: bold;
            font-size: 0.95rem;
            margin-top: 0;
            margin-bottom: 12px;
            padding-left: 10px;
            text-transform: uppercase;
        }

        .materials-item.highlight-frame .materials-item-title {
            color: #ff6d00;
            border-left: 3px solid #ff6d00;
        }

        .materials-item.highlight-cage .materials-item-title {
            color: #00e5ff;
            border-left: 3px solid #00e5ff;
        }

        .materials-item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.8rem;
            color: #aaa;
        }

        .materials-item-row span:last-child {
            font-weight: bold;
            color: #fff;
        }

        /* Cost breakdown slider */
        .materials-slider-box {
            background: rgba(255, 109, 0, 0.04);
            border: 1px solid rgba(255, 109, 0, 0.15);
            padding: 15px;
            margin-bottom: 20px;
        }

        .materials-slider-label {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            margin-bottom: 10px;
            color: #ccc;
        }

        .materials-slider-label span:last-child {
            color: #ff6d00;
            font-weight: bold;
        }

        .materials-slider-input {
            width: 100%;
            accent-color: #ff6d00;
            cursor: pointer;
            background: #222;
            height: 4px;
            outline: none;
        }

        /* Footer totals */
        .materials-footer {
            border-top: 2px dashed rgba(255, 109, 0, 0.3);
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .materials-total-label {
            font-size: 0.95rem;
            font-weight: bold;
            color: #888;
            text-transform: uppercase;
        }

        .materials-total-price {
            font-size: 1.4rem;
            font-weight: bold;
            color: #ff6d00;
            text-shadow: 0 0 10px rgba(255, 109, 0, 0.3);
        }

        .materials-hint {
            font-size: 0.7rem;
            color: #666;
            text-align: center;
            margin-top: 15px;
            line-height: 1.4;
        }
    `;

    // Base materials quantities (calculated from 3D model nodes/sizes)
    // Frame base length: 438 inches = 36.5 ft
    // Cage base length: 1740 inches = 145 ft
    const baseFrameFeet = 36.5;
    const baseCageFeet = 145.0;

    // Price details for thinner, cheaper, yet safe mild steel tubing (vs expensive 4130 chromoly)
    const framePricePerFoot = 4.25; // 2"x2"x0.120" Square A500 Mild Steel
    const cagePricePerFoot = 3.75;  // 1.50" OD x 0.095" DOM A513 Mild Steel
    const consumablesCost = 45.00; // Welding wire, cutting wheels, prep agents

    // Three.js highlight colors & materials
    let highlightMaterials = null;

    // Inject stylesheet
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // Initialize once the window/Three.js resources are ready
    window.addEventListener('load', () => {
        const specsBox = document.querySelector('.specs');
        if (!specsBox) return;

        // Create Button
        const calcBtn = document.createElement('button');
        calcBtn.id = 'materials-calc-btn';
        calcBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
            </svg>
            Budget Materials List
        `;
        specsBox.appendChild(calcBtn);

        // Create Modal Overlay & Container
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'materials-modal-overlay';
        modalOverlay.innerHTML = `
            <div id="materials-modal-container">
                <div class="materials-modal-header">
                    <h3 class="materials-modal-title">Optimized Budget Materials List</h3>
                    <button class="materials-modal-close" id="materials-close-btn">Close</button>
                </div>
                
                <div class="materials-slider-box">
                    <div class="materials-slider-label">
                        <span>Waste & Cutting Margin</span>
                        <span id="materials-waste-val">10%</span>
                    </div>
                    <input type="range" id="materials-waste-slider" class="materials-slider-input" min="5" max="25" value="10" step="1">
                </div>

                <div class="materials-item highlight-frame" id="item-frame">
                    <h4 class="materials-item-title">1. Subframe & Engine Cradle</h4>
                    <div class="materials-item-row">
                        <span>Profile & Spec</span>
                        <span>2" x 2" x 0.120" Square Tube (A500 Mild Steel)</span>
                    </div>
                    <div class="materials-item-row">
                        <span>Required Length</span>
                        <span id="frame-req-len">40.2 ft</span>
                    </div>
                    <div class="materials-item-row">
                        <span>Unit Price</span>
                        <span>$4.25 / ft</span>
                    </div>
                    <div class="materials-item-row">
                        <span>Subtotal Cost</span>
                        <span id="frame-subtotal">$170.85</span>
                    </div>
                </div>

                <div class="materials-item highlight-cage" id="item-cage">
                    <h4 class="materials-item-title">2. Exocet Safety Cage & Bracing</h4>
                    <div class="materials-item-row">
                        <span>Profile & Spec</span>
                        <span>1.50" OD x 0.095" Wall DOM Tubing (A513 Mild Steel)</span>
                    </div>
                    <div class="materials-item-row">
                        <span>Required Length</span>
                        <span id="cage-req-len">159.5 ft</span>
                    </div>
                    <div class="materials-item-row">
                        <span>Unit Price</span>
                        <span>$3.75 / ft</span>
                    </div>
                    <div class="materials-item-row">
                        <span>Subtotal Cost</span>
                        <span id="cage-subtotal">$598.13</span>
                    </div>
                </div>

                <div class="materials-item" style="cursor: default;">
                    <h4 class="materials-item-title" style="border-left: 3px solid #888; color: #ccc;">3. Shop Consumables</h4>
                    <div class="materials-item-row">
                        <span>Items</span>
                        <span>ER70S-6 TIG Rods, Flap Discs, Cut-off Wheels</span>
                    </div>
                    <div class="materials-item-row">
                        <span>Flat Estimate</span>
                        <span>$45.00</span>
                    </div>
                </div>

                <div class="materials-footer">
                    <span class="materials-total-label">Estimated Total Price</span>
                    <span class="materials-total-price" id="materials-total-price">$813.98</span>
                </div>

                <div class="materials-hint">
                    * Optimized for low cost and ease of fabrication. 2" square frame rails simplify miter cuts.<br>
                    1.5" x 0.095" DOM provides a lightweight, structural, and safe roll cage for utility use.
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        // Reference elements
        const wasteSlider = document.getElementById('materials-waste-slider');
        const wasteVal = document.getElementById('materials-waste-val');
        const frameReqLen = document.getElementById('frame-req-len');
        const frameSubtotal = document.getElementById('frame-subtotal');
        const cageReqLen = document.getElementById('cage-req-len');
        const cageSubtotal = document.getElementById('cage-subtotal');
        const totalPrice = document.getElementById('materials-total-price');
        const closeBtn = document.getElementById('materials-close-btn');
        const itemFrame = document.getElementById('item-frame');
        const itemCage = document.getElementById('item-cage');

        // Setup Three.js Custom highlight materials if THREE is present
        if (window.THREE) {
            highlightMaterials = {
                frame: new THREE.MeshStandardMaterial({ color: 0xff6d00, metalness: 0.9, roughness: 0.2 }),
                cage: new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9, roughness: 0.2 }),
                dimmed: new THREE.MeshStandardMaterial({ color: 0x112233, metalness: 0.3, roughness: 0.8, opacity: 0.2, transparent: true })
            };
        }

        // Functions to change Three.js tube colors dynamically
        function setThreeJSHighlight(focus) {
            if (!window.THREE || !window.chassisGroup) return;

            window.chassisGroup.traverse((node) => {
                if (node.isMesh || node instanceof THREE.Mesh) {
                    // Ignore tires/rims for highlight swaps, but dim them
                    if (node.userData.type === 'tire' || node.userData.type === 'rim') {
                        if (focus === 'none') {
                            node.material = node.userData.originalMaterial || node.material;
                        } else {
                            node.material = highlightMaterials.dimmed;
                        }
                        return;
                    }

                    const type = node.userData.type; // 'frame' or 'cage'
                    if (!type) return;

                    // Save original material reference on the node itself
                    if (!node.userData.originalMaterial) {
                        node.userData.originalMaterial = node.material;
                    }

                    if (focus === 'none') {
                        node.material = node.userData.originalMaterial;
                    } else if (focus === 'all') {
                        if (type === 'frame') {
                            node.material = highlightMaterials.frame;
                        } else if (type === 'cage') {
                            node.material = highlightMaterials.cage;
                        } else {
                            node.material = node.userData.originalMaterial;
                        }
                    } else if (focus === 'frame') {
                        if (type === 'frame') {
                            node.material = highlightMaterials.frame;
                        } else {
                            node.material = highlightMaterials.dimmed;
                        }
                    } else if (focus === 'cage') {
                        if (type === 'cage') {
                            node.material = highlightMaterials.cage;
                        } else {
                            node.material = highlightMaterials.dimmed;
                        }
                    }
                }
            });
        }

        // Recalculate lengths and prices
        function updateEstimator() {
            const margin = parseInt(wasteSlider.value) / 100;
            wasteVal.innerText = `${wasteSlider.value}%`;

            // Calculate lengths
            const frameLen = baseFrameFeet * (1 + margin);
            const cageLen = baseCageFeet * (1 + margin);

            // Calculate costs
            const frameCost = frameLen * framePricePerFoot;
            const cageCost = cageLen * cagePricePerFoot;
            const total = frameCost + cageCost + consumablesCost;

            // Update DOM UI
            frameReqLen.innerText = `${frameLen.toFixed(1)} ft`;
            frameSubtotal.innerText = `$${frameCost.toFixed(2)}`;
            cageReqLen.innerText = `${cageLen.toFixed(1)} ft`;
            cageSubtotal.innerText = `$${cageCost.toFixed(2)}`;
            totalPrice.innerText = `$${total.toFixed(2)}`;
        }

        // Button Click to Open
        calcBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
            updateEstimator();
            setThreeJSHighlight('all');
        });

        // Close functions
        function closeModal() {
            modalOverlay.classList.remove('active');
            setThreeJSHighlight('none');
        }

        closeBtn.addEventListener('click', closeModal);

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        // Slider Input Event
        wasteSlider.addEventListener('input', updateEstimator);

        // Hover events in the modal items to trigger selective highlights in 3D
        itemFrame.addEventListener('mouseenter', () => setThreeJSHighlight('frame'));
        itemFrame.addEventListener('mouseleave', () => setThreeJSHighlight('all'));

        itemCage.addEventListener('mouseenter', () => setThreeJSHighlight('cage'));
        itemCage.addEventListener('mouseleave', () => setThreeJSHighlight('all'));
    });
})();
