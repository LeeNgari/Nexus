import React, { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { io } from 'socket.io-client';
import ThemeToggle from "../components/ThemeToggle";
import ConversationList from "../components/ConversationList";
import MessageDisplay from "../components/MessageDisplay";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs";

// Create socket instance with proper configuration
const socket = io("http://localhost:5000", {
  transports: ['websocket'],
  withCredentials: true,
  autoConnect: false // We'll connect manually after setting up listeners
});

export default function Messages() {
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // Loading for initial user data
  const [error, setError] = useState(null); // Error for initial user data fetch
  const [privateChats, setPrivateChats] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false); // NEW: Loading state for messages
  const [messagesError, setMessagesError] = useState(null); // NEW: Error state for messages fetch

  // --- Helper functions to map API data to conversation format ---
  // Use useCallback to memoize these functions if userData changes often,
  // but it's likely fine without it here unless userData structure is complex.
  const mapPrivateChatToConversation = useCallback((privateChat) => {
    if (!userData) return null; // Guard against userData not being loaded yet
    return {
      id: privateChat.id,
      type: 'individual',
      name: privateChat.partner_username,
      avatar: privateChat.partner_avatar,
      messages: [], // Initialize with empty messages, fetch on select
      participants: [
        {
          id: userData.id,
          name: userData.username,
          avatar: userData.avatar_url,
          status: 'online' // Static for now
        },
        {
          // Determine partner ID correctly
          id: privateChat.user1_id === userData.id ? privateChat.user2_id : privateChat.user1_id,
          name: privateChat.partner_username,
          avatar: privateChat.partner_avatar,
          status: 'online' // Static for now, ideally fetched or updated via presence events
        }
      ]
    };
  }, [userData]); // Depend on userData

  const mapGroupChatToConversation = useCallback((groupChat) => {
    if (!userData) return null; // Guard against userData not being loaded yet
    return {
      id: groupChat.id,
      type: 'group',
      name: groupChat.name,
      avatar: groupChat.avatar_url, // Assuming group chats might have avatars
      messages: [], // Initialize with empty messages, fetch on select
      participants: [
        // Participants would ideally be fetched when the group chat is selected
        // or included in the initial group chat data if not too large.
        // For now, just including the current user.
        {
          id: userData.id,
          name: userData.username,
          avatar: userData.avatar_url,
          status: 'online' // Static for now
        }
        // ... other participants would be added here
      ]
    };
  }, [userData]); // Depend on userData

  // --- Effect for initial setup (User Data & Socket Connection) ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error on refetch attempt
        const response = await fetch('http://localhost:5000/api/users/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user data' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.data || !data.data.id) {
            throw new Error('User data is incomplete.');
        }
        setUserData(data.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // --- Socket Setup ---
    // Ensure we only set up listeners once
    if (!socket.hasListeners('connect')) {
      socket.on('connect', () => {
        console.log('Connected:', socket.id);
        setConnectionError(null);

        // Get initial list of chats *after* connection
        socket.emit('get_user_chats', null, (res) => {
          if (res.error) {
            console.error("Error fetching chats:", res.error);
            setConnectionError(res.error);
            setPrivateChats([]); // Clear chats on error
            setGroupChats([]);
          } else {
            console.log("Received chats:", res);
            setPrivateChats(res.private || []);
            setGroupChats(res.group || []);
            // Don't automatically set active conversation here anymore.
            // Let the user select or handle default selection differently if needed.
            // setActiveConversation(null); // Start with no active conversation
          }
        });
      });

      socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setConnectionError(`Failed to connect to chat server: ${err.message}. Please check if the server is running and refresh.`);
        setActiveConversation(null); // Clear active conversation on connection error
        setPrivateChats([]);
        setGroupChats([]);
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
        setConnectionError('Disconnected from chat server.');
        setActiveConversation(null); // Clear active conversation on disconnect
        // Optionally clear chats or show a different UI state
        // setPrivateChats([]);
        // setGroupChats([]);
      });

       // Listener for receiving new messages (IMPORTANT for real-time updates)
       socket.on('receive_private_message', (messageData) => {
         console.log('Received private message:', messageData);
         // Update the messages if the message belongs to the active conversation
         setActiveConversation(prev => {
           if (prev && prev.type === 'individual' && prev.id === messageData.chatId) {
             // Avoid adding duplicate if it's our own message we just sent
             if (!prev.messages.some(msg => msg.id === messageData.id)) {
               return {
                 ...prev,
                 messages: [...prev.messages, messageData]
               };
             }
           }
           return prev;
         });
         // Optional: Update conversation list preview/unread count
       });

       socket.on('receive_group_message', (messageData) => {
         console.log('Received group message:', messageData);
         setActiveConversation(prev => {
           if (prev && prev.type === 'group' && prev.id === messageData.groupId) {
               // Avoid adding duplicate if it's our own message we just sent
               if (!prev.messages.some(msg => msg.id === messageData.id)) {
                 return {
                   ...prev,
                   messages: [...prev.messages, messageData]
                 };
               }
           }
           return prev;
         });
         // Optional: Update conversation list preview/unread count
       });
    }

    // Connect the socket if not already connecting or connected
    if (!socket.connected && !socket.connecting) {
        socket.connect();
    }

    // --- Cleanup ---
    return () => {
      // Disconnect socket when component unmounts
      // Consider if this is desired behavior - maybe keep connection alive across navigation?
      // For this example, we disconnect on unmount.
      console.log("Messages component unmounting, disconnecting socket.");
      socket.disconnect();
      // Remove specific listeners to avoid memory leaks if the component remounts
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('receive_private_message');
      socket.off('receive_group_message');
      // Note: We don't remove the listeners added inside the 'connect' handler here,
      // as they are implicitly removed on disconnect. If connect logic changes, review this.
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Effect to fetch messages when activeConversation changes ---
  useEffect(() => {
    if (activeConversation && activeConversation.id && socket.connected) {
      console.log(`Workspaceing messages for ${activeConversation.type} chat: ${activeConversation.id}`);
      setMessagesLoading(true); // Set loading state
      setMessagesError(null); // Clear previous errors

      const eventName = activeConversation.type === 'individual'
          ? 'get_private_chat_messages'
          : 'get_group_chat_messages';

      const payload = activeConversation.type === 'individual'
          ? { chatId: activeConversation.id }
          : { groupId: activeConversation.id };

      socket.emit(eventName, payload, (response) => {
        setMessagesLoading(false); // Reset loading state
        if (response.error) {
          console.error(`Error fetching messages for chat ${activeConversation.id}:`, response.error);
          setMessagesError(response.error);
          // Update the active conversation with empty messages on error
          setActiveConversation(prev => prev ? { ...prev, messages: [] } : null);
        } else {
          console.log(`Received messages for chat ${activeConversation.id}:`, response.messages);
          // Update the active conversation with the fetched messages
          setActiveConversation(prev => {
            // Ensure we are still updating the *same* active conversation
            if (prev && prev.id === activeConversation.id) {
              return { ...prev, messages: response.messages || [] };
            }
            return prev; // If active conversation changed again while fetching, ignore old result
          });
        }
      });
    } else {
      // If no active conversation or socket isn't connected, clear messages state
      setMessagesLoading(false);
      setMessagesError(null);
      // Optionally clear messages in the activeConversation object if needed
      // setActiveConversation(prev => prev ? { ...prev, messages: [] } : null);
    }

    // This effect should run when `activeConversation` (specifically its id or type) changes,
    // or when the socket connects (in case a conversation was selected before connection).
  }, [activeConversation?.id, activeConversation?.type, socket.connected]); // Add socket.connected dependency


  // --- Handler to Select a Conversation ---
  const handleSelectConversation = useCallback((conversation) => {
    if (activeConversation?.id !== conversation.id) {
      console.log("Setting active conversation:", conversation);
      setActiveConversation(conversation);
      // Clear the input field when switching conversations
      setNewMessage("");
      // Messages will be fetched by the useEffect hook above
    }
  }, [activeConversation?.id]); // Depend on the current active ID to avoid unnecessary state updates


  // --- Handler to Send Message ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !socket.connected || !userData) return;

    const eventName = activeConversation.type === 'individual'
        ? 'send_private_message'
        : 'send_group_message';

    const payload = activeConversation.type === 'individual'
        ? { chatId: activeConversation.id, content: newMessage }
        : { groupId: activeConversation.id, content: newMessage };

    // Optimistic UI update (optional but improves perceived performance)
    // Create a temporary message ID for the optimistic update
    const tempMessageId = `temp_${Date.now()}`;
    const optimisticMessage = {
        id: tempMessageId, // Use temporary ID
        senderId: userData.id, // Assuming userData has id
        content: newMessage,
        timestamp: new Date().toISOString(),
        // Add sender info if your MessageDisplay needs it
        sender: {
            id: userData.id,
            username: userData.username,
            avatar_url: userData.avatar_url
        }
    };

    setActiveConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, optimisticMessage]
    } : null);

    const originalMessage = newMessage; // Store message before clearing
    setNewMessage(""); // Clear input field immediately

    socket.emit(eventName, payload, (response) => {
        if (response.error) {
            console.error(`Error sending message to ${activeConversation.type} ${activeConversation.id}:`, response.error);
            // Revert optimistic update on error
            setActiveConversation(prev => prev ? {
                ...prev,
                messages: prev.messages.filter(msg => msg.id !== tempMessageId)
            } : null);
            // Optional: Restore message input
            setNewMessage(originalMessage);
            // Optional: Show error to user
            alert(`Failed to send message: ${response.error}`);
        } else {
            console.log('Message sent successfully, server responded:', response);
            // Replace the temporary message with the actual one from the server response
            setActiveConversation(prev => {
                if (!prev) return null;
                const finalMessage = {
                  ...optimisticMessage, // Keep optimistic data
                  id: response.messageId, // Update with the real ID from the server
                  timestamp: response.timestamp || optimisticMessage.timestamp, // Use server timestamp if provided
                };
                return {
                  ...prev,
                  messages: prev.messages.map(msg =>
                    msg.id === tempMessageId ? finalMessage : msg
                  )
                };
            });
            // The 'receive_message' listener should ideally handle adding the final message
            // for other clients, and potentially even for the sender to ensure consistency.
            // If the server doesn't broadcast back to the sender, the replacement logic above is needed.
            // If the server DOES broadcast back, you might get duplicates if both the optimistic
            // update replacement AND the 'receive_message' handler run. Choose one strategy.
            // A common approach: rely on the 'receive_message' event broadcasted by the server
            // (even to the sender) and remove the optimistic message when the real one arrives via the listener.
        }
    });
  };

  // --- Filtering Logic ---
  const filteredPrivateChats = privateChats.filter(chat =>
    chat.partner_username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroupChats = groupChats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Memoize mapped conversations to avoid unnecessary re-renders of ConversationList
  const mappedPrivateConversations = React.useMemo(
      () => filteredPrivateChats.map(mapPrivateChatToConversation).filter(Boolean),
      [filteredPrivateChats, mapPrivateChatToConversation]
  );

  const mappedGroupConversations = React.useMemo(
      () => filteredGroupChats.map(mapGroupChatToConversation).filter(Boolean),
      [filteredGroupChats, mapGroupChatToConversation]
  );

  const allMappedConversations = React.useMemo(
      () => [...mappedPrivateConversations, ...mappedGroupConversations],
      [mappedPrivateConversations, mappedGroupConversations]
  );


  // --- Render Logic ---
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading user data...</div>;
  }

  if (error) {
      return <div className="flex items-center justify-center h-screen text-red-500">Error: {error}</div>;
  }

  // Guard against rendering before user data is loaded (though 'loading' state should handle this)
  if (!userData) {
      return <div className="flex items-center justify-center h-screen">Could not load user information. Please refresh.</div>;
  }


  return (
    <div className="flex flex-col h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <div className="flex items-center gap-4 md:gap-6">
          <ThemeToggle />
           {/* Search and Notifications (Simplified) */}
          <button className="p-2 rounded-full hover:bg-hover focus:outline-none focus:ring-2 focus:ring-primary">
              {/* Search Icon */}
              <svg className="w-5 h-5 text-text-secondary" /* ... props */ >
                  <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>
              </svg>
          </button>
          <button className="relative p-2 rounded-full hover:bg-hover focus:outline-none focus:ring-2 focus:ring-primary">
              {/* Bell Icon */}
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div> {/* Simpler indicator */}
              <svg className="w-5 h-5 text-text-secondary" /* ... props */ >
                 <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /> {/* Simpler Bell */}
              </svg>
          </button>
          {/* User Info */}
          <div className="flex items-center gap-3">
             <img
               src={userData.avatar_url || 'https://via.placeholder.com/40'} // Fallback avatar
               alt={userData.username}
               width={40}
               height={40}
               className="rounded-full border-2 border-primary" // Added subtle border
             />
             <div className="hidden md:block">
               <div className="font-medium text-sm">{userData.username}</div>
               <div className="text-xs text-text-secondary">{userData.email || `ID: ${userData.id}`}</div> {/* Show email or ID */}
             </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-[380px] lg:w-[420px] border-r border-border flex flex-col">
          {/* Search Input */}
          <div className="p-4 border-b border-border">
            <div className="relative">
               <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                 {/* Search Icon */}
                  <svg className="w-5 h-5 text-text-secondary" /* ...props */ >
                     <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>
                  </svg>
               </span>
              <input
                type="search" // Use type="search" for better semantics/potential browser features
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

           {/* Connection Error Display */}
          {connectionError && (
            <div className="p-3 m-4 bg-red-100 text-red-700 rounded-md text-sm">
              {connectionError}
            </div>
          )}

           {/* Tabs and Conversation List */}
           <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden"> {/* Allow tabs content to scroll */}
             <TabsList className="grid grid-cols-3 gap-1 px-4 pt-4">
               <TabsTrigger value="all">All</TabsTrigger>
               <TabsTrigger value="people">People</TabsTrigger>
               <TabsTrigger value="groups">Groups</TabsTrigger>
             </TabsList>
              {/* Wrap TabsContent in a div that handles scrolling */}
             <div className="flex-1 overflow-y-auto px-2 py-2"> {/* Add padding and scroll */}
                 <TabsContent value="all" className="mt-0 space-y-1"> {/* Add spacing between items */}
                   {allMappedConversations.length === 0 && !connectionError ? (
                     <p className="p-4 text-center text-text-secondary">No chats found.</p>
                   ) : (
                     <ConversationList
                       conversations={allMappedConversations}
                       activeConversationId={activeConversation?.id}
                       onSelectConversation={handleSelectConversation} // Use the memoized handler
                     />
                   )}
                 </TabsContent>
                 <TabsContent value="people" className="mt-0 space-y-1">
                   {mappedPrivateConversations.length === 0 && !connectionError ? (
                     <p className="p-4 text-center text-text-secondary">No private chats found.</p>
                   ) : (
                     <ConversationList
                       conversations={mappedPrivateConversations}
                       activeConversationId={activeConversation?.id}
                       onSelectConversation={handleSelectConversation}
                     />
                   )}
                 </TabsContent>
                 <TabsContent value="groups" className="mt-0 space-y-1">
                   {mappedGroupConversations.length === 0 && !connectionError ? (
                     <p className="p-4 text-center text-text-secondary">No group chats found.</p>
                   ) : (
                     <ConversationList
                       conversations={mappedGroupConversations}
                       activeConversationId={activeConversation?.id}
                       onSelectConversation={handleSelectConversation}
                     />
                   )}
                 </TabsContent>
             </div>
           </Tabs>
        </div>

        {/* Message Display Area */}
        <div className="flex-1 flex flex-col bg-muted/30"> {/* Subtle background for chat area */}
          {activeConversation ? (
            <>
              {/* Conversation Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-background"> {/* Use background for header consistency */}
                <div className="flex items-center gap-3">
                  <img
                     src={activeConversation.type === 'individual' ?
                        activeConversation.participants.find(p => p.id !== userData?.id)?.avatar || 'https://via.placeholder.com/48' : // Fallback avatar
                        activeConversation.avatar || 'https://via.placeholder.com/48'} // Fallback avatar
                     alt={activeConversation.name}
                     width={48}
                     height={48}
                     className="rounded-full"
                  />
                  <div>
                    <div className="font-semibold">{activeConversation.name}</div>
                    {/* Status/Participant Info (Simplified) */}
                    {activeConversation.type === 'individual' && (
                      <div className="text-xs text-green-500 flex items-center gap-1 mt-0.5">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {/* Pulse for online */}
                         Online
                      </div>
                    )}
                     {activeConversation.type === 'group' && (
                        <div className="text-xs text-text-secondary mt-0.5">
                          {/* Placeholder for participant count or members list */}
                          {activeConversation.participants.length}+ members
                        </div>
                    )}
                  </div>
                </div>
                <button className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-hover focus:outline-none focus:ring-2 focus:ring-primary">
                    View Info {/* Changed text for clarity */}
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative"> {/* Added relative positioning */}
                {messagesLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                        <p className="text-text-secondary">Loading messages...</p> {/* Loading indicator */}
                    </div>
                )}
                {messagesError && (
                    <div className="p-4 text-center text-red-500">
                        Error loading messages: {messagesError}
                    </div>
                )}
                {!messagesLoading && !messagesError && (
                    <MessageDisplay
                        messages={activeConversation.messages || []}
                        currentUserId={userData?.id}
                    />
                )}
              </div>


              {/* Message Input Area */}
              <div className="p-4 border-t border-border bg-background"> {/* Use background for input consistency */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <button type="button" title="Attach file (dummy)" className="p-2 rounded-full hover:bg-hover text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary">
                     {/* Attach Icon (Example) */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                      </svg>
                  </button>
                  <input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={messagesLoading || !!connectionError} // Disable input while loading messages or disconnected
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    disabled={!newMessage.trim() || messagesLoading || !!connectionError} // Also disable send button
                  >
                      {/* Send Icon */}
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                     </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Placeholder when no conversation is selected
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-secondary">
                {/* Illustration or Icon */}
                 <svg className="w-16 h-16 mb-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.04 8.25-7.625 8.25-1.414 0-2.743-.372-3.875-.968a.375.375 0 0 1-.112-.477m-.283-3.546a.375.375 0 0 0-.112-.477m0 0c-.399-.285-.84-.487-1.312-.613a4.5 4.5 0 0 1 0-7.752c.472-.126.913-.328 1.313-.612m3.875 9.24a.375.375 0 0 1 .112.477m0 0a4.496 4.496 0 0 0 4.125-3.234m0 0a4.496 4.496 0 0 0 0-6.468m0 0a4.504 4.504 0 0 0-4.125-3.234m0 0a.375.375 0 0 0-.112.477m-.283 3.546a.375.375 0 0 1-.112.477" />
                 </svg>
              <h3 className="text-lg font-medium text-text-primary">Select a conversation</h3>
              <p className="mt-1 text-sm">Choose from your existing conversations or start a new one.</p>
               {connectionError && <p className="mt-4 text-red-500">{connectionError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}