const express = require('express');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Use environment variables for ports
const PORT = process.env.PORT || 3002;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

const gameState = {
  isActive: false,
  currentPlayer: null,
  players: new Map(),
  timer: {
    isRunning: false,
    timeLeft: 0,
    type: null // 'initial' or 'second_chance'
  },
  message: ''
};

let timerInterval = null;

function startTimer(duration, type) {
  clearInterval(timerInterval);
  gameState.timer.isRunning = true;
  gameState.timer.timeLeft = duration;
  gameState.timer.type = type;

  timerInterval = setInterval(() => {
    gameState.timer.timeLeft--;
    if (gameState.timer.timeLeft <= 0) {
      clearInterval(timerInterval);
      gameState.timer.isRunning = false;
      gameState.timer.type = null;
      
      // Reset game state when timer expires
      if (gameState.currentPlayer) {
        const player = gameState.players.get(gameState.currentPlayer);
        if (player) {
          player.buzzed = false;
          gameState.currentPlayer = null;
          gameState.message = "Time's up!";
          gameState.isActive = false;
        }
      }
      broadcastGameState();
    } else {
      broadcastGameState();
    }
  }, 1000);
}

function broadcastGameState() {
  const stateToSend = {
    ...gameState,
    players: Array.from(gameState.players.entries())
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'gameState',
        data: stateToSend
      }));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  let clientRole = null;
  let clientId = null;

  ws.send(JSON.stringify({
    type: 'gameState',
    data: {
      ...gameState,
      players: Array.from(gameState.players.entries())
    }
  }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'join':
        clientRole = data.role;
        clientId = data.id;
        if (clientRole === 'player') {
          gameState.players.set(clientId, {
            name: `Player ${clientId}`,
            buzzed: false,
            canBuzz: true
          });
          broadcastGameState();
        }
        break;

      case 'buzz':
        if (clientRole === 'player' && 
            gameState.isActive && 
            !gameState.currentPlayer && 
            gameState.players.get(clientId).canBuzz) {
          const player = gameState.players.get(clientId);
          if (player && !player.buzzed) {
            player.buzzed = true;
            gameState.currentPlayer = clientId;
            gameState.message = `${player.name} buzzed in!`;
            startTimer(60, 'initial'); // Start 1-minute timer
            broadcastGameState();
          }
        }
        break;

      case 'answer_right':
        if (clientRole === 'admin' && gameState.currentPlayer) {
          clearInterval(timerInterval);
          gameState.isActive = false;
          gameState.timer.isRunning = false;
          gameState.message = `${gameState.players.get(gameState.currentPlayer).name} answered correctly!`;
          gameState.currentPlayer = null;
          gameState.players.forEach(player => {
            player.buzzed = false;
            player.canBuzz = true;
          });
          broadcastGameState();
        }
        break;

      case 'answer_wrong':
        if (clientRole === 'admin' && gameState.currentPlayer) {
          const wrongPlayer = gameState.players.get(gameState.currentPlayer);
          wrongPlayer.buzzed = false;
          wrongPlayer.canBuzz = false; // Prevent this player from buzzing again
          gameState.currentPlayer = null;
          gameState.message = `${wrongPlayer.name} answered incorrectly! Other players have 20 seconds!`;
          startTimer(20, 'second_chance'); // Start 20-second timer for other players
          broadcastGameState();
        }
        break;

      case 'start_game':
        if (clientRole === 'admin') {
          gameState.isActive = true;
          gameState.currentPlayer = null;
          gameState.message = 'Game started!';
          gameState.timer.isRunning = false;
          gameState.timer.timeLeft = 0;
          gameState.players.forEach(player => {
            player.buzzed = false;
            player.canBuzz = true;
          });
          broadcastGameState();
        }
        break;

      case 'reset_game':
        if (clientRole === 'admin') {
          clearInterval(timerInterval);
          gameState.isActive = false;
          gameState.currentPlayer = null;
          gameState.message = 'Game reset!';
          gameState.timer.isRunning = false;
          gameState.timer.timeLeft = 0;
          gameState.timer.type = null;
          gameState.players.forEach(player => {
            player.buzzed = false;
            player.canBuzz = true;
          });
          broadcastGameState();
        }
        break;

      case 'update_player_name':
        if (clientRole === 'player' && gameState.players.has(clientId)) {
          const player = gameState.players.get(clientId);
          player.name = data.name;
          broadcastGameState();
        }
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (clientRole === 'player' && clientId) {
      gameState.players.delete(clientId);
      if (gameState.currentPlayer === clientId) {
        clearInterval(timerInterval);
        gameState.currentPlayer = null;
        gameState.message = 'Player disconnected!';
        gameState.timer.isRunning = false;
        gameState.timer.timeLeft = 0;
      }
      broadcastGameState();
    }
  });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend will be served on port ${FRONTEND_PORT}`);
}); 