const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

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

// Get game state
app.get('/api/state', (req, res) => {
  res.json(gameState);
});

// Connect client
app.post('/api/connect/:role', (req, res) => {
  const { role } = req.params;
  if (gameState.players[role]) {
    gameState.players[role].connected = true;
    res.json({ success: true, gameState });
  } else {
    res.status(400).json({ error: 'Invalid role' });
  }
});

// Disconnect client
app.post('/api/disconnect/:role', (req, res) => {
  const { role } = req.params;
  if (gameState.players[role]) {
    gameState.players[role].connected = false;
    gameState.isActive = false;
    gameState.winner = null;
    res.json({ success: true, gameState });
  } else {
    res.status(400).json({ error: 'Invalid role' });
  }
});

// Toggle active state
app.post('/api/toggle', (req, res) => {
  gameState.isActive = !gameState.isActive;
  gameState.winner = null;
  res.json(gameState);
});

// Handle buzz
app.post('/api/buzz/:player', (req, res) => {
  const { player } = req.params;
  
  if (!gameState.isActive) {
    res.status(400).json({ error: 'Buzzer not active' });
    return;
  }
  
  if (!gameState.winner) {
    gameState.winner = player;
    res.json(gameState);
  } else {
    res.status(400).json({ error: 'Someone already buzzed' });
  }
});

// Reset game
app.post('/api/reset', (req, res) => {
  gameState.isActive = false;
  gameState.winner = null;
  res.json(gameState);
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 