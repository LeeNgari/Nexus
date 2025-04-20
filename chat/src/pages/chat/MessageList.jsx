import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem'; // Adjust path

function MessageList({ messages, currentUserId, isLoading, selectedChat }) {
    const messagesEndRef = useRef(null); // Keep the ref logic here or pass from parent

    // Auto Scroll Effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]); // Scroll whenever messages change

    const isGroupChat = selectedChat?.type === 'group';

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading messages...
            </div>
          </div>
        )}
      
        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
            No messages in this chat yet.
          </div>
        )}
      
        {/* Messages list */}
        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id || `temp-${msg.timestamp}-${msg.senderId}`}
              message={msg}
              isOwnMessage={msg.senderId === currentUserId}
            />
          ))}
        </div>
      
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    );
}

export default MessageList;