function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    ev.target.classList.add('dragging');
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    var card = document.getElementById(data);
    card.classList.remove('dragging');

    // Find the closest column content
    var targetColumn = ev.target.closest('.column-content');

    if (targetColumn) {
        targetColumn.appendChild(card);
        updateCounts();
    }
}

function updateCounts() {
    const columns = document.querySelectorAll('.column');
    columns.forEach(col => {
        const countSpan = col.querySelector('.card-count');
        const count = col.querySelectorAll('.kanban-card').length;
        countSpan.textContent = count;
    });
}

// Optional: Add event listeners for dragend to clean up styles if drop fails or is cancelled
document.addEventListener('dragend', function (event) {
    if (event.target.classList.contains('kanban-card')) {
        event.target.classList.remove('dragging');
    }
});
