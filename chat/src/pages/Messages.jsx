import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';

// Import new components
import Header from './chat/Header'; // Adjust path
import Sidebar from './chat/Sidebar'; // Adjust path
import MessageArea from './chat/MessageArea'; // Adjust path



// --- Configuration ---
const SOCKET_SERVER_URL = 'http://localhost:5000'; // Replace with your backend URL
const TYPING_TIMER_LENGTH = 3000; // ms -> 3 seconds delay for typing_stop







// --- Main Component ---
function ChatApp() {
    // --- State Variables ---
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const [privateChats, setPrivateChats] = useState([]);
    const [groupChats, setGroupChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    const [messages, setMessages] = useState([]);
    const [newMessageContent, setNewMessageContent] = useState('');

    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState(null); // error state remains in the parent

    const [filterType, setFilterType] = useState('all');

    // State for Typing & Presence
    const [typingUsers, setTypingUsers] = useState({});
    const [userStatuses, setUserStatuses] = useState({});
    const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false); // Typing state remains in parent

    // --- Refs ---
    // const messagesEndRef = useRef(null); // Moved to MessageList
    const typingTimeoutRef = useRef(null); // Remains in parent for typing logic

    const addUiError = (message) => { console.error("UI Error:", message); setError(message); }; // Needs setError from state
const clearError = () => setError(null); // Needs setError from state


    const location = useLocation(); // Get location object which contains state
    const navigate = useNavigate(); // Keep if routing is needed elsewhere

    // --- Utility Functions ---
    // addUiError, clearError defined above, use state setter

    // --- Auto Scroll Effect ---
    // Moved to MessageList

    // --- Socket Connection & Event Listeners Effect ---
    useEffect(() => {
        console.log('Attempting socket connection...');
        clearError();
        // Add auth token here if needed
        const newSocket = io(SOCKET_SERVER_URL, { withCredentials: true, transports: ['websocket', 'polling'], reconnectionAttempts: 5 });
        setSocket(newSocket);

        // Core Listeners (connect, disconnect, connect_error)
        newSocket.on('connect', () => { console.log(`✅ Socket connected! ID: ${newSocket.id}`); setIsConnected(true); clearError(); console.log("Waiting for session_info..."); });
        newSocket.on('disconnect', (reason) => { console.log(`🔌 Socket disconnected: ${reason}`); setIsConnected(false); setCurrentUserId(null); setPrivateChats([]); setGroupChats([]); setSelectedChat(null); setMessages([]); addUiError(`Disconnected: ${reason}.`); });
        newSocket.on('connect_error', (err) => { console.error(`❌ Socket Connection Error: ${err.message}`, err); setIsConnected(false); setCurrentUserId(null); addUiError(`Connection Failed: ${err.message}.`); if (err.message.includes('Authentication error')) addUiError('Authentication failed.'); });

        // Session Info Listener
        newSocket.on('session_info', ({ userId }) => {
            console.log("✅ Received session_info, User ID:", userId);
            if (userId) { setCurrentUserId(userId); console.log("Triggering chat fetch..."); handleGetUserChats(newSocket); }
            else { console.error("session_info missing userId!"); addUiError("Failed to get user session."); }
        });

        // Incoming Message Handler
        const handleIncomingMessage = (message, type) => {
            console.log(`📬 Handler Triggered: handleIncomingMessage for ${type}`, JSON.stringify(message, null, 2));
             if (!message?.id || !message.senderId || !message.sender?.id || (!message.chatId && !message.groupId)) { console.warn("⚠️ Malformed message received.", message); return; }
            const targetChatId = type === 'private' ? message.chatId : message.groupId;

            // Use functional state update form to get the *current* selectedChat value
            setSelectedChat(currentSelectedChat => {
                console.log(`Selected Chat Check: Current=${currentSelectedChat?.id}, Target=${targetChatId}`);
                if (currentSelectedChat && targetChatId === currentSelectedChat.id) {
                    console.log(`✅ Msg ${message.id} matches selected chat. Updating UI.`);
                    // Use functional update for messages as well
                    setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
                     // Assume stops typing on receive - update typingUsers state using functional update
                    setTypingUsers(prev => { const u = { ...prev }; delete u[message.senderId]; return u; });
                } else {
                    console.log(`Msg ${message.id} for non-selected chat ${targetChatId}. Updating sidebar.`);
                    const listUpdater = type === 'private' ? setPrivateChats : setGroupChats;
                    listUpdater(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, hasUnread: true } : chat));
                }
                 return currentSelectedChat; // Return the current state value
            });
        };
        newSocket.on('receive_private_message', (message) => handleIncomingMessage(message, 'private'));
        newSocket.on('receive_group_message', (message) => handleIncomingMessage(message, 'group'));


        // Typing Status Listener
        newSocket.on('user_typing_status', (data) => {
             setSelectedChat(currentSelectedChat => {
                if (currentSelectedChat && data.userId !== currentUserId &&
                    ((currentSelectedChat.type === 'private' && data.chatId === currentSelectedChat.id) || (currentSelectedChat.type === 'group' && data.groupId === currentSelectedChat.id))) {
                    console.log(`⌨️ Typing status: User ${data.username} (${data.userId}) isTyping: ${data.isTyping}`);
                    // Update typingUsers state using functional update
                    setTypingUsers(prev => { const u = { ...prev }; if (data.isTyping) u[data.userId] = data.username; else delete u[data.userId]; return u; });
                }
                return currentSelectedChat; // Return the current state value
            });
        });

        // User Presence Listener
        newSocket.on('user_status_update', (data) => {
            console.log(`👤 Status update: User ${data.userId} isOnline: ${data.isOnline}`);
            // Update userStatuses state using functional update
            setUserStatuses(prev => ({ ...prev, [data.userId]: { isOnline: data.isOnline, lastActive: data.lastActive } }));
        });

        // Cleanup
        return () => {
            console.log('🧹 Cleaning up socket connection.');
            clearTimeout(typingTimeoutRef.current);
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('connect_error');
            newSocket.off('session_info');
            newSocket.off('receive_private_message');
            newSocket.off('receive_group_message');
            newSocket.off('user_typing_status');
            newSocket.off('user_status_update');
            newSocket.disconnect(); // Use newSocket, not `socket` state directly in cleanup
            setSocket(null); setIsConnected(false); setCurrentUserId(null); setUserStatuses({}); setTypingUsers({});
        };
        // Dependency array: Ensure effect re-runs if SOCKET_SERVER_URL changes (unlikely in this setup)
        // or if addUiError/clearError/handleGetUserChats needed external dependencies (they don't here).
        // Include handleGetUserChats if its dependencies were external, but its current dependency is just `socket` itself.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [SOCKET_SERVER_URL]); // Re-run only if server URL changes


    const fetchUserStatuses = useCallback((sock, userIds) => {
      if (!sock || !sock.connected || !userIds || userIds.length === 0) return;
      console.log(`❓ Requesting statuses for ${userIds.length} users:`, userIds);
      sock.emit('get_user_statuses', { userIds: userIds }, (response) => {
           if (response?.statuses) {
              console.log(`💡 Received ${response.statuses.length} initial statuses.`);
              const newStatuses = {}; response.statuses.forEach(s => { newStatuses[s.userId] = { isOnline: s.isOnline, lastActive: s.lastActive }; });
              setUserStatuses(prev => ({ ...prev, ...newStatuses }));
          } else console.warn("Invalid response for get_user_statuses", response);
      });
  }, []); 

     // --- Data Fetching Functions ---
     // useCallback ensures these functions are stable across renders
    const handleGetUserChats = useCallback((sock) => {
        if (!sock || !sock.connected) { addUiError('Cannot fetch chats: Not connected.'); return; }
        console.log('💬 Requesting user chats...'); setIsLoadingChats(true); clearError();
        sock.emit('get_user_chats', null, (response) => {
            console.log('📬 Received user chats response:', response); setIsLoadingChats(false);
            if (response.error) { addUiError(`Error fetching chats: ${response.error}`); setPrivateChats([]); setGroupChats([]); }
            else {
                const pChats = response.private || []; const gChats = response.group || [];
                console.log(`Processing ${pChats.length} private, ${gChats.length} group chats.`);
                setPrivateChats(pChats); setGroupChats(gChats);
                // Extract unique user IDs from private chats for status fetching
                const userIdsToFetch = new Set();
                 pChats.forEach(chat => { if (chat.other_user_id) userIdsToFetch.add(chat.other_user_id); });
                 // If group members were available, add them here too.
                if (userIdsToFetch.size > 0) fetchUserStatuses(sock, Array.from(userIdsToFetch));
                if (pChats.length === 0 && gChats.length === 0) console.warn("No chats fetched.");
            }
        });
    }, [addUiError, clearError, fetchUserStatuses]); // Add dependencies used inside useCallback


   // Add dependencies used inside useCallback (setUserStatuses doesn't need to be a dependency itself for this functional update)

    const fetchMessagesForChat = useCallback((chat) => {
        if (!socket || !isConnected || !chat?.id) { console.warn("fetchMessages prerequisites not met"); return; }
        const eventName = chat.type === 'private' ? 'get_private_chat_messages' : 'get_group_chat_messages';
        const payload = chat.type === 'private' ? { chatId: chat.id } : { groupId: chat.id };
        console.log(`💬 Requesting messages for ${chat.type} chat: ${chat.id}`);
        setIsLoadingMessages(true); setMessages([]); clearError();
        socket.emit(eventName, payload, (response) => {
            console.log(`📬 Received messages for ${chat.type} ${chat.id}:`, response); setIsLoadingMessages(false);
            if (response.error) { addUiError(`Error fetching messages: ${response.error}`); setMessages([]); }
            else { const fetched = Array.isArray(response.messages) ? response.messages : []; setMessages(fetched); if (fetched.length === 0) console.log(`No messages for chat ${chat.id}.`); }
        });
    }, [socket, isConnected, addUiError, clearError]); // Add dependencies


     // --- Event Handlers ---
     const handleSelectChat = useCallback((chat) => {
        if (selectedChat?.id === chat.id || isLoadingMessages) return;
        console.log('Selected chat:', chat); setTypingUsers({}); // Clear typing when changing chats

        // Mark chat as read
        const listUpdater = chat.type === 'private' ? setPrivateChats : setGroupChats;
        listUpdater(prev => prev.map(c => c.id === chat.id ? { ...c, hasUnread: false } : c ));

        setSelectedChat(chat); // Set the selected chat state
        fetchMessagesForChat(chat); // Fetch messages for the newly selected chat

        // Fetch status for the other user when selecting a private chat
        if (chat.type === 'private' && chat.other_user_id && socket) {
            fetchUserStatuses(socket, [chat.other_user_id]);
        }
    }, [selectedChat?.id, isLoadingMessages, fetchMessagesForChat, socket, fetchUserStatuses]); // Add dependencies


    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        if (!socket || !isConnected || !selectedChat || !newMessageContent.trim() || !currentUserId) {
             addUiError('Cannot send message...');
             console.warn('Send preconditions not met.');
            return;
        }
        const content = newMessageContent.trim();
        const eventName = selectedChat.type === 'private' ? 'send_private_message' : 'send_group_message';
        const payload = selectedChat.type === 'private' ? { chatId: selectedChat.id, content: content } : { groupId: selectedChat.id, content: content };
        console.log(`🚀 Sending message via ${eventName}:`, payload);
        clearError(); // Clear any previous send errors
        setNewMessageContent(''); // Clear input immediately
        handleTypingStop(); // Stop typing on send

        // Optimistic Update
        const tempId = `temp_${Date.now()}`;
        const optimisticMessage = {
            id: tempId,
            content: content,
            senderId: currentUserId,
            sender: { id: currentUserId, username: 'You', avatar_url: null }, // Use a placeholder sender
            chatId: selectedChat.type === 'private' ? selectedChat.id : undefined,
            groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
            timestamp: new Date().toISOString(), // Client-side timestamp
            type: 'text',
            isOptimistic: true
        };
        setMessages(prev => [...prev, optimisticMessage]);
        console.log(`✨ Optimistically added message with temp ID: ${tempId}`);

        // Emit socket event for sending
        socket.emit(eventName, payload, (response) => {
            console.log('✉️ Send message response:', response);
            if (response.error) {
                addUiError(`Send failed: ${response.error}`);
                // Remove optimistic message on error
                setMessages(prev => prev.filter(m => m.id !== tempId));
                console.warn(`Send failed for temp ID ${tempId}. Error: ${response.error}`);
            } else {
                 // Update the optimistic message with the server-provided ID and timestamp
                 if (response.messageId) {
                     setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: response.messageId, timestamp: response.timestamp, isOptimistic: false } : m));
                     console.log(`✅ Confirmed temp ID ${tempId} as server ID ${response.messageId}.`);
                 } else {
                      // Handle cases where server acknowledges but doesn't return messageId/timestamp correctly
                      console.warn(`Server ACK missing messageId/timestamp for temp ID ${tempId}. Response:`, response);
                       setMessages(prev => prev.filter(m => m.id !== tempId)); // Remove if server didn't provide correct ack
                 }
            }
        });
    }, [socket, isConnected, selectedChat, newMessageContent, currentUserId, addUiError, clearError]); // Add dependencies


    // Typing Handlers - Keep logic in parent, expose input change and blur
    const handleTypingStart = useCallback(() => {
        if (!socket || !isConnected || !selectedChat) {
            console.warn("Cannot send typing_start: prerequisites not met");
            return;
        }
        console.log("event: typing_start");
        const p = selectedChat.type === 'private' ? { chatId: selectedChat.id } : { groupId: selectedChat.id };
        socket.emit("typing_start", p);
    }, [socket, isConnected, selectedChat]);

    const handleTypingStop = useCallback(() => {
        // Only send typing_stop if we were previously typing according to our state
        if (!isCurrentlyTyping || !socket || !isConnected || !selectedChat) {
            console.log("Cannot send typing_stop: not currently typing or prerequisites not met");
            return;
        }
        console.log("event: typing_stop");
        setIsCurrentlyTyping(false); // Set state BEFORE emitting
        const p = selectedChat.type === 'private' ? { chatId: selectedChat.id } : { groupId: selectedChat.id };
        socket.emit("typing_stop", p);
         // Clear the timeout regardless, just in case
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null; // Clear the ref
    }, [isCurrentlyTyping, socket, isConnected, selectedChat]); // Add dependencies

     const handleFilterChange = useCallback((type) => {
        console.log("Changing filter to:", type);
        setFilterType(type);
    }, [setFilterType]); 
    // This handler is passed down to the input component
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setNewMessageContent(value); // Update input state

        if (!isConnected || !socket || !selectedChat) {
             console.warn("Cannot process input change for typing: prerequisites not met");
            return;
        }

        // If we weren't typing, start typing and emit
        if (!isCurrentlyTyping) {
            setIsCurrentlyTyping(true);
            handleTypingStart(); // Call the useCallback version
        }

        // Always clear the previous timeout
        clearTimeout(typingTimeoutRef.current);

        // Set a new timeout to stop typing after TYPING_TIMER_LENGTH if no further input
        typingTimeoutRef.current = setTimeout(() => {
             // Check isCurrentlyTyping again inside the timeout callback
            if (isCurrentlyTyping) { // This check might need refinement depending on desired behavior
                 console.log("Timeout reached, calling handleTypingStop");
                 handleTypingStop(); // Call the useCallback version
             } else {
                 console.log("Timeout reached, but state is already not typing.");
             }
        }, TYPING_TIMER_LENGTH);
    }, [isConnected, socket, selectedChat, isCurrentlyTyping, handleTypingStart, handleTypingStop]); // Add dependencies

    // Typing Display String Generator - Keep in parent, pass down
    const getTypingDisplay = () => {
        const users = Object.values(typingUsers).filter(Boolean);
        if (users.length === 0) return null;
        if (users.length === 1) return `${users[0]} is typing...`;
        if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
        return 'Several people are typing...';
    };
    const typingDisplayString = getTypingDisplay(); // Calculate here, pass down

    // --- Component Rendering (JSX) ---
    return (
        <div className="flex flex-col h-screen bg-background text-text-primary">
            {/* Header */}
            <Header isConnected={isConnected} currentUserId={currentUserId} />

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Conversations Sidebar */}
                <Sidebar
                    privateChats={privateChats}
                    groupChats={groupChats}
                    selectedChat={selectedChat}
                    onSelectChat={handleSelectChat} // Pass handler down
                    isLoadingChats={isLoadingChats}
                    error={error}
                    filterType={filterType}
                    onFilterChange={handleFilterChange}
                    clearError={clearError}
                    userStatuses={userStatuses} // Pass statuses down
                />

                {/* Message Display Area */}
                <MessageArea
                    selectedChat={selectedChat}
                    messages={messages}
                    isLoadingMessages={isLoadingMessages}
                    newMessageContent={newMessageContent}
                    setNewMessageContent={setNewMessageContent} // Pass setter down
                    handleSendMessage={handleSendMessage} // Pass handler down
                    handleInputChange={handleInputChange} // Pass handler down
                    handleTypingStop={handleTypingStop} // Pass handler down (for blur)
                    typingDisplayString={typingDisplayString} // Pass display string down
                    userStatuses={userStatuses} // Pass statuses down
                    currentUserId={currentUserId} // Pass current user ID down
                    isConnected={isConnected} // Pass connection status down
                />
            </div>
        </div>
    );
}

export default ChatApp;