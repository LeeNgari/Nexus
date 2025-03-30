import React from "react"

export default function MessageDisplay({ messages, currentUserId }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
      {messages.map((message) => {
        const isCurrentUser = message.senderId === currentUserId

        return (
          <div 
            key={message.id} 
            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl p-4 transition-all duration-150 ${
                isCurrentUser
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 dark:shadow-primary/30"
                  : "bg-secondary text-secondary-foreground shadow-md shadow-secondary/20 dark:shadow-secondary/30"
              } ${
                isCurrentUser 
                  ? "rounded-br-none dark:bg-primary/90" 
                  : "rounded-bl-none dark:bg-secondary/80"
              }`}
            >
              {/* Message Content */}
              <div className="text-base font-medium break-words">
                {message.content}
              </div>
              
              {/* Image Attachment */}
              {message.image && (
                <div className="mt-3 rounded-lg overflow-hidden border border-border/50">
                  <img 
                    src={message.image} 
                    alt="Shared content" 
                    className="w-full h-auto max-h-80 object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Reactions */}
              {message.reactions?.length > 0 && (
                <div className={`mt-2 flex ${isCurrentUser ? 'justify-end' : 'justify-start'} gap-1.5`}>
                  {message.reactions.map((reaction, index) => (
                    <div 
                      key={index} 
                      className={`rounded-full px-2 py-1 text-xs flex items-center ${
                        isCurrentUser 
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-secondary-foreground/20 text-secondary-foreground'
                      }`}
                    >
                      <span className="mr-1">{reaction.type}</span>
                      <span>{reaction.count}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Timestamp */}
              <div className={`text-xs mt-2 flex ${
                isCurrentUser ? 'justify-end' : 'justify-start'
              } ${
                isCurrentUser 
                  ? 'text-primary-foreground/80 dark:text-primary-foreground/90' 
                  : 'text-secondary-foreground/80 dark:text-secondary-foreground/90'
              }`}>
                {message.timestamp}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}