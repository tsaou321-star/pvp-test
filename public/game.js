const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerCountEl = document.getElementById('playerCount');

let players = {};
let myId = null;

const speed = 5;
const playerSize = 32;

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Listen to key events
window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

socket.on('connect', () => {
    myId = socket.id;
});

socket.on('currentPlayers', (serverPlayers) => {
    players = serverPlayers;
    updatePlayerCount();
    // Start game loop if not already running
    if (!gameLoopId) {
        gameLoop();
    }
});

socket.on('newPlayer', (newPlayerInfo) => {
    players[newPlayerInfo.id] = newPlayerInfo;
    updatePlayerCount();
});

socket.on('playerMoved', (movedPlayer) => {
    if (players[movedPlayer.id]) {
        players[movedPlayer.id].x = movedPlayer.x;
        players[movedPlayer.id].y = movedPlayer.y;
    }
});

socket.on('playerDisconnected', (id) => {
    delete players[id];
    updatePlayerCount();
});

function updatePlayerCount() {
    if (playerCountEl) {
        playerCountEl.textContent = Object.keys(players).length;
    }
}

let gameLoopId = null;
function gameLoop() {
    updateMyPosition();
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function updateMyPosition() {
    if (!myId || !players[myId]) return;

    let moved = false;
    let newX = players[myId].x;
    let newY = players[myId].y;

    if (keys.w || keys.ArrowUp) {
        newY -= speed;
        moved = true;
    }
    if (keys.s || keys.ArrowDown) {
        newY += speed;
        moved = true;
    }
    if (keys.a || keys.ArrowLeft) {
        newX -= speed;
        moved = true;
    }
    if (keys.d || keys.ArrowRight) {
        newX += speed;
        moved = true;
    }

    // Keep player within boundary
    newX = Math.max(0, Math.min(canvas.width - playerSize, newX));
    newY = Math.max(0, Math.min(canvas.height - playerSize, newY));

    if (moved) {
        players[myId].x = newX;
        players[myId].y = newY;
        socket.emit('playerMovement', { x: newX, y: newY });
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw players
    for (let id in players) {
        const p = players[id];
        ctx.fillStyle = p.color;
        
        // Dynamic neon glowing border/shadow
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        
        drawRoundedRect(ctx, p.x, p.y, playerSize, playerSize, 8);
        ctx.fill();

        // Local player identifier
        if (id === myId) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Text above local player
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('YOU', p.x + playerSize / 2, p.y - 10);
        } else {
            // Text above remote player
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#a0aec0';
            ctx.font = '10px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PLAYER', p.x + playerSize / 2, p.y - 10);
        }
    }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}
