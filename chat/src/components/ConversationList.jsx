import React from "react"
import { currentUser } from "../data/data"

export default function ConversationList({ conversations, activeConversationId, onSelectConversation }) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-1">
      <div className="space-y-1.5">
        {conversations.map((conversation) => {
          const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id)
          const isActive = activeConversationId === conversation.id

          return (
            <div
              key={conversation.id}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors rounded-lg mx-2 ${
                isActive 
                  ? 'bg-primary/10 border-l-4 border-primary'
                  : 'hover:bg-secondary/30'
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={otherParticipant?.avatar || '/default-avatar.png'}
                  alt={otherParticipant?.name}
                  className="w-10 h-10 rounded-full object-cover border border-muted"
                />
                {conversation.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <h3 className={`font-medium truncate ${
                    isActive ? 'text-primary' : 'text-foreground'
                  }`}>
                    {otherParticipant?.name}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {conversation.lastMessage?.timestamp}
                  </span>
                </div>
                <p className={`text-sm truncate ${
                  conversation.unreadCount > 0 
                    ? 'font-medium text-foreground' 
                    : 'text-muted-foreground'
                }`}>
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}