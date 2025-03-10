let ws = null;
let currentRole = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // 1 second

const handlers = new Map();

export const initializeWebSocket = (role) => {
  if (ws) {
    console.log('WebSocket already initialized, disconnecting first...');
    disconnectWebSocket();
  }

  currentRole = role;
  connectWebSocket();
};

const connectWebSocket = () => {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host
      : 'localhost:3000';
    const wsUrl = `${protocol}//${host}/api/websocket`;

    console.log('Connecting to WebSocket at:', wsUrl);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Successfully connected to WebSocket');
      reconnectAttempts = 0;
      sendMessage('clientConnected', { role: currentRole });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);

        if (handlers.has(message.type)) {
          handlers.get(message.type).forEach(handler => handler(message.data));
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      if (!event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(connectWebSocket, RECONNECT_DELAY * reconnectAttempts);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Don't attempt to reconnect here, let onclose handle it
    };
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(connectWebSocket, RECONNECT_DELAY * reconnectAttempts);
    }
  }
};

export const sendMessage = (type, data) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not initialized or not connected');
    return;
  }

  try {
    ws.send(JSON.stringify({ type, data }));
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

export const addMessageHandler = (type, handler) => {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());
  }
  handlers.get(type).add(handler);
};

export const removeMessageHandler = (type, handler) => {
  if (handlers.has(type)) {
    handlers.get(type).delete(handler);
  }
};

export const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
    currentRole = null;
    handlers.clear();
  }
}; 