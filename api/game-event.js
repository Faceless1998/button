import Pusher from 'pusher';
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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  if (req.method === 'POST') {
    const { type, data, socketId } = req.body;

    try {
      await pusher.trigger('game-channel', 'game-event', {
        type,
        data
      }, {
        socket_id: socketId
      });

      res.status(200).json({ message: 'Event sent successfully' });
    } catch (error) {
      console.error('Error sending game event:', error);
      res.status(500).json({ error: 'Failed to send game event' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 