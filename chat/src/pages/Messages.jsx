import {useEffect, useState} from "react"
import { conversations, currentUser } from "../data/data"
import ThemeToggle from "../components/ThemeToggle"
import ConversationList from "../components/ConversationList"
import MessageDisplay from "../components/MessageDisplay"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs"

export default function Messages() {
  const [activeConversation, setActiveConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setNewMessage("")
  }
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/users/me', {
          credentials: 'include', // Important for cookies
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);


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
                <ConversationList
                    conversations={conversations}
                    activeConversationId={activeConversation.id}
                    onSelectConversation={(conversation) => setActiveConversation(conversation)}
                />
              </TabsContent>
              <TabsContent value="people" className="mt-0">
                <ConversationList
                    conversations={conversations.filter((c) => c.type === "individual")}
                    activeConversationId={activeConversation.id}
                    onSelectConversation={(conversation) => setActiveConversation(conversation)}
                />
              </TabsContent>
              <TabsContent value="groups" className="mt-0">
                <ConversationList
                    conversations={conversations.filter((c) => c.type === "group")}
                    activeConversationId={activeConversation.id}
                    onSelectConversation={(conversation) => setActiveConversation(conversation)}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Message display */}
          <div className="flex-1 flex flex-col">
            {/* Conversation header */}
            <div className="flex items-center justify-between p-5 border-b card-gradient">
              <div className="flex items-center gap-4">
                <img
                    src={activeConversation.participants.find((p) => p.id !== currentUser.id)?.avatar || ""}
                    alt={activeConversation.participants.find((p) => p.id !== currentUser.id)?.name || ""}
                    width={48}
                    height={48}
                    className="rounded-full"
                />
                <div>
                  <div className="text-subtitle text-lg">
                    {activeConversation.participants.find((p) => p.id !== currentUser.id)?.name}
                  </div>
                  <div className="text-xs text-green-500 flex items-center gap-1.5 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    {activeConversation.participants.find((p) => p.id !== currentUser.id)?.status === "online"
                        ? "Online"
                        : "Offline"}
                  </div>
                </div>
              </div>
              <button className="btn btn-outline">View Profile</button>
            </div>

            {/* Messages */}
            <MessageDisplay
                messages={activeConversation.messages}
                currentUserId={currentUser.id}
                className="p-6 space-y-4 flex-1 overflow-y-auto"
            />

            {/* Message input with file attachment icon */}
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
          </div>
        </div>
      </div>
  )
}