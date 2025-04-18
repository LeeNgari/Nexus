import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import ThemeToggle from "../components/ThemeToggle";
import { useLocation, useNavigate } from 'react-router-dom'; 

// --- Configuration ---
const SOCKET_SERVER_URL = 'http://localhost:5000'; // Replace with your backend URL
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

    const location = useLocation(); // Get location object which contains state
    const navigate = useNavigate();

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
        <div className="flex flex-col h-screen bg-background text-text-primary">
  {/* Header */}
  <header className="flex items-center justify-between p-6 border-b border-border">
    <h1 className="text-2xl font-semibold">Messedadadsager</h1>
    <div className="flex items-center gap-4 md:gap-6">
      <div className={`text-xs font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      {currentUserId && (
        <div className="hidden md:block">
          <div className="text-xs text-text-secondary">Your ID: {currentUserId.substring(0,8)}...</div>
        </div>
      )}
    </div>
     <ThemeToggle />
  </header>

  {/* Main content */}
  <div className="flex flex-1 overflow-hidden">
    {/* Conversations Sidebar */}
    <div className="w-full md:w-[380px] lg:w-[420px] border-r border-border flex flex-col">
      {/* Search Input */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="w-5 h-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 m-4 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
          <button onClick={clearError} className="float-right font-bold text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Tabs and Conversation List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-3 gap-1 px-4 pt-4">
          <button className="px-4 py-2 rounded-md text-sm font-medium">All</button>
          <button className="px-4 py-2 rounded-md text-sm font-medium">People</button>
          <button className="px-4 py-2 rounded-md text-sm font-medium">Groups</button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {/* Group Chat List */}
          <section className="p-2">
            <h2 className="text-sm font-semibold text-text-secondary px-2 mb-1 uppercase tracking-wide">Groups</h2>
            {isLoadingChats && <p className="p-4 text-center text-text-secondary">Loading chats...</p>}
            {groupChats.length === 0 && !isLoadingChats && (
              <p className="px-2 text-xs text-text-secondary italic">No groups found.</p>
            )}
            <div className="space-y-1">
              {groupChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat({ ...chat, type: 'group', name: chat.name })}
                  className={`p-2 flex items-center gap-3 rounded-md cursor-pointer hover:bg-hover ${
                    selectedChat?.id === chat.id ? 'bg-primary/10 font-semibold' : ''
                  }`}
                  title={chat.name}
                >
                  <img
                    src={chat.avatar_url || DEFAULT_GROUP_AVATAR_URL}
                    alt={chat.name || 'Group'}
                    className="w-10 h-10 rounded-full flex-shrink-0 object-cover bg-gray-200 dark:bg-gray-600"
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_GROUP_AVATAR_URL; }}
                  />
                  <div className="flex-grow overflow-hidden">
                    <span className={`block font-medium truncate ${chat.hasUnread ? 'font-bold' : ''}`}>
                      {chat.name || `Group ${chat.id.substring(0, 6)}`}
                    </span>
                  </div>
                  {chat.hasUnread && (
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-auto"></span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Private Chat List */}
          <section className="p-2 border-t border-border">
            <h2 className="text-sm font-semibold text-text-secondary px-2 mb-1 uppercase tracking-wide">Direct Messages</h2>
            {privateChats.length === 0 && !isLoadingChats && (
              <p className="px-2 text-xs text-text-secondary italic">No private chats found.</p>
            )}
            <div className="space-y-1">
              {privateChats.map((chat) => {
                const chatName = chat.name || `User ${chat.other_user_id?.substring(0, 6) || chat.id.substring(0,6)}`;
                const chatAvatar = chat.avatar_url || DEFAULT_USER_AVATAR_URL;
                const status = chat.other_user_id ? userStatuses[chat.other_user_id] : null;
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat({ ...chat, type: 'private', name: chatName })}
                    className={`p-2 flex items-center gap-3 rounded-md cursor-pointer hover:bg-hover ${
                      selectedChat?.id === chat.id ? 'bg-primary/10 font-semibold' : ''
                    }`}
                    title={chatName}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={chatAvatar}
                        alt={chatName}
                        className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-600"
                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR_URL; }}
                      />
                      {status && (
                        <span
                          className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                            status.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                          title={
                            status.isOnline
                              ? 'Online'
                              : `Offline${status.lastActive ? ' - Last seen: ' + new Date(status.lastActive).toLocaleTimeString() : ''}`
                          }
                        ></span>
                      )}
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <span className={`block font-medium truncate ${chat.hasUnread ? 'font-bold' : ''}`}>
                        {chatName}
                      </span>
                    </div>
                    {chat.hasUnread && (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-auto"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>

    {/* Message Display Area */}
    <div className="flex-1 flex flex-col bg-muted/30">
      {!selectedChat ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-secondary">
          <svg
            className="w-16 h-16 mb-4 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.04 8.25-7.625 8.25-1.414 0-2.743-.372-3.875-.968a.375.375 0 0 1-.112-.477m-.283-3.546a.375.375 0 0 0-.112-.477m0 0c-.399-.285-.84-.487-1.312-.613a4.5 4.5 0 0 1 0-7.752c.472-.126.913-.328 1.313-.612m3.875 9.24a.375.375 0 0 1 .112.477m0 0a4.496 4.496 0 0 0 4.125-3.234m0 0a4.496 4.496 0 0 0 0-6.468m0 0a4.504 4.504 0 0 0-4.125-3.234m0 0a.375.375 0 0 0-.112.477m-.283 3.546a.375.375 0 0 1-.112.477"
            />
          </svg>
          <h3 className="text-lg font-medium text-text-primary">Select a conversation</h3>
          <p className="mt-1 text-sm">Choose from your existing conversations or start a new one.</p>
        </div>
      ) : (
        <>
          {/* Conversation Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <img
                src={
                  selectedChat.type === 'group'
                    ? selectedChat.avatar_url || DEFAULT_GROUP_AVATAR_URL
                    : selectedChat.avatar_url || DEFAULT_USER_AVATAR_URL
                }
                alt={selectedChat.name}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <div className="font-semibold">{selectedChat.name}</div>
                <div className="text-xs text-text-secondary h-4">
                  {typingDisplayString ? (
                    <span className="italic animate-pulse text-primary">{typingDisplayString}</span>
                  ) : selectedChat.type === 'private' ? (
                    userStatuses[selectedChat.other_user_id]?.isOnline ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Online
                      </span>
                    ) : (
                      'Offline'
                    )
                  ) : (
                    'Group Chat'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative">
            {isLoadingMessages && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <p className="text-text-secondary">Loading messages...</p>
              </div>
            )}
            {!isLoadingMessages && messages.length === 0 && (
              <p className="text-center text-text-secondary py-4">No messages in this chat yet.</p>
            )}
            {messages.map((msg) => {
              const isOwnMessage = msg.senderId === currentUserId;
              const senderUsername = msg.sender?.username || 'Unknown User';
              const senderAvatar = msg.sender?.avatar_url;
              if (!msg.id) return null;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwnMessage && (
                    <img
                      src={senderAvatar || DEFAULT_USER_AVATAR_URL}
                      alt={senderUsername}
                      className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200 dark:bg-gray-600"
                      onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR_URL; }}
                    />
                  )}
                  <div
                    className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-lg shadow-sm ${
                      msg.isOptimistic ? 'opacity-70' : ''
                    } ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white dark:bg-gray-700 text-text-primary'
                    }`}
                  >
                    {!isOwnMessage && selectedChat.type === 'group' && (
                      <p className="text-xs font-semibold mb-1 text-indigo-600 dark:text-indigo-400">
                        {senderUsername}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-text-secondary'
                      } text-right`}
                    >
                      {formatTimestamp(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Area */}
          <div className="p-4 border-t border-border bg-background">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessageContent}
                onChange={handleInputChange}
                onBlur={handleTypingStop}
                className="flex-1 px-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={!isConnected || isLoadingMessages}
                autoFocus
                autoComplete="off"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                disabled={!isConnected || isLoadingMessages || !newMessageContent.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  </div>
</div>
    );
}

export default ChatApp;