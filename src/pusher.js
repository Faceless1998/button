import Pusher from 'pusher-js';

let pusher = null;
let gameChannel = null;

export const initializePusher = (role) => {
  if (pusher) {
    console.log('Pusher already initialized, disconnecting first...');
    disconnectPusher();
  }

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
    // Resubscribe to channel on reconnection
    if (!gameChannel) {
      subscribeToGameChannel();
    }
  });

  pusher.connection.bind('error', (err) => {
    console.error('Failed to connect to Pusher:', err);
  });

  // Initial subscription
  subscribeToGameChannel();

  return gameChannel;
};

const subscribeToGameChannel = () => {
  // Subscribe to game channel
  gameChannel = pusher.subscribe('game-channel');

  // Add channel subscription logging
  gameChannel.bind('pusher:subscription_succeeded', () => {
    console.log('Successfully subscribed to game-channel');
    // Send initial connection event
    sendGameEvent('clientConnected', {});
  });

  gameChannel.bind('pusher:subscription_error', (error) => {
    console.error('Failed to subscribe to game-channel:', error);
  });
};

export const sendGameEvent = (eventType, data) => {
  if (!pusher || pusher.connection.state !== 'connected') {
    console.error('Pusher not initialized or not connected. Current state:', pusher?.connection?.state);
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
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Game event sent successfully:', eventType, data);
  })
  .catch(error => {
    console.error('Error sending game event:', error);
  });
};

export const disconnectPusher = () => {
  if (pusher) {
    try {
      if (pusher.connection.state === 'connected') {
        sendGameEvent('disconnect', {});
      }
      if (gameChannel) {
        gameChannel.unbind_all();
        pusher.unsubscribe('game-channel');
      }
      pusher.disconnect();
    } catch (error) {
      console.error('Error during disconnect:', error);
    } finally {
      pusher = null;
      gameChannel = null;
    }
  }
};

export { gameChannel }; 