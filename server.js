const express = require('express');
const path = require('path');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

const gameState = {
  isActive: false,
  winner: null,
  message: '',
  isError: false,
  players: {
    admin: { connected: false },
    player1: { connected: false },
    player2: { connected: false }
  }
};

wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.send(JSON.stringify({ type: 'gameState', data: gameState }));

  ws.on('message', (message) => {
    try {
      handleWebSocketMessage(ws, JSON.parse(message));
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    if (ws.role) {
      gameState.players[ws.role].connected = false;
      if (ws.role === 'admin') {
        gameState.isActive = false;
        gameState.winner = null;
        gameState.message = 'Game stopped - Admin disconnected';
        gameState.isError = true;
      }
      broadcastGameState();
    }
  });
});

function handleWebSocketMessage(ws, message) {
  switch (message.type) {
    case 'clientConnected':
      const { role } = message.data;
      if (gameState.players[role] && !gameState.players[role].connected) {
        ws.role = role;
        gameState.players[role].connected = true;
        gameState.message = '';
        gameState.isError = false;
        broadcastGameState();
      }
      break;

    case 'buzz':
      if (!gameState.isActive) {
        gameState.message = `False Start by ${message.data.playerName}!`;
        gameState.isError = true;
      } else if (!gameState.winner) {
        gameState.winner = message.data.playerName;
        gameState.message = `${message.data.playerName} buzzed in first!`;
        gameState.isError = false;
      }
      broadcastGameState();
      break;

    case 'toggleActive':
      gameState.isActive = message.data.value;
      gameState.winner = null;
      gameState.message = gameState.isActive ? 'Game Started!' : 'Game Stopped';
      gameState.isError = false;
      broadcastGameState();
      break;

    case 'reset':
      gameState.isActive = false;
      gameState.winner = null;
      gameState.message = 'Game Reset';
      gameState.isError = false;
      broadcastGameState();
      break;
  }
}

function broadcastGameState() {
  const message = JSON.stringify({ type: 'gameState', data: gameState });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
}

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflict with React dev server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 