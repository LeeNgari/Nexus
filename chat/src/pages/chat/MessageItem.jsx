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
            key={message.id} // Use message.id from the actual message data
            className={`flex items-start gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
        >
            {!isOwnMessage && (
                <img
                    src={senderAvatar || defaultAvatarUrl}
                    alt={senderUsername}
                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover bg-gray-200 dark:bg-gray-600"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatarUrl; }}
                />
            )}
            <div
                className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-lg shadow-sm ${
                    message.isOptimistic ? 'opacity-70' : ''
                } ${
                    isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white dark:bg-gray-700 text-text-primary'
                }`}
            >
                {!isOwnMessage && isGroupChat && (
                    <p className="text-xs font-semibold mb-1 text-indigo-600 dark:text-indigo-400">
                        {senderUsername}
                    </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <p
                    className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-text-secondary'
                    } text-right`}
                >
                    {formatTimestamp(message.timestamp)}
                </p>
            </div>
        </div>
    );
}

export default MessageItem;