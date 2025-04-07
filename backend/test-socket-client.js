import io from 'socket.io-client'

const socket = io('http://localhost:5000', {
  transports: ['websocket'], // Force WebSocket, skip polling
  query: {
    sessionId: '628ed0a2dbd782a42a87f1bf8e89cde16026a5f01562a9d2728d8ce284a8c3e9'
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