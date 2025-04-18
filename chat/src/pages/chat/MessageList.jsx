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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative">
             {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <p className="text-text-secondary text-sm italic">Loading messages...</p>
              </div>
            )}
            {!isLoading && messages.length === 0 && (
              <p className="text-center text-text-secondary py-4 text-sm italic">No messages in this chat yet.</p>
            )}
            {messages.map((msg) => (
                <MessageItem
                    key={msg.id || `temp-${msg.timestamp}-${msg.senderId}`} // Use temp key for optimistic msgs
                    message={msg}
                    isOwnMessage={msg.senderId === currentUserId}
                    isGroupChat={isGroupChat}
                    // Pass default avatar if needed, or manage within MessageItem
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default MessageList;