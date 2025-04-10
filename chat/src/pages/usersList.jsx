import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// --- Configuration ---
const SOCKET_SERVER_URL = 'http://localhost:3000'; // Replace with your backend URL
const TYPING_TIMER_LENGTH = 3000; // ms -> 3 seconds delay for typing_stop

// --- Default Avatar URLs ---
// Replace with your preferred default/placeholder images
const DEFAULT_USER_AVATAR_URL = 'https://res.cloudinary.com/dydpguips/image/upload/v1735813189/profile-user-svgrepo-com_zflps6.svg';
const DEFAULT_GROUP_AVATAR_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJZ4KL1u31N_9XR7fharZZUVOy4aQG0a4dkQ&s'; // Generic group icon example

// --- Helper Functions ---
function formatTimestamp(isoString) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
        console.error("Error formatting timestamp:", e);
        return isoString;
    }
}

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
    const [error, setError] = useState(null);

    // State for Typing & Presence
    const [typingUsers, setTypingUsers] = useState({});
    const [userStatuses, setUserStatuses] = useState({});
    const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);

    // --- Refs ---
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // --- Utility Functions ---
    const addUiError = (message) => { console.error("UI Error:", message); setError(message); };
    const clearError = () => setError(null);

    // --- Auto Scroll Effect ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    // --- Socket Connection & Event Listeners Effect ---
    useEffect(() => {
        console.log('Attempting socket connection...');
        clearError();
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
            setSelectedChat(currentSelectedChat => {
                console.log(`Selected Chat Check: Current=${currentSelectedChat?.id}, Target=${targetChatId}`);
                if (currentSelectedChat && targetChatId === currentSelectedChat.id) {
                    console.log(`✅ Msg ${message.id} matches selected chat. Updating UI.`);
                    setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
                    setTypingUsers(prev => { const u = { ...prev }; delete u[message.senderId]; return u; }); // Assume stops typing on receive
                } else {
                    console.log(`Msg ${message.id} for non-selected chat ${targetChatId}. Updating sidebar.`);
                    const listUpdater = type === 'private' ? setPrivateChats : setGroupChats;
                    listUpdater(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, hasUnread: true } : chat));
                } return currentSelectedChat;
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
                    setTypingUsers(prev => { const u = { ...prev }; if (data.isTyping) u[data.userId] = data.username; else delete u[data.userId]; return u; });
                } return currentSelectedChat;
            });
        });

        // User Presence Listener
        newSocket.on('user_status_update', (data) => {
            console.log(`👤 Status update: User ${data.userId} isOnline: ${data.isOnline}`);
            setUserStatuses(prev => ({ ...prev, [data.userId]: { isOnline: data.isOnline, lastActive: data.lastActive } }));
        });

        // Cleanup
        return () => {
            console.log('🧹 Cleaning up socket connection.');
            clearTimeout(typingTimeoutRef.current);
            newSocket.disconnect();
            setSocket(null); setIsConnected(false); setCurrentUserId(null); setUserStatuses({}); setTypingUsers({});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // --- Data Fetching Functions ---
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
                const userIdsToFetch = new Set();
                // Use other_user_id from private chats for status fetching
                pChats.forEach(chat => { if (chat.other_user_id) userIdsToFetch.add(chat.other_user_id); });
                // We don't have group member IDs here, so can't fetch their status initially
                if (userIdsToFetch.size > 0) fetchUserStatuses(sock, Array.from(userIdsToFetch));
                 if (pChats.length === 0 && gChats.length === 0) console.warn("No chats fetched.");
            }
        });
    }, []); // Renamed fetchUserStatuses locally

    const fetchUserStatuses = useCallback((sock, userIds) => { // Renamed locally
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
    }, [socket, isConnected]);


    // --- Event Handlers ---
    const handleSelectChat = (chat) => {
        if (selectedChat?.id === chat.id || isLoadingMessages) return;
        console.log('Selected chat:', chat); setTypingUsers({});
        const listUpdater = chat.type === 'private' ? setPrivateChats : setGroupChats;
        listUpdater(prev => prev.map(c => c.id === chat.id ? { ...c, hasUnread: false } : c ));
        setSelectedChat(chat); fetchMessagesForChat(chat);
        // Fetch status for the other user when selecting a private chat
        if (chat.type === 'private' && chat.other_user_id && socket) fetchUserStatuses(socket, [chat.other_user_id]);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!socket || !isConnected || !selectedChat || !newMessageContent.trim() || !currentUserId) { addUiError('Cannot send message...'); return; }
        const content = newMessageContent.trim();
        const eventName = selectedChat.type === 'private' ? 'send_private_message' : 'send_group_message';
        const payload = selectedChat.type === 'private' ? { chatId: selectedChat.id, content: content } : { groupId: selectedChat.id, content: content };
        console.log(`🚀 Sending message via ${eventName}:`, payload);
        clearError(); setNewMessageContent(''); handleTypingStop(); // Stop typing on send

        const tempId = `temp_${Date.now()}`;
        const optimisticMessage = {
            id: tempId, content: content, senderId: currentUserId,
            sender: { id: currentUserId, username: 'You', avatar_url: null }, // Match nested structure
            chatId: selectedChat.type === 'private' ? selectedChat.id : undefined,
            groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
            timestamp: new Date().toISOString(), type: 'text', isOptimistic: true };
        setMessages(prev => [...prev, optimisticMessage]); console.log(`✨ Optimistically added ${tempId}`);

        socket.emit(eventName, payload, (response) => {
            console.log('✉️ Send message response:', response);
            if (response.error) { addUiError(`Send failed: ${response.error}`); setMessages(prev => prev.filter(m => m.id !== tempId)); }
            else { console.log(`Msg ${response.messageId} ack by server @ ${response.timestamp}.`); setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: response.messageId, timestamp: response.timestamp, isOptimistic: false } : m)); console.log(`✅ Confirmed ${tempId} as ${response.messageId}`); }
        });
    };

    // Typing Handlers
    const handleTypingStart = useCallback(() => { if (!socket || !isConnected || !selectedChat) return; console.log("event: typing_start"); const p = selectedChat.type === 'private' ? { chatId: selectedChat.id } : { groupId: selectedChat.id }; socket.emit("typing_start", p); }, [socket, isConnected, selectedChat]);
    const handleTypingStop = useCallback(() => { if (!isCurrentlyTyping || !socket || !isConnected || !selectedChat) return; console.log("event: typing_stop"); setIsCurrentlyTyping(false); const p = selectedChat.type === 'private' ? { chatId: selectedChat.id } : { groupId: selectedChat.id }; socket.emit("typing_stop", p); clearTimeout(typingTimeoutRef.current); }, [socket, isConnected, selectedChat, isCurrentlyTyping]);
    const handleInputChange = (e) => {
        const value = e.target.value; setNewMessageContent(value); if (!isConnected || !socket) return;
        if (!isCurrentlyTyping) { setIsCurrentlyTyping(true); handleTypingStart(); }
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => { if (isCurrentlyTyping) handleTypingStop(); }, TYPING_TIMER_LENGTH);
    };

    // Typing Display String Generator
    const getTypingDisplay = () => {
        const users = Object.values(typingUsers).filter(Boolean); if (users.length === 0) return null;
        if (users.length === 1) return `${users[0]} is typing...`; if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
        return 'Several people are typing...'; };
    const typingDisplayString = getTypingDisplay();


    // --- Component Rendering (JSX) ---
    return (
        <div className="flex h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">

            {/* Sidebar Section */}
            <aside className="w-1/4 md:w-1/3 lg:w-1/4 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
                {/* Sidebar Header */}
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h1 className="text-xl font-bold mb-1">Messenger</h1>
                    <p className={`text-xs font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}> Status: {isConnected ? 'Connected' : 'Disconnected'} </p>
                    {currentUserId && <p className="text-xs text-gray-500 dark:text-gray-400">Your ID: {currentUserId.substring(0,8)}...</p>}
                </header>

                {/* Chat Lists Container */}
                <div className="flex-grow overflow-y-auto">
                    {isLoadingChats && <p className="p-4 text-center text-gray-500 dark:text-gray-400">Loading chats...</p>}

                    {/* Group Chat List */}
                    <section className="p-2">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1 uppercase tracking-wide">Groups</h2>
                        {groupChats.length === 0 && !isLoadingChats && <p className="px-2 text-xs text-gray-400 italic">No groups found.</p>}
                        <ul>
                            {groupChats.map((chat) => (
                                <li key={chat.id}
                                    onClick={() => handleSelectChat({ ...chat, type: 'group', name: chat.name })}
                                    className={`p-2 flex items-center gap-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedChat?.id === chat.id ? 'bg-blue-100 dark:bg-blue-900 font-semibold' : ''}`}
                                    title={chat.name} >
                                    {/* Group Avatar */}
                                    <img
                                        src={chat.avatar_url || DEFAULT_GROUP_AVATAR_URL} // Use group avatar or default
                                        alt={chat.name || 'Group'}
                                        className="w-10 h-10 rounded-full flex-shrink-0 object-cover bg-gray-200 dark:bg-gray-600" // Added bg color
                                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_GROUP_AVATAR_URL; }} />
                                    {/* Group Info */}
                                    <div className="flex-grow overflow-hidden">
                                        <span className={`block font-medium truncate ${chat.hasUnread ? 'font-bold' : ''}`}>{chat.name || `Group ${chat.id.substring(0, 6)}`}</span>
                                        {/* Can add last message preview later */}
                                    </div>
                                    {/* Unread Indicator */}
                                    {chat.hasUnread && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-auto"></span>}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Private Chat List */}
                    <section className="p-2 border-t border-gray-200 dark:border-gray-700">
                         <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1 uppercase tracking-wide">Direct Messages</h2>
                         {privateChats.length === 0 && !isLoadingChats && <p className="px-2 text-xs text-gray-400 italic">No private chats found.</p>}
                         <ul>
                           {privateChats.map((chat) => {
                             // Use chat.name and chat.avatar_url directly as per new structure
                             const chatName = chat.name || `User ${chat.other_user_id?.substring(0, 6) || chat.id.substring(0,6)}`;
                             const chatAvatar = chat.avatar_url || DEFAULT_USER_AVATAR_URL;
                             // Get status using other_user_id
                             const status = chat.other_user_id ? userStatuses[chat.other_user_id] : null;
                             return (
                               <li key={chat.id}
                                 onClick={() => handleSelectChat({ ...chat, type: 'private', name: chatName })} // Pass chat.name
                                 className={`p-2 flex items-center gap-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedChat?.id === chat.id ? 'bg-blue-100 dark:bg-blue-900 font-semibold' : ''}`}
                                 title={chatName} >
                                    {/* Other User's Avatar + Status Dot */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={chatAvatar}
                                            alt={chatName}
                                            className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-600" // Added bg color
                                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR_URL; }} />
                                        {/* Online Status Dot */}
                                        {status && (
                                             <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${status.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                                                title={status.isOnline ? 'Online' : `Offline${status.lastActive ? ' - Last seen: '+ new Date(status.lastActive).toLocaleTimeString() : ''}`}>
                                             </span>
                                        )}
                                    </div>
                                    {/* User Info */}
                                    <div className="flex-grow overflow-hidden">
                                        <span className={`block font-medium truncate ${chat.hasUnread ? 'font-bold' : ''}`}>{chatName}</span>
                                        {/* Can add last message preview later */}
                                    </div>
                                    {/* Unread Indicator */}
                                    {chat.hasUnread && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-auto"></span>}
                               </li>
                             );
                           })}
                         </ul>
                       </section>
                </div>
            </aside>

            {/* Main Chat Area Section */}
            <main className="w-3/4 md:w-2/3 lg:w-3/4 h-full flex flex-col bg-gray-50 dark:bg-gray-850">
                {/* Placeholder or Chat View */}
                {!selectedChat ? (
                    <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                        <p>Select a chat from the sidebar<br />to start messaging.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                            <h2 className="text-lg font-semibold truncate" title={selectedChat.name}>{selectedChat.name}</h2>
                            {/* Sub-header for Typing / Online Status */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 h-4">
                                {typingDisplayString ? (
                                    <span className="italic animate-pulse">{typingDisplayString}</span>
                                ) : (
                                    selectedChat.type === 'private'
                                    // Use other_user_id to check status
                                    ? (userStatuses[selectedChat.other_user_id]?.isOnline ? 'Online' : 'Offline')
                                    : 'Group Chat'
                                )}
                            </p>
                        </header>

                        {/* Messages Display Area */}
                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                           {isLoadingMessages && <p className="text-center text-gray-500 dark:text-gray-400 py-4">Loading messages...</p>}
                           {!isLoadingMessages && messages.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-4">No messages in this chat yet.</p>}
                           {/* Message Mapping */}
                           {messages.map((msg) => {
                             const isOwnMessage = msg.senderId === currentUserId;
                             const senderUsername = msg.sender?.username || 'Unknown User';
                             const senderAvatar = msg.sender?.avatar_url;
                             if (!msg.id) return null;
                             return (
                               <div key={msg.id} className={`flex items-start gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                {/* Avatar for others */}
                                {!isOwnMessage && ( <img src={senderAvatar || DEFAULT_USER_AVATAR_URL} alt={senderUsername} className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200 dark:bg-gray-600" onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR_URL; }}/> )}
                                 {/* Message Bubble */}
                                 <div className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-lg shadow-md ${msg.isOptimistic ? 'opacity-70': ''} ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                   {!isOwnMessage && selectedChat.type === 'group' && ( <p className="text-xs font-semibold mb-1 text-indigo-600 dark:text-indigo-400">{senderUsername}</p> )}
                                   <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                   <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'} text-right`}> {formatTimestamp(msg.timestamp)} </p>
                                 </div>
                               </div>
                             );
                           })}
                           <div ref={messagesEndRef} />
                        </div>

                         {/* Error Display */}
                        {error && (
                            <div className="p-2 bg-red-100 border-t border-red-300 text-red-800 text-sm flex justify-between items-center flex-shrink-0" role="alert">
                                <span><span className="font-bold">Error:</span> {error}</span>
                                <button onClick={clearError} className="font-bold text-red-600 hover:text-red-800 ml-2 p-1 leading-none rounded-full focus:outline-none focus:ring-1 focus:ring-red-500" aria-label="Dismiss error">✕</button>
                            </div>
                        )}

                        {/* Message Input Form */}
                        <footer className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <input
                              type="text" placeholder="Type your message..." value={newMessageContent}
                              onChange={handleInputChange} onBlur={handleTypingStop}
                              className="flex-grow px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:border-blue-500"
                              disabled={!isConnected || isLoadingMessages} autoFocus autoComplete="off" />
                            <button type="submit"
                              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                              disabled={!isConnected || isLoadingMessages || !newMessageContent.trim()} >
                              Send
                            </button>
                          </form>
                        </footer>
                    </>
                )}
            </main>
        </div>
    );
}

export default ChatApp;