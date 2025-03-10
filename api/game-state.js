// Game state management
let gameState = {
  connectedClients: {
    admin: null,
    player1: null,
    player2: null
  },
  isActive: false,
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  canBuzz: true,
  winner: null,
  message: '',
  isError: false
};

// Check if role is available
const isRoleAvailable = (role) => {
  return gameState.connectedClients[role] === null;
};

// Count connected clients
const getConnectedCount = () => {
  return Object.values(gameState.connectedClients).filter(client => client !== null).length;
};

// Assign role to client
const assignRole = (role, socketId) => {
  if (getConnectedCount() >= 3) {
    return false;
  }
  gameState.connectedClients[role] = socketId;
  return true;
};

// Remove client from role
const removeClient = (socketId) => {
  Object.keys(gameState.connectedClients).forEach(role => {
    if (gameState.connectedClients[role] === socketId) {
      gameState.connectedClients[role] = null;
    }
  });
};

// Get current game state
const getGameState = () => {
  return { ...gameState };
};

// Update game state
const updateGameState = (updates) => {
  gameState = { ...gameState, ...updates };
};

module.exports = {
  gameState,
  isRoleAvailable,
  getConnectedCount,
  assignRole,
  removeClient,
  getGameState,
  updateGameState
}; 