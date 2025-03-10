// In-memory game state
const gameState = {
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
export const isRoleAvailable = (role) => {
  if (!['admin', 'player1', 'player2'].includes(role)) {
    return false;
  }
  return !gameState.connectedClients[role];
};

// Get count of connected clients
export const getConnectedCount = () => {
  return Object.values(gameState.connectedClients).filter(Boolean).length;
};

// Assign role to a client
export const assignRole = (role, socketId) => {
  if (isRoleAvailable(role)) {
    gameState.connectedClients[role] = socketId;
    return true;
  }
  return false;
};

// Remove client when they disconnect
export const removeClient = (socketId) => {
  const roles = Object.keys(gameState.connectedClients);
  for (const role of roles) {
    if (gameState.connectedClients[role] === socketId) {
      gameState.connectedClients[role] = null;
    }
  }
};

// Get current game state
export const getGameState = () => {
  return { ...gameState };
};

// Update game state
export const updateGameState = (updates) => {
  Object.assign(gameState, updates);
  return { ...gameState };
}; 