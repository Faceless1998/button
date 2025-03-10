const Pusher = require('pusher');
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
    const { socket_id, channel_name, role } = req.body;
    console.log('Authenticating socket:', socket_id, 'for role:', role);

    // Check if role is available and not exceeding max connections
    if (!isRoleAvailable(role) || getConnectedCount() >= 3) {
      console.log('Role not available or max connections reached');
      return res.status(403).json({ 
        message: 'Role not available or maximum connections reached' 
      });
    }

    // Assign role to client
    if (!assignRole(role, socket_id)) {
      console.log('Failed to assign role');
      return res.status(403).json({ 
        message: 'Failed to assign role' 
      });
    }

    // Authenticate with Pusher
    const auth = pusher.authenticate(socket_id, channel_name);
    console.log('Authentication successful for role:', role);

    // Send current game state
    const gameState = getGameState();
    
    res.status(200).json({
      ...auth,
      gameState
    });
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(500).json({ 
      message: 'Error authenticating with Pusher', 
      error: error.message 
    });
  }
} 