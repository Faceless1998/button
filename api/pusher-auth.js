import Pusher from 'pusher';
import cors from 'cors';
const { 
  isRoleAvailable, 
  getConnectedCount, 
  assignRole, 
  getGameState 
} = require('./game-state');

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

  // Handle authentication request
  if (req.method === 'POST') {
    const { socket_id, channel_name, role } = req.body;

    try {
      // Check if role is available
      if (!isRoleAvailable(role)) {
        return res.status(403).json({ 
          error: 'Role not available',
          gameState: getGameState()
        });
      }

      // Generate auth response
      const authResponse = pusher.authorizeChannel(socket_id, channel_name);
      
      // Assign role to client
      assignRole(role, socket_id);

      // Send auth response with game state
      res.status(200).json({
        ...authResponse,
        gameState: getGameState()
      });
    } catch (error) {
      console.error('Pusher auth error:', error);
      res.status(403).json({ 
        error: 'Unauthorized',
        gameState: getGameState()
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 