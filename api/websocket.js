import { Server } from 'ws';

let wss = null;
const clients = new Map();

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

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Handle WebSocket upgrade
    if (req.headers.upgrade === 'websocket') {
      if (!wss) {
        // Initialize WebSocket server
        wss = new Server({ noServer: true });
        
        wss.on('connection', (ws, request) => {
          const id = Math.random().toString(36).substring(7);
          clients.set(ws, { id, role: null });

          ws.on('message', (message) => {
            try {
              const data = JSON.parse(message);
              handleMessage(ws, data);
            } catch (error) {
              console.error('Error handling message:', error);
            }
          });

          ws.on('close', () => {
            const client = clients.get(ws);
            if (client && client.role) {
              gameState.connectedClients[client.role] = null;
              broadcastGameState();
            }
            clients.delete(ws);
          });

          // Send initial game state
          ws.send(JSON.stringify({
            type: 'gameState',
            data: gameState
          }));
        });
      }

      // Handle the WebSocket upgrade
      const { socket, head } = res.socket.server;
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      res.status(426).json({ error: 'Upgrade Required' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function handleMessage(ws, message) {
  const client = clients.get(ws);
  if (!client) return;

  switch (message.type) {
    case 'clientConnected':
      const { role } = message.data;
      if (isRoleAvailable(role)) {
        client.role = role;
        gameState.connectedClients[role] = client.id;
        broadcastGameState();
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Role not available' }
        }));
      }
      break;

    case 'toggleActive':
      if (client.role === 'admin') {
        gameState.isActive = message.data.value;
        gameState.canBuzz = true;
        gameState.winner = null;
        gameState.message = '';
        broadcastGameState();
      }
      break;

    case 'buzz':
      if (!gameState.canBuzz) return;
      if (!gameState.isActive) {
        gameState.message = `False Start by ${message.data.playerName}!`;
        gameState.isError = true;
      } else if (!gameState.winner) {
        gameState.winner = message.data.playerName;
        gameState.message = `${message.data.playerName} buzzed in first!`;
        gameState.isError = false;
        gameState.canBuzz = false;
      }
      broadcastGameState();
      break;

    case 'updateName':
      const nameKey = `player${message.data.playerNumber}Name`;
      if (nameKey in gameState) {
        gameState[nameKey] = message.data.name;
        broadcastGameState();
      }
      break;

    case 'reset':
      if (client.role === 'admin') {
        gameState.winner = null;
        gameState.message = '';
        gameState.isError = false;
        gameState.canBuzz = true;
        broadcastGameState();
      }
      break;
  }
}

function broadcastGameState() {
  const message = JSON.stringify({
    type: 'gameState',
    data: gameState
  });

  for (const client of clients.keys()) {
    client.send(message);
  }
}

function isRoleAvailable(role) {
  if (!['admin', 'player1', 'player2'].includes(role)) {
    return false;
  }
  return !gameState.connectedClients[role];
} 