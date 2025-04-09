import io from 'socket.io-client'

const socket = io('http://localhost:5000', {
  transports: ['websocket'], // Force WebSocket, skip polling
  query: {
    sessionId: '6c22c20fe448750f0d93f54a5bfec175821ac41102161d859cc18b938b42bf86'
  }
});

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('join-room', { roomId: 'testRoom' });
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection Error:', error);
});