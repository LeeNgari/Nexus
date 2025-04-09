import React, { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [privateChats, setPrivateChats] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/users/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Set up socket listeners
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
          // Set the first chat as active if available
          if (res.private?.length > 0) {
            setActiveConversation(mapPrivateChatToConversation(res.private[0]));
          } else if (res.group?.length > 0) {
            setActiveConversation(mapGroupChatToConversation(res.group[0]));
          }
        }
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setConnectionError('Failed to connect. Please refresh the page.');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        setConnectionError('Disconnected from server. Please refresh.');
      }
    });

    // Connect the socket
    socket.connect();

    return () => {
      // Clean up
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    // Send message via socket
    if (activeConversation.type === 'individual') {
      socket.emit('send_private_message', {
        chatId: activeConversation.id,
        content: newMessage
      }, (response) => {
        if (response.error) {
          console.error(response.error);
        } else {
          // Update the conversation with the new message
          setActiveConversation(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: response.messageId,
              senderId: userData.id,
              content: newMessage,
              timestamp: new Date().toISOString()
            }]
          }));
          setNewMessage("");
        }
      });
    } else {
      // Handle group message
      socket.emit('send_group_message', {
        groupId: activeConversation.id,
        content: newMessage
      }, (response) => {
        if (response.error) {
          console.error(response.error);
        } else {
          // Update the conversation with the new message
          setActiveConversation(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: response.messageId,
              senderId: userData.id,
              content: newMessage,
              timestamp: new Date().toISOString()
            }]
          }));
          setNewMessage("");
        }
      });
    }
  };

  // Helper functions to map API data to conversation format
  const mapPrivateChatToConversation = (privateChat) => ({
    id: privateChat.id,
    type: 'individual',
    name: privateChat.partner_username,
    avatar: privateChat.partner_avatar,
    messages: [], // You might need to fetch messages separately
    participants: [
      {
        id: userData.id,
        name: userData.username,
        avatar: userData.avatar_url,
        status: 'online'
      },
      {
        id: privateChat.user1_id === userData.id ? privateChat.user2_id : privateChat.user1_id,
        name: privateChat.partner_username,
        avatar: privateChat.partner_avatar,
        status: 'online' // You might need to get real status
      }
    ]
  });

  const mapGroupChatToConversation = (groupChat) => ({
    id: groupChat.id,
    type: 'group',
    name: groupChat.name,
    messages: [], // You might need to fetch messages separately
    participants: [
      // You might need to fetch group members separately
      {
        id: userData.id,
        name: userData.username,
        avatar: userData.avatar_url,
        status: 'online'
      }
    ]
  });

  const filteredPrivateChats = privateChats.filter(chat =>
      chat.partner_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroupChats = groupChats.filter(chat =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allConversations = [
    ...filteredPrivateChats.map(mapPrivateChatToConversation),
    ...filteredGroupChats.map(mapGroupChatToConversation)
  ];

  return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b">
          <h1 className="text-title text-2xl">Messages</h1>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </button>
              <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3 ml-2">
              {userData ? (
                  <>
                    <img
                        src={userData.avatar_url || ""}
                        alt={userData.username}
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                    <div className="hidden md:block">
                      <div className="text-subtitle">{userData.username}</div>
                      <div className="text-caption">{userData.id}</div>
                    </div>
                  </>
              ) : (
                  <div>Loading user info...</div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Wider conversations sidebar */}
          <div className="w-[420px] border-r overflow-y-auto">
            <div className="p-4">
              <div className="relative">
                <input
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {connectionError && (
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
                  {connectionError}
                </div>
            )}

            <Tabs defaultValue="all" className="px-4">
              <TabsList className="grid grid-cols-3 gap-2 mb-4">
                <TabsTrigger value="all" className="py-2.5">
                  All
                </TabsTrigger>
                <TabsTrigger value="people" className="py-2.5">
                  People
                </TabsTrigger>
                <TabsTrigger value="groups" className="py-2.5">
                  Groups
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-0">
                {allConversations.length === 0 ? (
                    <p className="p-4 text-gray-500">No chats available</p>
                ) : (
                    <ConversationList
                        conversations={allConversations}
                        activeConversationId={activeConversation?.id}
                        onSelectConversation={setActiveConversation}
                    />
                )}
              </TabsContent>
              <TabsContent value="people" className="mt-0">
                {filteredPrivateChats.length === 0 ? (
                    <p className="p-4 text-gray-500">No private chats available</p>
                ) : (
                    <ConversationList
                        conversations={filteredPrivateChats.map(mapPrivateChatToConversation)}
                        activeConversationId={activeConversation?.id}
                        onSelectConversation={setActiveConversation}
                    />
                )}
              </TabsContent>
              <TabsContent value="groups" className="mt-0">
                {filteredGroupChats.length === 0 ? (
                    <p className="p-4 text-gray-500">No group chats available</p>
                ) : (
                    <ConversationList
                        conversations={filteredGroupChats.map(mapGroupChatToConversation)}
                        activeConversationId={activeConversation?.id}
                        onSelectConversation={setActiveConversation}
                    />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Message display */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
                <>
                  {/* Conversation header */}
                  <div className="flex items-center justify-between p-5 border-b card-gradient">
                    <div className="flex items-center gap-4">
                      <img
                          src={activeConversation.type === 'individual' ?
                              activeConversation.participants.find(p => p.id !== userData?.id)?.avatar :
                              activeConversation.avatar || ""}
                          alt={activeConversation.name}
                          width={48}
                          height={48}
                          className="rounded-full"
                      />
                      <div>
                        <div className="text-subtitle text-lg">
                          {activeConversation.name}
                        </div>
                        {activeConversation.type === 'individual' && (
                            <div className="text-xs text-green-500 flex items-center gap-1.5 mt-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                              Online
                            </div>
                        )}
                      </div>
                    </div>
                    <button className="btn btn-outline">View Profile</button>
                  </div>

                  {/* Messages */}
                  <MessageDisplay
                      messages={activeConversation.messages || []}
                      currentUserId={userData?.id}
                      className="p-6 space-y-4 flex-1 overflow-y-auto"
                  />

                  {/* Message input */}
                  <div className="p-5 border-t card-gradient">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <button type="button" className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-5 h-5"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          <path d="M12 10v4"></path>
                          <path d="M10 12h4"></path>
                        </svg>
                      </button>
                      <input
                          placeholder="Type your message here..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-lg input"
                      />
                      <button
                          type="submit"
                          className="btn btn-primary px-5 py-3"
                          disabled={!newMessage.trim()}
                      >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-5 h-5"
                        >
                          <path d="m22 2-7 20-4-9-9-4Z"></path>
                          <path d="M22 2 11 13"></path>
                        </svg>
                      </button>
                    </form>
                  </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-6">
                    <h3 className="text-lg font-medium text-gray-500">No conversation selected</h3>
                    <p className="mt-2 text-sm text-gray-400">
                      Select a chat from the sidebar to start messaging
                    </p>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}