import Pusher from 'pusher';
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

export default async function handler(req, res) {
  const origin = req.headers.origin;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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