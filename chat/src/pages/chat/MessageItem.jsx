// src/components/chat/MessageItem.jsx
import React from 'react';
import { formatTimestamp } from "./utils/formatTimestamp"; // Adjust the import path as needed

// --- Default Avatar URL (needed if not passing from parent) ---
const DEFAULT_USER_AVATAR_URL = 'https://res.cloudinary.com/dydpguips/image/upload/v1735813189/profile-user-svgrepo-com_zflps6.svg';

function MessageItem({ message, isOwnMessage, isGroupChat, defaultAvatarUrl = DEFAULT_USER_AVATAR_URL }) {
     if (!message?.id) return null; // Basic check for malformed message

    const senderUsername = message.sender?.username || 'Unknown User';
    const senderAvatar = message.sender?.avatar_url;

    return (
        <div
  key={message.id}
  className={`flex items-start gap-2.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
>
  {!isOwnMessage && (
    <img
      src={senderAvatar || defaultAvatarUrl}
      alt={senderUsername}
      className="w-9 h-9 rounded-full flex-shrink-0 object-cover bg-muted border border-border"
      onError={(e) => { 
        e.target.onerror = null; 
        e.target.src = defaultAvatarUrl; 
      }}
    />
  )}

  <div
    className={`relative max-w-[min(80%,28rem)] px-4 py-2 rounded-2xl shadow-sm transition-opacity ${
      message.isOptimistic ? 'opacity-80' : 'opacity-100'
    } ${
      isOwnMessage
        ? 'bg-primary text-primary-foreground rounded-br-none'
        : 'bg-card text-foreground rounded-bl-none border border-border'
    }`}
  >
    {/* Sender name for group chats */}
    {!isOwnMessage && isGroupChat && (
      <p className="text-xs font-medium mb-1 text-muted-foreground">
        {senderUsername}
      </p>
    )}

    {/* Message content */}
    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
      {message.content}
    </p>

    {/* Timestamp */}
    <div className={`flex justify-end items-center mt-1 gap-1 ${
      isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'
    }`}>
      <span className="text-xs">
        {formatTimestamp(message.timestamp)}
      </span>
      {isOwnMessage && (
        <svg 
          className={`w-3 h-3 ${message.status === 'read' ? 'text-blue-300' : ''}`}
          fill="none" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M18 7l-8 8-4-4-6 6"
          />
        </svg>
      )}
    </div>

    {/* Speech bubble tail */}
    <div className={`absolute w-3 h-3 -bottom-3 ${
      isOwnMessage 
        ? 'right-0 bg-primary clip-path-triangle-right' 
        : 'left-0 bg-card clip-path-triangle-left'
    }`}></div>
  </div>
</div>
    );
}

export default MessageItem;