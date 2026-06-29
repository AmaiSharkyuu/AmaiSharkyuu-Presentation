// --- À METTRE TOUT EN HAUT DE SCRIPT.JS ---

const toggleDrawingBtn = document.getElementById('toggleDrawingBtn');
const drawingBox = document.getElementById('drawingBox');
const profileContent = document.getElementById('profileContent');

toggleDrawingBtn.addEventListener('click', () => {
    drawingBox.classList.toggle('hidden');
    profileContent.classList.toggle('hidden'); // Cache ou montre tout le profil
    
    if (drawingBox.classList.contains('hidden')) {
        toggleDrawingBtn.innerText = "🎨 Open Drawing Board";
        toggleDrawingBtn.classList.remove('btn-green'); // Retire le vert
    } else {
        toggleDrawingBtn.innerText = "❌ Close Drawing Board";
        toggleDrawingBtn.classList.add('btn-green'); // Devient vert
    }
});

// --- LE RESTE DE TON CODE EXISTANT (DESSIN + WEBHOOK) EN DESSOUS ---


// REMPLACE CETTE URL PAR TON LIEN DE WEBHOOK DISCORD
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1521158303479238818/-_CcltnnV1ve9VG_PxVKyTDD3BFMkGczkitnQAHaxrHhzbFFgh12GAUdiBf5zRuQUgyZ';

const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const textBtn = document.getElementById('textBtn');
const stickerBtn = document.getElementById('stickerBtn');
const clearBtn = document.getElementById('clearBtn');
const sendDiscordBtn = document.getElementById('sendDiscordBtn');

let isDrawing = false;
let currentMode = 'draw'; // 'draw', 'text', 'sticker'

// Activer le mode Dessin par défaut au changement d'outils de couleur/taille
colorPicker.addEventListener('input', () => currentMode = 'draw');
sizePicker.addEventListener('input', () => currentMode = 'draw');

textBtn.addEventListener('click', () => {
    currentMode = 'text';
    alert("Click anywhere on the canvas to add text!");
});

stickerBtn.addEventListener('click', () => {
    currentMode = 'sticker';
    alert("Click anywhere on the canvas to place a sticker!");
});

// Fonctions principales
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    return { x, y };
}

function handleCanvasClick(e) {
    const coords = getCoordinates(e);

    if (currentMode === 'text') {
        const text = prompt("Enter your text:");
        if (text) {
            ctx.fillStyle = colorPicker.value;
            ctx.font = `${sizePicker.value * 3}px 'Segoe UI'`;
            ctx.fillText(text, coords.x, coords.y);
        }
        currentMode = 'draw';
    } else if (currentMode === 'sticker') {
        const stickers = ["⭐", "💖", "🍓", "🦈", "👾", "🩹", "🐱"];
        const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];
        ctx.font = `${sizePicker.value * 4}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(randomSticker, coords.x, coords.y);
        currentMode = 'draw';
    }
}

// Événements pour dessiner
canvas.addEventListener('mousedown', (e) => {
    if (currentMode !== 'draw') {
        handleCanvasClick(e);
        return;
    }
    isDrawing = true;
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = sizePicker.value;
    ctx.lineCap = 'square';
    
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || currentMode !== 'draw') return;
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
});

canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

// Support Mobile (Tactile)
canvas.addEventListener('touchstart', (e) => {
    if (currentMode !== 'draw') {
        handleCanvasClick(e);
        return;
    }
    isDrawing = true;
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = sizePicker.value;
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
});
canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing || currentMode !== 'draw') return;
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
});
canvas.addEventListener('touchend', () => isDrawing = false);

// Clear
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Envoi vers Discord par Webhook avec fond blanc forcé
sendDiscordBtn.addEventListener('click', () => {
    if (DISCORD_WEBHOOK_URL === 'TON_URL_WEBHOOK_ICI') {
        alert("Oops! You need to configure your Discord Webhook URL in script.js first.");
        return;
    }

    sendDiscordBtn.innerText = "Sending... ⌛";
    sendDiscordBtn.disabled = true;

    // 1. Créer un canvas temporaire pour fusionner le dessin sur un fond blanc
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // 2. Remplir le fond en blanc
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 3. Dessiner l'œuvre de l'utilisateur par-dessus le fond blanc
    tempCtx.drawImage(canvas, 0, 0);

    // 4. Convertir et envoyer ce canvas temporaire
    tempCanvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'fanart.png');
        formData.append('payload_json', JSON.stringify({
            content: "🎨 **New drawing received from your strawpage!**"
        }));

        fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                alert("Drawing successfully sent to Discord! 🎉");
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Efface le canvas principal après envoi
            } else {
                alert("Failed to send drawing. Check your Webhook link.");
            }
        })
        .catch(err => {
            console.error(err);
            alert("An error occurred while sending.");
        })
        .finally(() => {
            sendDiscordBtn.innerText = "Send to Discord! 🚀";
            sendDiscordBtn.disabled = false;
        });
    }, 'image/png');
});



