import { useState } from "react"
import { conversations, currentUser } from "../data/data"
import ThemeToggle from "../components/ThemeToggle"
import ConversationList from "../components/ConversationList"
import MessageDisplay from "../components/MessageDisplay"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs"

export default function Messages() {
  const [activeConversation, setActiveConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    // In a real app, we would send this to a backend
    // For this demo, we'll just clear the input
    setNewMessage("")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-title">Messages</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="relative">
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
          </div>
          <div className="relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
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
          </div>
          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatar || ""}
              alt={currentUser.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <div className="text-subtitle">{currentUser.name}</div>
              <div className="text-caption">ID: 45322</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations sidebar */}
        <div className="w-80 border-r overflow-y-auto">
          <div className="p-3">
            <div className="relative">
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
                className="absolute left-3 top-1/2 transform text-muted-foreground w-4 h-4"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input
                placeholder="Search"
                className="input pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all" className="flex-1">
                ALL
              </TabsTrigger>
              <TabsTrigger value="people" className="flex-1">
                PEOPLE
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex-1">
                GROUPS
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversation.id}
                onSelectConversation={(conversation) => setActiveConversation(conversation)}
              />
            </TabsContent>
            <TabsContent value="people">
              <ConversationList
                conversations={conversations.filter((c) => c.type === "individual")}
                activeConversationId={activeConversation.id}
                onSelectConversation={(conversation) => setActiveConversation(conversation)}
              />
            </TabsContent>
            <TabsContent value="groups">
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
          <div className="flex items-center justify-between p-4 border-b card-gradient">
            <div className="flex items-center gap-3">
              <img
                src={activeConversation.participants.find((p) => p.id !== currentUser.id)?.avatar || ""}
                alt={activeConversation.participants.find((p) => p.id !== currentUser.id)?.name || ""}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <div className="text-subtitle">
                  {activeConversation.participants.find((p) => p.id !== currentUser.id)?.name}
                </div>
                <div className="text-xs text-green-500">
                  {activeConversation.participants.find((p) => p.id !== currentUser.id)?.status === "online"
                    ? "Online"
                    : ""}
                </div>
              </div>
            </div>
            <button className="btn btn-outline">View Profile</button>
          </div>

          {/* Messages */}
          <MessageDisplay messages={activeConversation.messages} currentUserId={currentUser.id} />

          {/* Message input */}
          <div className="p-4 border-t mt-auto card-gradient">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="input flex-1"
              />
              <button type="submit" className="btn btn-primary btn-icon">
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
                  className="w-4 h-4"
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

