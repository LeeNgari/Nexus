import { io } from 'socket.io-client';
import axios from 'axios';

// Test configuration
const SERVER_URL = 'http://localhost:5000';
let authToken;
let testUserId;
let testRoomId = 'd78758ed-807c-457c-b80b-7372b7dc50bc'; // Replace with a real room ID from your DB
let testPrivateChatId = '18537de1-eb42-4516-a5c4-0a3c1a71386a'; // Replace with a real chat ID from your DB

// Helper function to authenticate and get session cookie
async function authenticate() {
    const response = await axios.post(`${SERVER_URL}/api/auth/login`, {
        email: 'leengari76@gmail.com', // Replace with test user credentials
        password: 'house@123'
    }, {
        withCredentials: true
    });

    return response.headers['set-cookie'];
}

describe('Socket.IO Server', () => {
    let socket;
    let authCookie;

    beforeAll(async () => {
        // Authenticate before running tests
        authCookie = await authenticate();
    });

    afterEach(() => {
        // Disconnect socket after each test
        if (socket?.connected) {
            socket.disconnect();
        }
    });

    test('should connect with valid authentication', (done) => {
        socket = io(SERVER_URL, {
            extraHeaders: {
                Cookie: authCookie.join('; ')
            },
            withCredentials: true
        });

        socket.on('connect', () => {
            expect(socket.connected).toBeTruthy();
            done();
        });

        socket.on('connect_error', (err) => {
            done.fail(`Connection failed: ${err.message}`);
        });
    });

    test('should reject connection without authentication', (done) => {
        const unauthenticatedSocket = io(SERVER_URL);

        unauthenticatedSocket.on('connect_error', (err) => {
            expect(err.message).toMatch(/Authentication error/);
            unauthenticatedSocket.disconnect();
            done();
        });
    });

    describe('Room Functionality', () => {
        beforeEach((done) => {
            socket = io(SERVER_URL, {
                extraHeaders: {
                    Cookie: authCookie.join('; ')
                },
                withCredentials: true
            });

            socket.on('connect', done);
        });

        test('should allow joining a room', (done) => {
            socket.emit('join-room', testRoomId);

            socket.on('room-joined', (data) => {
                expect(data.roomId).toBe(testRoomId);
                done();
            });

            socket.on('error', (err) => {
                done.fail(err.message);
            });
        });

        test('should receive messages in a room', (done) => {
            socket.emit('join-room', testRoomId);

            const testMessage = {
                roomId: testRoomId,
                content: 'Hello room!'
            };

            socket.on('room-joined', () => {
                socket.emit('new-message', testMessage);
            });

            socket.on('new-message', (message) => {
                expect(message.content).toBe(testMessage.content);
                expect(message.roomId).toBe(testRoomId);
                done();
            });
        });
    });

    describe('Private Messaging', () => {
        beforeEach((done) => {
            socket = io(SERVER_URL, {
                extraHeaders: {
                    Cookie: authCookie.join('; ')
                },
                withCredentials: true
            });

            socket.on('connect', done);
        });

        test('should send and receive private messages', (done) => {
            const testMessage = {
                privateChatId: testPrivateChatId,
                content: 'Hello private chat!'
            };

            socket.emit('new-message', testMessage);

            socket.on('message-sent', (message) => {
                expect(message.content).toBe(testMessage.content);

                // In a real test, you'd have another client connected to receive this
                // For now we just test the acknowledgment
                done();
            });
        });

        test('should show typing indicators', (done) => {
            socket.emit('typing-start', { privateChatId: testPrivateChatId });

            // In a complete test, you'd have another client to receive this
            // Here we just test that the server accepts the event
            setTimeout(() => {
                socket.emit('typing-end', { privateChatId: testPrivateChatId });
                done();
            }, 100);
        });
    });

    describe('Status Updates', () => {
        test('should notify on user disconnect', (done) => {
            const statusSocket = io(SERVER_URL, {
                extraHeaders: {
                    Cookie: authCookie.join('; ')
                },
                withCredentials: true
            });

            statusSocket.on('connect', () => {
                statusSocket.on('user-status-changed', (data) => {
                    if (data.userId === testUserId && !data.isOnline) {
                        statusSocket.disconnect();
                        done();
                    }
                });

                statusSocket.disconnect();
            });
        });
    });
});
