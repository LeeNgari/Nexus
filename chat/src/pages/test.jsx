// src/components/ChatList.jsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Create socket instance with proper configuration
const socket = io("http://localhost:5000", {
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: false // We'll connect manually after setting up listeners
});

export default function ChatList() {
    const [privateChats, setPrivateChats] = useState([]);
    const [groupChats, setGroupChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectionError, setConnectionError] = useState(null);

    useEffect(() => {
        // Set up all event listeners before connecting
        socket.on('connect', () => {
            console.log('Connected:', socket.id);
            setConnectionError(null);

            socket.emit('get_user_chats', null, (res) => {
                if (res.error) {
                    console.error(res.error);
                    setConnectionError(res.error);
                } else {
                    setPrivateChats(res.private || []);
                    setGroupChats(res.group || []);
                }
                setLoading(false);
            });
        });

        socket.on('connect_error', (err) => {
            console.error('Connection error:', err);
            setConnectionError('Failed to connect. Please refresh the page.');
            setLoading(false);
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
            if (reason === 'io server disconnect') {
                // The server forcibly disconnected the socket
                setConnectionError('Disconnected from server. Please refresh.');
            }
        });

        // Now connect the socket
        socket.connect();

        return () => {
            // Clean up all listeners
            socket.off('connect');
            socket.off('connect_error');
            socket.off('disconnect');
            socket.disconnect();
        };
    }, []);

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Your Chats</h1>

            {connectionError && (
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
                    {connectionError}
                </div>
            )}

            {loading ? (
                <div className="text-center text-gray-500">Loading chats...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Private Chats and Group Chats sections remain the same */}
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Private Chats</h2>
                        <div className="bg-white shadow rounded-lg divide-y">
                            {privateChats.length === 0 ? (
                                <p className="p-4 text-gray-500">No private chats found.</p>
                            ) : (
                                privateChats.map((chat, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50">
                                        <p className="font-medium">{chat.name || `Chat with ${chat.otherUserName || 'User'}`}</p>
                                        <p className="text-sm text-gray-600">Last message: {chat.lastMessage || 'No messages yet'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Group Chats */}
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Group Chats</h2>
                        <div className="bg-white shadow rounded-lg divide-y">
                            {groupChats.length === 0 ? (
                                <p className="p-4 text-gray-500">No group chats found.</p>
                            ) : (
                                groupChats.map((chat, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50">
                                        <p className="font-medium">{chat.name || `Group ${idx + 1}`}</p>
                                        <p className="text-sm text-gray-600">{chat.members?.length || 0} members</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>


                </div>
            )}
        </div>
    );
}