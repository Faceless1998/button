export const config = {
  runtime: 'edge',
};

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

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);

    const id = Math.random().toString(36).substring(7);
    clients.set(socket, { id, role: null });

    socket.onopen = () => {
      console.log('Client connected:', id);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(socket, message);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    socket.onclose = () => {
      const client = clients.get(socket);
      if (client?.role) {
        gameState.connectedClients[client.role] = null;
        broadcastGameState();
      }
      clients.delete(socket);
    };

    return response;
  } catch (err) {
    console.error('WebSocket upgrade failed:', err);
    return new Response('WebSocket upgrade failed', { status: 400 });
  }
}

function handleMessage(socket, message) {
  const client = clients.get(socket);
  if (!client) return;

  switch (message.type) {
    case 'clientConnected':
      const { role } = message.data;
      if (isRoleAvailable(role)) {
        client.role = role;
        gameState.connectedClients[role] = client.id;
        broadcastGameState();
      } else {
        socket.send(JSON.stringify({
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

  for (const [socket] of clients) {
    socket.send(message);
  }
}

function isRoleAvailable(role) {
  if (!['admin', 'player1', 'player2'].includes(role)) {
    return false;
  }
  return !gameState.connectedClients[role];
} 