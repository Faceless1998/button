// In-memory game state
let gameState = {
  isActive: false,
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  message: '',
  isError: false,
  winner: null,
  canBuzz: true,
  connectedClients: {
    admin: null,
    player1: null,
    player2: null
  }
};

// Check if a role is available
const isRoleAvailable = (role) => {
  if (!['admin', 'player1', 'player2'].includes(role)) {
    return false;
  }
  return !gameState.connectedClients[role];
};

// Get count of connected clients
const getConnectedCount = () => {
  return Object.values(gameState.connectedClients).filter(Boolean).length;
};

// Assign role to a client
const assignRole = (role, socketId) => {
  if (isRoleAvailable(role)) {
    gameState.connectedClients[role] = socketId;
    return true;
  }
  return false;
};

// Remove client when they disconnect
const removeClient = (socketId) => {
  const roles = Object.keys(gameState.connectedClients);
  for (const role of roles) {
    if (gameState.connectedClients[role] === socketId) {
      gameState.connectedClients[role] = null;
    }
  }
};

// Get current game state
const getGameState = () => {
  return { ...gameState };
};

// Update game state
const updateGameState = (updates) => {
  gameState = {
    ...gameState,
    ...updates
  };
  return gameState;
};

module.exports = {
  isRoleAvailable,
  getConnectedCount,
  assignRole,
  removeClient,
  getGameState,
  updateGameState
}; 