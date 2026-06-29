const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

let isDrawing = false;

// Configuration du pinceau (Couleur rose/violette Frutiger Aero)
ctx.strokeStyle = '#db2777'; 
ctx.lineWidth = 4;
ctx.lineCap = 'square'; // Reste dans le thème carré sans arrondis !

// Fonctions pour dessiner
function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!isDrawing) return;

    // Gestion du tactile (téléphone) et de la souris
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Événements souris
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Événements écrans tactiles
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

// Bouton pour tout effacer
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Bouton pour télécharger l'image
saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'drawing-for-amaisaarkyuu.png';
    link.href = canvas.toDataURL();
    link.click();
});