const express = require('express');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Use environment variables for ports
const PORT = process.env.PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

const gameState = {
  isActive: false,
  winner: null,
  players: {
    admin: { connected: false },
    player1: { connected: false, name: 'Player 1' },
    player2: { connected: false, name: 'Player 2' }
  }
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Find and remove disconnected client
    Object.keys(gameState.players).forEach(role => {
      if (gameState.players[role].ws === ws) {
        gameState.players[role].connected = false;
        gameState.players[role].ws = null;
      }
    });
    broadcastGameState();
  });
});

function handleWebSocketMessage(ws, message) {
  switch (message.type) {
    case 'clientConnected':
      const { role } = message.data;
      if (gameState.players[role]) {
        gameState.players[role].connected = true;
        gameState.players[role].ws = ws;
        broadcastGameState();
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid role' }
        }));
      }
      break;

    case 'toggleActive':
      if (ws === gameState.players.admin.ws) {
        gameState.isActive = message.data.value;
        gameState.winner = null;
        gameState.message = '';
        gameState.isError = false;
        broadcastGameState();
      }
      break;

    case 'buzz':
      const playerRole = Object.keys(gameState.players).find(role => 
        gameState.players[role].ws === ws
      );
      
      if (!gameState.isActive) {
        // Set false start message
        gameState.message = `❌ FALSE START by ${playerRole}!`;
        gameState.isError = true;
        gameState.winner = null;
        
        // Broadcast to all clients immediately
        broadcastGameState();
        
        // Send specific message to the player who false started
        ws.send(JSON.stringify({
          type: 'gameState',
          data: {
            ...gameState,
            message: `❌ FALSE START! You buzzed too early!`,
            isError: true
          }
        }));
      } else if (!gameState.winner) {
        gameState.winner = playerRole;
        gameState.message = `🎉 ${playerRole} buzzed in first!`;
        gameState.isError = false;
        broadcastGameState();
      }
      break;

    case 'reset':
      if (ws === gameState.players.admin.ws) {
        gameState.isActive = false;
        gameState.winner = null;
        gameState.message = '';
        gameState.isError = false;
        broadcastGameState();
      }
      break;
  }
}

function broadcastGameState() {
  const message = JSON.stringify({
    type: 'gameState',
    data: {
      ...gameState,
      message: gameState.message || '',
      isError: gameState.isError || false
    }
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Update the server listen call
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend will be served on port ${FRONTEND_PORT}`);
}); 