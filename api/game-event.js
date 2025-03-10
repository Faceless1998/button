const Pusher = require('pusher');
const { 
  getGameState, 
  updateGameState, 
  removeClient 
} = require('./game-state');

const pusher = new Pusher({
  appId: "1955089",
  key: "854ee9c076bcdcb6ff9a",
  secret: "70f13c3b8e26efecfce9",
  cluster: "ap2",
  useTLS: true
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { type, data, socketId } = req.body;
    console.log('Processing game event:', type, data);

    // Get current game state
    const currentState = getGameState();

    // Handle different event types
    switch (type) {
      case 'toggleActive':
        if (currentState.connectedClients.admin === socketId) {
          updateGameState({
            isActive: data.value,
            canBuzz: true,
            winner: null,
            message: ''
          });
        }
        break;

      case 'buzz':
        if (!currentState.canBuzz) return;

        if (!currentState.isActive) {
          updateGameState({
            message: `False Start by ${data.playerName}!`,
            isError: true
          });
        } else if (!currentState.winner) {
          updateGameState({
            winner: data.playerName,
            message: `${data.playerName} buzzed in first!`,
            isError: false,
            canBuzz: false
          });
        }
        break;

      case 'updateName':
        if (currentState.connectedClients[`player${data.playerNumber}`] === socketId) {
          const nameKey = `player${data.playerNumber}Name`;
          updateGameState({ [nameKey]: data.name });
        }
        break;

      case 'reset':
        if (currentState.connectedClients.admin === socketId) {
          updateGameState({
            winner: null,
            message: '',
            isError: false,
            canBuzz: true
          });
        }
        break;

      case 'disconnect':
        removeClient(socketId);
        break;

      default:
        console.log('Unknown event type:', type);
    }

    // Get updated game state
    const updatedState = getGameState();
    
    // Broadcast updated state to all clients
    await pusher.trigger('game-channel', 'game-event', { 
      type: 'gameState', 
      data: updatedState 
    });
    
    console.log('Game event processed and broadcasted');
    res.status(200).json({ message: 'Event processed successfully' });
  } catch (error) {
    console.error('Error processing game event:', error);
    res.status(500).json({ 
      message: 'Error processing game event', 
      error: error.message 
    });
  }
} 