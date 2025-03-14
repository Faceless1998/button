import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const Container = styled.div`
  max-width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 40px 20px;
  text-align: center;
  background: linear-gradient(-45deg, #0a192f, #112240, #1a365d, #2d3748);
  background-size: 400% 400%;
  animation: ${gradientAnimation} 15s ease infinite;
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-x: hidden;
`;

const Title = styled.h1`
  font-size: 4rem;
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 4px;
  background: linear-gradient(to right, #ff6b6b, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  animation: ${floatAnimation} 3s ease-in-out infinite;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const PlayerCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 30px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  width: 350px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.4s ease;
  margin: 0 auto;

  &:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 15px 45px 0 rgba(31, 38, 135, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

const BuzzerButton = styled.button`
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isActive 
    ? 'radial-gradient(circle at 30% 30%, #ff6b6b, #e94560)'
    : 'radial-gradient(circle at 30% 30%, #4a4a4a, #8b0000)'};
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3),
              inset 0 -5px 15px rgba(0, 0, 0, 0.3),
              inset 0 5px 15px rgba(255, 255, 255, 0.2);
  margin: 20px 0;
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 60%);
    transform: scale(0);
    transition: transform 0.6s ease-out;
  }
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4),
                inset 0 -5px 15px rgba(0, 0, 0, 0.3),
                inset 0 5px 15px rgba(255, 255, 255, 0.2);
    
    &:before {
      transform: scale(1) rotate(45deg);
    }
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  animation: ${props => props.isActive ? pulseAnimation : 'none'} 2s infinite;
`;

const BuzzerText = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
`;

const NameInput = styled.input`
  padding: 15px;
  font-size: 1.2rem;
  background: rgba(255, 255, 255, 0.07);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  margin-bottom: 25px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:focus {
    outline: none;
    border-color: #e94560;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 20px rgba(233, 69, 96, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const Message = styled.div`
  margin: 30px auto;
  font-size: 1.6rem;
  font-weight: 500;
  padding: 20px;
  border-radius: 15px;
  background: ${props => props.isError 
    ? 'rgba(255, 0, 0, 0.2)' 
    : 'rgba(0, 255, 0, 0.15)'};
  color: ${props => props.isError ? '#ff6b6b' : '#4ade80'};
  backdrop-filter: blur(10px);
  transition: all 0.4s ease;
  max-width: 800px;
  border: 1px solid ${props => props.isError ? 'rgba(255, 107, 107, 0.3)' : 'rgba(74, 222, 128, 0.3)'};
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
  transform: translateY(${props => props.show ? '0' : '-20px'});
  opacity: ${props => props.show ? '1' : '0'};
  animation: ${props => props.isError ? 'shake 0.5s ease-in-out' : 'none'};

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
`;

const AdminControls = styled.div`
  margin: 40px auto;
  padding: 40px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 25px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  max-width: 800px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const AdminTitle = styled.h2`
  color: #e94560;
  font-size: 2.2rem;
  margin-bottom: 25px;
  text-transform: uppercase;
  letter-spacing: 3px;
  background: linear-gradient(to right, #ff6b6b, #e94560);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const Button = styled.button`
  padding: 15px 30px;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  background: ${props => props.primary 
    ? 'linear-gradient(135deg, #e94560, #ff6b6b)' 
    : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: 0.5s;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);

    &:before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const DeviceSelection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
`;

const DeviceButton = styled(Button)`
  width: 300px;
  height: 80px;
  font-size: 1.4rem;
  margin: 10px;
  background: ${props => props.selected 
    ? 'linear-gradient(135deg, #e94560, #ff6b6b)' 
    : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.selected 
    ? 'rgba(255, 255, 255, 0.3)' 
    : 'rgba(255, 255, 255, 0.1)'};
`;

const ConnectionStatus = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 20px;
  background: ${({ $isConnected }) => $isConnected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)'};
  color: ${({ $isConnected }) => $isConnected ? '#4ade80' : '#ff6b6b'};
  backdrop-filter: blur(5px);
  font-size: 0.9rem;
  z-index: 1000;
`;

const WaitingScreen = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const LoadingDots = keyframes`
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
`;

const WaitingText = styled.h2`
  color: white;
  font-size: 2rem;
  margin-bottom: 1rem;
  
  &:after {
    content: '';
    animation: ${LoadingDots} 1.5s infinite;
  }
`;

const Status = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 20px;
  background: ${props => props.connected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)'};
  color: ${props => props.connected ? '#4ade80' : '#ff6b6b'};
  backdrop-filter: blur(5px);
  font-size: 0.9rem;
  z-index: 1000;
`;

const Controls = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
  justify-content: center;
`;

const PlayerView = ({ playerNumber, playerName, setPlayerName, isActive, canBuzz, onBuzz }) => (
  <Container>
    <Title>Player {playerNumber}</Title>
    <PlayerCard style={{ margin: '40px auto' }}>
      <NameInput
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder={`Enter Player ${playerNumber} Name`}
      />
      <BuzzerButton
        isActive={true}
        onClick={() => onBuzz(playerName)}
        disabled={false}
      >
        <BuzzerText>{playerName}'s Buzzer</BuzzerText>
      </BuzzerButton>
    </PlayerCard>
  </Container>
);

const AdminView = ({ isActive, toggleActive, resetGame, message, isError, showMessage }) => (
  <Container>
    <Title>Game Controller</Title>
    <AdminControls>
      <AdminTitle>Admin Controls</AdminTitle>
      <Button primary onClick={toggleActive}>
        {isActive ? '🔴 Deactivate Buzzers' : '🟢 Activate Buzzers'}
      </Button>
      <Button onClick={resetGame}>
        🔄 Reset Game
      </Button>
    </AdminControls>
    {message && <Message isError={isError} show={showMessage}>{message}</Message>}
  </Container>
);

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://button-five-brown.vercel.app/api'  // Replace with your Vercel URL
  : 'http://localhost:3001/api';

function App() {
  const [role, setRole] = useState(null);
  const [gameState, setGameState] = useState({
    isActive: false,
    winner: null,
    message: '',
    isError: false,
    players: {
      admin: { connected: false },
      player1: { connected: false },
      player2: { connected: false }
    }
  });
  const [showMessage, setShowMessage] = useState(true);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.NODE_ENV === 'production'
        ? `wss://${window.location.host}/api/websocket`
        : 'ws://localhost:3001/api/websocket';

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected');
        if (role) {
          socket.send(JSON.stringify({
            type: 'clientConnected',
            data: { role }
          }));
        }
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'gameState') {
          setGameState(message.data);
          setShowMessage(true);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setTimeout(connectWebSocket, 1000);
      };

      setWs(socket);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [role]);

  const handleBuzz = async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'buzz',
        data: { playerName: role }
      }));
    }
  };

  const handleToggle = async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'toggleActive',
        data: { value: !gameState.isActive }
      }));
    }
  };

  const handleReset = async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'reset'
      }));
    }
  };

  if (!role) {
    return (
      <Container>
        <Title>Select Your Role</Title>
        <DeviceSelection>
          <DeviceButton 
            onClick={() => setRole('admin')}
            disabled={gameState.players.admin.connected}
          >
            🎮 Game Controller
          </DeviceButton>
          <DeviceButton 
            onClick={() => setRole('player1')}
            disabled={gameState.players.player1.connected}
          >
            🎯 Player 1 Device
          </DeviceButton>
          <DeviceButton 
            onClick={() => setRole('player2')}
            disabled={gameState.players.player2.connected}
          >
            🎯 Player 2 Device
          </DeviceButton>
        </DeviceSelection>
      </Container>
    );
  }

  const isConnected = gameState.players[role]?.connected;
  const allConnected = Object.values(gameState.players).every(p => p.connected);

  return (
    <Container>
      <Status connected={isConnected}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </Status>

      {role === 'admin' ? (
        <>
          <Title>Game Control</Title>
          <AdminControls>
            <AdminTitle>Admin Controls</AdminTitle>
            <Button primary onClick={handleToggle} disabled={!allConnected}>
              {gameState.isActive ? '🔴 Stop Game' : '🟢 Start Game'}
            </Button>
            <Button onClick={handleReset}>
              🔄 Reset Game
            </Button>
          </AdminControls>
        </>
      ) : (
        <>
          <Title>Player {role === 'player1' ? '1' : '2'}</Title>
          <PlayerCard>
            <BuzzerButton
              isActive={true}
              onClick={handleBuzz}
              disabled={false}
            >
              <BuzzerText>BUZZ!</BuzzerText>
            </BuzzerButton>
          </PlayerCard>
        </>
      )}

      {gameState.message && (
        <Message 
          isError={gameState.isError} 
          show={showMessage}
        >
          {gameState.message}
        </Message>
      )}

      <Message show={showMessage}>
        {!allConnected ? 'Waiting for all players...' : 
         !gameState.isActive ? 'Game not started - Buzzing will result in false start!' :
         gameState.winner ? 'Game Over!' : 'Game Active!'}
      </Message>
    </Container>
  );
}

export default App; 