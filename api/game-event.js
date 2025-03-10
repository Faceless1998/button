import Pusher from 'pusher';
import cors from 'cors';

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

const pusher = new Pusher({
  appId: "1955089",
  key: "854ee9c076bcdcb6ff9a",
  secret: "70f13c3b8e26efecfce9",
  cluster: "ap2",
  useTLS: true
});

// Initialize CORS middleware
const corsMiddleware = cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
});

export default async function handler(req, res) {
  // Run CORS middleware
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { type, data, socketId } = req.body;

    try {
      // Update game state based on event type
      switch (type) {
        case 'clientConnected':
          if (data.role) {
            gameState.connectedClients[data.role] = socketId;
          }
          break;
        case 'disconnect':
          Object.keys(gameState.connectedClients).forEach(role => {
            if (gameState.connectedClients[role] === socketId) {
              gameState.connectedClients[role] = null;
            }
          });
          break;
        case 'toggleActive':
          gameState.isActive = data.value;
          gameState.canBuzz = true;
          gameState.winner = null;
          gameState.message = '';
          break;
        case 'buzz':
          if (!gameState.canBuzz) return;
          if (!gameState.isActive) {
            gameState.message = `False Start by ${data.playerName}!`;
            gameState.isError = true;
          } else if (!gameState.winner) {
            gameState.winner = data.playerName;
            gameState.message = `${data.playerName} buzzed in first!`;
            gameState.isError = false;
            gameState.canBuzz = false;
          }
          break;
        case 'updateName':
          const nameKey = `player${data.playerNumber}Name`;
          if (nameKey in gameState) {
            gameState[nameKey] = data.name;
          }
          break;
        case 'reset':
          gameState.winner = null;
          gameState.message = '';
          gameState.isError = false;
          gameState.canBuzz = true;
          break;
      }

      // Broadcast updated state to all clients
      await pusher.trigger('game-channel', 'game-event', {
        type: 'gameState',
        data: gameState
      }, {
        socket_id: socketId
      });

      res.status(200).json({
        message: 'Event processed successfully',
        gameState
      });
    } catch (error) {
      console.error('Error processing game event:', error);
      res.status(500).json({ error: 'Failed to process game event' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 