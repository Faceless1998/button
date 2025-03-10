import Pusher from 'pusher-js';

let pusher = null;
let gameChannel = null;
let currentRole = null;

const BACKEND_URL = 'https://button-five-brown.vercel.app';

export const initializePusher = (role) => {
  if (pusher) {
    console.log('Pusher already initialized, disconnecting first...');
    disconnectPusher();
  }

  // Store the role
  currentRole = role;

  // Initialize Pusher with the correct configuration
  pusher = new Pusher('854ee9c076bcdcb6ff9a', {
    cluster: 'ap2',
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${BACKEND_URL}/api/pusher-auth`,
    auth: {
      headers: {
        'Content-Type': 'application/json',
      },
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
  try {
    // Subscribe to game channel
    gameChannel = pusher.subscribe('game-channel');

    // Add channel subscription logging
    gameChannel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to game-channel');
      // Send initial connection event with retry logic
      sendGameEventWithRetry('clientConnected', { role: currentRole });
    });

    gameChannel.bind('pusher:subscription_error', (error) => {
      console.error('Failed to subscribe to game-channel:', error);
    });

    // Listen for game state updates
    gameChannel.bind('game-event', (event) => {
      if (event.type === 'gameState') {
        console.log('Received game state update:', event.data);
      }
    });
  } catch (error) {
    console.error('Error in subscribeToGameChannel:', error);
  }
};

const sendGameEventWithRetry = async (eventType, data, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sendGameEvent(eventType, data);
      return; // Success, exit the retry loop
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('All retry attempts failed for event:', eventType);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }
};

export const sendGameEvent = async (eventType, data) => {
  if (!pusher || pusher.connection.state !== 'connected') {
    console.error('Pusher not initialized or not connected. Current state:', pusher?.connection?.state);
    return;
  }

  const socketId = pusher.connection.socket_id;
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/game-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: eventType,
        data,
        socketId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Game event sent successfully:', eventType, responseData);
    return responseData;
  } catch (error) {
    console.error('Error sending game event:', error);
    throw error; // Re-throw for retry mechanism
  }
};

export const disconnectPusher = () => {
  if (pusher) {
    try {
      if (pusher.connection.state === 'connected') {
        sendGameEvent('disconnect', {}).catch(console.error);
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
      currentRole = null;
    }
  }
};

export { gameChannel }; 