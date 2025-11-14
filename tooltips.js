/**
 * TooltipManager
 * A lightweight, performant class to manage custom tooltips on the page.
 * It creates a single tooltip element and updates its content and position
 * based on the element being hovered.
 */
class TooltipManager {
    constructor() {
        this.tooltipElement = null;
        this.init();
    }

    init() {
        // Create the single tooltip element
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'dynamic-tooltip';
        document.body.appendChild(this.tooltipElement);

        // Add event listeners to the document
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('mouseout', this.handleMouseOut.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    handleMouseOver(e) {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            const tooltipText = target.getAttribute('data-tooltip');
            if (tooltipText) {
                this.tooltipElement.innerHTML = tooltipText;
                this.tooltipElement.classList.add('visible');
            }
        }
    }

    handleMouseOut(e) {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            this.tooltipElement.classList.remove('visible');
        }
    }

    handleMouseMove(e) {
        if (this.tooltipElement.classList.contains('visible')) {
            // Position the tooltip near the cursor
            // The offsets prevent the tooltip from flickering by being under the cursor
            let x = e.clientX + 15;
            let y = e.clientY + 15;

            // Prevent tooltip from going off-screen
            if (x + this.tooltipElement.offsetWidth > window.innerWidth) {
                x = e.clientX - this.tooltipElement.offsetWidth - 15;
            }
            if (y + this.tooltipElement.offsetHeight > window.innerHeight) {
                y = e.clientY - this.tooltipElement.offsetHeight - 15;
            }

            this.tooltipElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
    }
}

// Initialize the tooltip system on page load
document.addEventListener('DOMContentLoaded', () => {
    new TooltipManager();
});