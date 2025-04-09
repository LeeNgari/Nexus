import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// --- Configuration ---
// IMPORTANT: Replace with your actual backend server URL
const SOCKET_SERVER_URL = 'http://localhost:5000';

// --- Helper Functions ---
function formatTimestamp(isoString) {
    // Formats ISO timestamp string to locale time (e.g., 10:30 AM)
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
        console.error("Error formatting timestamp:", e);
        return isoString; // Fallback if parsing fails
    }
}

// --- Main Component ---
function ChatApp() {
    // --- State Variables ---
    const [socket, setSocket] = useState(null); // Holds the socket instance
    const [isConnected, setIsConnected] = useState(false); // Tracks connection status
    const [currentUserId, setCurrentUserId] = useState(null); // Stores the logged-in user's ID

    const [privateChats, setPrivateChats] = useState([]); // List of user's private chats
    const [groupChats, setGroupChats] = useState([]); // List of user's group chats
    const [selectedChat, setSelectedChat] = useState(null); // Details of the currently viewed chat

    const [messages, setMessages] = useState([]); // Messages for the selected chat
    const [newMessageContent, setNewMessageContent] = useState(''); // Content of the message input field

    const [isLoadingChats, setIsLoadingChats] = useState(false); // Loading indicator for chat list
    const [isLoadingMessages, setIsLoadingMessages] = useState(false); // Loading indicator for messages
    const [error, setError] = useState(null); // For displaying UI errors

    // --- Refs ---
    const messagesEndRef = useRef(null); // Ref to enable auto-scrolling to the latest message

    // --- Utility Functions ---
    // Displays an error message in the UI and console
    const addUiError = (message) => {
        console.error("UI Error:", message);
        setError(message);
        // Optional: Auto-clear error after a delay
        // setTimeout(() => setError(null), 7000);
    };
    // Clears the currently displayed error message
    const clearError = () => setError(null);

    // --- Auto Scroll Effect ---
    // Scrolls the message area to the bottom whenever the 'messages' state changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    // --- Socket Connection & Event Listeners Effect ---
    // Sets up the socket connection and main event listeners when the component mounts
    useEffect(() => {
        console.log('Attempting socket connection...');
        clearError(); // Clear any previous errors on new connection attempt

        // Initialize the Socket.IO client
        const newSocket = io(SOCKET_SERVER_URL, {
            withCredentials: true, // Essential for sending session cookies
            transports: ['websocket', 'polling'], // Match server configuration
            reconnectionAttempts: 5 // Optional: Attempt to reconnect automatically
        });
        setSocket(newSocket); // Store the socket instance in state

        // --- Core Socket Event Listeners ---
        newSocket.on('connect', () => {
            console.log(`✅ Socket connected! Socket ID: ${newSocket.id}`);
            setIsConnected(true);
            clearError();
            console.log("Waiting for session_info event from server..."); // Waits for user ID confirmation
        });

        newSocket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected. Reason: ${reason}`);
            setIsConnected(false);
            setCurrentUserId(null); // Clear user ID on disconnect
            // Reset chat state on disconnect to avoid showing stale data
            setPrivateChats([]);
            setGroupChats([]);
            setSelectedChat(null);
            setMessages([]);
            addUiError(`Disconnected: ${reason}.`); // Inform the user
        });

        newSocket.on('connect_error', (err) => {
            console.error(`❌ Socket Connection Error: ${err.message}`, err);
            setIsConnected(false);
            setCurrentUserId(null);
            addUiError(`Connection Failed: ${err.message}.`);
            if (err.message.includes('Authentication error')) {
                addUiError('Authentication failed. Please login again.');
            }
        });

        // --- Listener for User Session Information ---
        // Expects the server to emit this right after successful connection/authentication
        newSocket.on('session_info', ({ userId }) => {
            console.log("✅ Received session_info, User ID:", userId);
            if (userId) {
                setCurrentUserId(userId); // Store the confirmed user ID
                console.log("Triggering chat fetch...");
                handleGetUserChats(newSocket); // Fetch user's chats now
            } else {
                console.error("Received session_info but userId is missing!");
                addUiError("Failed to get user session information from server.");
            }
        });

        // --- Unified Handler for Incoming Messages ---
        const handleIncomingMessage = (message, type) => {
            console.log(`📬 <<< Handler Triggered: handleIncomingMessage for ${type} >>>`);
            console.log(`📦 Raw ${type} message payload received:`, JSON.stringify(message, null, 2));

            // Validate the structure of the incoming message (including nested sender)
            if (!message || !message.id || !message.senderId || !message.sender || !message.sender.id || (!message.chatId && !message.groupId)) {
                console.warn("⚠️ Received malformed message structure (expected nested sender). Aborting processing.", message);
                return;
            }
            const targetChatId = type === 'private' ? message.chatId : message.groupId;
            console.log(`Target Chat ID from message: ${targetChatId}`);

            // Update state based on whether the message is for the currently selected chat
            // Use functional form of setSelectedChat to get the latest state value for comparison
            setSelectedChat(currentSelectedChat => {
                console.log(`Selected Chat State Check: Currently selected chat ID = ${currentSelectedChat?.id}`);

                if (currentSelectedChat && targetChatId === currentSelectedChat.id) {
                    // Message belongs to the currently viewed chat
                    console.log(`✅ Message ${message.id} matches selected chat ${currentSelectedChat.id}. Attempting UI update.`);
                    setMessages((prevMessages) => {
                        console.log(`🔵 Inside setMessages updater for message ${message.id}. Previous message count: ${prevMessages.length}`);
                        // Avoid adding duplicate messages (e.g., if received shortly after optimistic update)
                        if (prevMessages.some(m => m.id === message.id)) {
                            console.warn(`Duplicate message ID ${message.id} prevented.`);
                            return prevMessages;
                        }
                        console.log(`Adding message ${message.id} to state.`);
                        return [...prevMessages, message]; // Append the new message
                    });
                } else {
                    // Message is for a different chat, update the sidebar indicator
                    console.log(`Message ${message.id} is for ${type} chat ${targetChatId}, not the selected chat (${currentSelectedChat?.id}). Updating sidebar.`);
                    const listUpdater = type === 'private' ? setPrivateChats : setGroupChats;
                    // Mark the relevant chat list item as having unread messages
                    listUpdater(prevChats => prevChats.map(chat =>
                        chat.id === targetChatId
                          ? { ...chat, hasUnread: true } // Add/update unread flag
                          : chat
                    ));
                }
                // Return the state itself in the functional update (required)
                return currentSelectedChat;
            }); // End functional update for logging selectedChat
        }; // End handleIncomingMessage

        // Attach listeners for real-time messages from the server
        newSocket.on('receive_private_message', (message) => handleIncomingMessage(message, 'private'));
        newSocket.on('receive_group_message', (message) => handleIncomingMessage(message, 'group'));

        // --- Component Unmount Cleanup ---
        return () => {
            console.log('🧹 Cleaning up socket connection.');
            // Remove listeners and disconnect socket to prevent memory leaks
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('connect_error');
            newSocket.off('session_info');
            newSocket.off('receive_private_message');
            newSocket.off('receive_group_message');
            newSocket.disconnect();
            // Clear state associated with the connection
            setSocket(null);
            setIsConnected(false);
            setCurrentUserId(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this effect runs only once on mount

    // --- Data Fetching Functions ---
    // Fetches the user's chat lists (private and group)
    const handleGetUserChats = useCallback((sock) => { // Accepts socket instance as argument
        if (!sock || !sock.connected) {
            addUiError('Cannot fetch chats: Not connected.');
            console.error("handleGetUserChats called but socket not ready.");
            return;
        }
        console.log('💬 Requesting user chats...');
        setIsLoadingChats(true);
        clearError(); // Clear previous errors before new request
        sock.emit('get_user_chats', null, (response) => { // No payload needed
            console.log('📬 Received user chats response:', response);
            setIsLoadingChats(false);
            if (response.error) {
                addUiError(`Error fetching chats: ${response.error}`);
                setPrivateChats([]); setGroupChats([]); // Clear lists on error
            } else {
                // Process successful response
                const pChats = response.private || [];
                const gChats = response.group || [];
                console.log(`Processing ${pChats.length} private, ${gChats.length} group chats.`);
                // ** IMPORTANT: Ensure backend provides `other_user` details within each private chat object **
                setPrivateChats(pChats);
                setGroupChats(gChats);
                if (pChats.length === 0 && gChats.length === 0) {
                    console.warn("No chats were fetched from backend. User might have no chats.");
                }
            }
        });
    }, []); // useCallback with empty dependencies as socket is passed directly

    // Fetches historical messages for the currently selected chat
    const fetchMessagesForChat = useCallback((chat) => {
        if (!socket || !isConnected || !chat || !chat.id) {
             console.warn("fetchMessagesForChat prerequisites not met", { socket, isConnected, chat });
             return;
        }

        // Determine event name and payload based on chat type
        const eventName = chat.type === 'private' ? 'get_private_chat_messages' : 'get_group_chat_messages';
        const payload = chat.type === 'private' ? { chatId: chat.id } : { groupId: chat.id };

        console.log(`💬 Requesting messages for ${chat.type} chat: ${chat.id}`);
        setIsLoadingMessages(true);
        setMessages([]); // Clear previous messages before fetching new ones
        clearError();

        socket.emit(eventName, payload, (response) => {
            console.log(`📬 Received messages for ${chat.type} ${chat.id}:`, response);
            setIsLoadingMessages(false);
            if (response.error) {
                addUiError(`Error fetching messages: ${response.error}`);
                setMessages([]);
            } else {
                 // Ensure response.messages is an array and update state
                const fetchedMessages = Array.isArray(response.messages) ? response.messages : [];
                setMessages(fetchedMessages);
                 if (fetchedMessages.length === 0) {
                     console.log(`No messages found for chat ${chat.id}.`);
                 }
            }
        });
    }, [socket, isConnected]); // Depends on socket connection status

    // --- Event Handlers ---
    // Handles clicking on a chat in the sidebar
    const handleSelectChat = (chat) => {
        // Prevent re-selecting the same chat or selecting while messages are loading
        if (selectedChat?.id === chat.id || isLoadingMessages) return;
        console.log('Selected chat:', chat);

        // Clear the 'unread' indicator for the selected chat
        const listUpdater = chat.type === 'private' ? setPrivateChats : setGroupChats;
        listUpdater(prevChats => prevChats.map(c =>
            c.id === chat.id ? { ...c, hasUnread: false } : c
        ));

        setSelectedChat(chat); // Update the selected chat state
        fetchMessagesForChat(chat); // Fetch messages for this chat
    };

    // Handles submitting the message input form
    const handleSendMessage = (e) => {
        e.preventDefault(); // Prevent default form submission
        // Validate prerequisites for sending a message
        if (!socket || !isConnected || !selectedChat || !newMessageContent.trim() || !currentUserId) {
            addUiError('Cannot send message. Connect, select chat, type, ensure session is active.');
            return;
        }

        const content = newMessageContent.trim(); // Get and trim message content
        // Determine event name and payload based on selected chat type
        const eventName = selectedChat.type === 'private' ? 'send_private_message' : 'send_group_message';
        const payload = selectedChat.type === 'private'
            ? { chatId: selectedChat.id, content: content }
            : { groupId: selectedChat.id, content: content };

        console.log(`🚀 Sending message via ${eventName}:`, payload);
        clearError(); // Clear any previous errors
        setNewMessageContent(''); // Clear the input field immediately

        // --- OPTIMISTIC UI UPDATE ---
        // Create a temporary message object to display instantly
        const tempId = `temp_${Date.now()}`; // Unique temporary ID
        const optimisticMessage = {
            id: tempId,
            content: content,
            senderId: currentUserId, // Assume sender is current user
            sender: {                // Nested sender object structure
                id: currentUserId,
                username: 'You',     // Placeholder - UI relies on 'isOwnMessage'
                avatar_url: null     // Placeholder - Could fetch user data if needed
            },
            // Assign appropriate chat/group ID
            chatId: selectedChat.type === 'private' ? selectedChat.id : undefined,
            groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
            timestamp: new Date().toISOString(), // Use current time for optimistic display
            type: 'text', // Assume text message
            isOptimistic: true // Flag for potential styling or identification
        };

        // Add the optimistic message to the state
        setMessages(prevMessages => [...prevMessages, optimisticMessage]);
        console.log(`✨ Optimistically added message ${tempId}`);

        // --- EMIT MESSAGE TO SERVER ---
        socket.emit(eventName, payload, (response) => { // Send the message and wait for callback
            console.log('✉️ Send message response:', response); // Log server acknowledgment

            if (response.error) {
                // Handle send failure
                addUiError(`Failed to send message: ${response.error}`);
                // Remove the optimistic message if the server rejected it
                setMessages(prevMessages => prevMessages.filter(m => m.id !== tempId));
                // Optional: Restore message content to input field?
                // setNewMessageContent(content);
            } else {
                // Handle send success
                console.log(`Message ${response.messageId} acknowledged by server at ${response.timestamp}.`);
                // Update the optimistic message with the real ID and timestamp from the server
                setMessages(prevMessages => prevMessages.map(msg =>
                    msg.id === tempId
                      ? { ...msg, id: response.messageId, timestamp: response.timestamp, isOptimistic: false } // Update key fields
                      : msg
                  ));
                console.log(`✅ Replaced optimistic message ${tempId} with confirmed ${response.messageId}`);
            }
        });
    }; // --- END handleSendMessage ---


    // --- Component Rendering (JSX) ---
    return (
        <div className="flex h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">

            {/* Sidebar Section */}
            <aside className="w-1/4 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
                {/* Sidebar Header */}
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h1 className="text-xl font-bold mb-1">Messenger</h1>
                    {/* Connection Status Indicator */}
                    <p className={`text-xs font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                        Status: {isConnected ? 'Connected' : 'Disconnected'}
                    </p>
                     {/* Display partial User ID if available */}
                     {currentUserId && <p className="text-xs text-gray-500 dark:text-gray-400">Your ID: {currentUserId.substring(0,8)}...</p>}
                </header>

                {/* Chat Lists Container */}
                <div className="flex-grow overflow-y-auto">
                    {/* Loading Indicator */}
                    {isLoadingChats && <p className="p-4 text-center text-gray-500 dark:text-gray-400">Loading chats...</p>}

                    {/* Group Chat List */}
                    <section className="p-2">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1 uppercase tracking-wide">Groups</h2>
                        {/* Display message if no groups and not loading */}
                        {groupChats.length === 0 && !isLoadingChats && <p className="px-2 text-xs text-gray-400 italic">No groups found.</p>}
                        <ul>
                            {/* Map over group chats to create list items */}
                            {groupChats.map((chat) => (
                                <li key={chat.id}
                                    onClick={() => handleSelectChat({ ...chat, type: 'group', name: chat.name })} // Set selected chat on click
                                    className={`p-2 flex justify-between items-center rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedChat?.id === chat.id ? 'bg-blue-100 dark:bg-blue-900 font-semibold' : ''}`} // Highlight selected chat
                                    title={chat.name} // Tooltip for full name
                                >
                                    {/* Display chat name, add bold if unread */}
                                    <span className={`truncate ${chat.hasUnread ? 'font-bold' : ''}`}>{chat.name || `Group ${chat.id.substring(0, 6)}`}</span>
                                    {/* Display blue dot if chat has unread messages */}
                                    {chat.hasUnread && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Private Chat List */}
                    <section className="p-2 border-t border-gray-200 dark:border-gray-700">
                         <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1 uppercase tracking-wide">Direct Messages</h2>
                         {/* Display message if no private chats and not loading */}
                         {privateChats.length === 0 && !isLoadingChats && <p className="px-2 text-xs text-gray-400 italic">No private chats found.</p>}
                         <ul>
                           {/* Map over private chats */}
                           {privateChats.map((chat) => {
                             // ** Extract other user's details safely **
                             // ** Requires backend to send `other_user: { id, username, avatar_url }` **
                             const otherUser = chat.other_user;
                             const chatName = otherUser?.username || `User ${otherUser?.id?.substring(0, 6) || chat.id.substring(0,6)}`; // Fallback naming
                             return (
                               <li key={chat.id}
                                 onClick={() => handleSelectChat({ ...chat, type: 'private', name: chatName })}
                                 className={`p-2 flex justify-between items-center rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedChat?.id === chat.id ? 'bg-blue-100 dark:bg-blue-900 font-semibold' : ''}`}
                                 title={chatName}
                               >
                                    <span className={`truncate ${chat.hasUnread ? 'font-bold' : ''}`}>{chatName}</span>
                                    {chat.hasUnread && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>}
                               </li>
                             );
                           })}
                         </ul>
                       </section>
                </div>
            </aside>

            {/* Main Chat Area Section */}
            <main className="w-3/4 h-full flex flex-col bg-gray-50 dark:bg-gray-850">
                {/* Show placeholder if no chat is selected */}
                {!selectedChat ? (
                    <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <p className="text-center">Select a chat from the sidebar<br />to start messaging.</p>
                    </div>
                ) : (
                    // Display chat content if a chat is selected
                    <>
                        {/* Chat Header */}
                        <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                            <h2 className="text-lg font-semibold truncate" title={selectedChat.name}>{selectedChat.name}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedChat.type === 'group' ? 'Group Chat' : 'Private Chat'}</p>
                        </header>

                        {/* Messages Display Area */}
                        <div className="flex-grow overflow-y-auto p-4 space-y-4"> {/* Increased space-y */}
                           {/* ... loading and no messages indicators ... */}

                           {messages.map((msg) => {
                             const isOwnMessage = msg.senderId === currentUserId;
                             // Safely access sender details from nested object
                             const senderUsername = msg.sender?.username || 'Unknown User';
                             const senderAvatar = msg.sender?.avatar_url; // Use the avatar URL

                             if (!msg.id) {
                                 console.warn("Rendering message with missing ID:", msg);
                                 return null;
                             }

                             return (
                               // Each message row uses flexbox
                               <div key={msg.id} className={`flex items-start gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                {/* --- AVATAR (Only for messages from others) --- */}
                                {!isOwnMessage && (
                                    <img
                                        src={senderAvatar || 'https://res.cloudinary.com/dydpguips/image/upload/v1735813189/profile-user-svgrepo-com_zflps6.svg'} // Use sender's avatar OR a default one
                                        alt={senderUsername}
                                        className="w-8 h-8 rounded-full flex-shrink-0" // Style the avatar
                                        onError={(e) => { // Optional: Handle broken images
                                            e.target.onerror = null; // Prevent infinite loop
                                            e.target.src = 'https://res.cloudinary.com/dydpguips/image/upload/v1735813189/profile-user-svgrepo-com_zflps6.svg'; // Fallback to default
                                        }}
                                    />
                                )}

                                 {/* --- Message Bubble and Content --- */}
                                 <div className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-lg shadow-md ${msg.isOptimistic ? 'opacity-70' : ''} ${isOwnMessage
                                     ? 'bg-blue-600 text-white order-last' // 'order-last' not needed if avatar is only on left
                                     : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                   }`}
                                 >
                                   {/* Display sender's name above message if it's a group chat and not your own message */}
                                   {!isOwnMessage && selectedChat.type === 'group' && (
                                     <p className="text-xs font-semibold mb-1 text-indigo-600 dark:text-indigo-400">
                                         {senderUsername}
                                     </p>
                                   )}
                                   {/* Display message content */}
                                   <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                   {/* Display message timestamp */}
                                   <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'} text-right`}>
                                     {formatTimestamp(msg.timestamp)} {/* Use 'timestamp' field */}
                                   </p>
                                 </div>

                                 {/* Placeholder for own avatar if needed */}
                                 {/* {isOwnMessage && <div className="w-8 h-8"></div>} */}

                               </div> // End flex message row
                             );
                           })}
                           <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
                        </div>

                        {/* Error Display Area */}
                        {error && (
                            <div className="p-2 bg-red-100 border-t border-red-300 text-red-800 text-sm flex justify-between items-center flex-shrink-0" role="alert">
                                <span><span className="font-bold">Error:</span> {error}</span>
                                {/* Button to clear the error message */}
                                <button onClick={clearError} className="font-bold text-red-600 hover:text-red-800 ml-2 p-1 leading-none rounded-full focus:outline-none focus:ring-1 focus:ring-red-500" aria-label="Dismiss error">✕</button>
                            </div>
                        )}

                        {/* Message Input Form */}
                        <footer className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            {/* Text input field */}
                            <input
                              type="text"
                              placeholder="Type your message..."
                              value={newMessageContent}
                              onChange={(e) => setNewMessageContent(e.target.value)}
                              className="flex-grow px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:border-blue-500" // Improved focus style
                              disabled={!isConnected || isLoadingMessages} // Disable input when disconnected or loading
                              autoFocus // Automatically focus input when a chat is selected
                              autoComplete="off"
                            />
                            {/* Send button */}
                            <button
                              type="submit"
                              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800" // Improved focus style
                              disabled={!isConnected || isLoadingMessages || !newMessageContent.trim()} // Disable button based on state
                            >
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