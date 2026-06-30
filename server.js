const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Game state (in memory)
const players = {};
const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3', '#F333FF'];

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Assign a color and initial position
    const color = colors[Math.floor(Math.random() * colors.length)];
    players[socket.id] = {
        id: socket.id,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 400) + 50,
        color: color
    };

    // Every player joins the same room automatically
    socket.join('game-room');

    // Send the current list of players to the newly connected player
    socket.emit('currentPlayers', players);

    // Broadcast the new player info to everyone in the room
    socket.to('game-room').emit('newPlayer', players[socket.id]);

    // Handle movement updates sent from client
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            // Broadcast the update to other players in the room
            socket.to('game-room').emit('playerMoved', players[socket.id]);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.to('game-room').emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
