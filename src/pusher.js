import Pusher from 'pusher-js';

let pusher = null;
let gameChannel = null;

export const initializePusher = (role) => {
  // Initialize Pusher with the correct configuration
  pusher = new Pusher('854ee9c076bcdcb6ff9a', {
    cluster: 'ap2',
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: 'https://rsr-xi.vercel.app/api/pusher-auth',
    auth: {
      params: { role }
    }
  });

  // Add connection status logging
  pusher.connection.bind('connected', () => {
    console.log('Successfully connected to Pusher');
  });

  pusher.connection.bind('error', (err) => {
    console.error('Failed to connect to Pusher:', err);
  });

  // Subscribe to game channel
  gameChannel = pusher.subscribe('game-channel');

  // Add channel subscription logging
  gameChannel.bind('pusher:subscription_succeeded', () => {
    console.log('Successfully subscribed to game-channel');
  });

  gameChannel.bind('pusher:subscription_error', (error) => {
    console.error('Failed to subscribe to game-channel:', error);
  });

  return gameChannel;
};

export const sendGameEvent = (eventType, data) => {
  if (!pusher || !pusher.connection.state === 'connected') {
    console.error('Pusher not initialized or not connected');
    return;
  }

  const socketId = pusher.connection.socket_id;
  
  fetch('https://rsr-xi.vercel.app/api/game-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: eventType,
      data,
      socketId
    }),
  }).catch(error => {
    console.error('Error sending game event:', error);
  });
};

export const disconnectPusher = () => {
  if (pusher) {
    sendGameEvent('disconnect', {});
    pusher.unsubscribe('game-channel');
    pusher.disconnect();
    pusher = null;
    gameChannel = null;
  }
};

export { gameChannel }; 