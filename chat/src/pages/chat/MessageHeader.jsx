// src/components/chat/MessageHeader.jsx
import React from 'react';

// --- Default Avatar URLs (needed if not passing from parent) ---
const DEFAULT_USER_AVATAR_URL = 'https://res.cloudinary.com/dydpguips/image/upload/v1735813189/profile-user-svgrepo-com_zflps6.svg';
const DEFAULT_GROUP_AVATAR_URL = 'data:image/png;base64,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';


function MessageHeader({ selectedChat, typingDisplayString, userStatuses }) {
    if (!selectedChat) return null;

    const chatAvatar = selectedChat.type === 'group'
        ? selectedChat.avatar_url || DEFAULT_GROUP_AVATAR_URL
        : selectedChat.avatar_url || DEFAULT_USER_AVATAR_URL;

     const status = selectedChat.type === 'private' && selectedChat.other_user_id ? userStatuses?.[selectedChat.other_user_id] : null;


    return (
         <div className="flex items-center justify-between p-4 border-b border-border bg-background flex-shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={chatAvatar}
                alt={selectedChat.name}
                width={48}
                height={48}
                className="rounded-full object-cover bg-gray-200 dark:bg-gray-600"
                 onError={(e) => { e.target.onerror = null; e.target.src = selectedChat.type === 'group' ? DEFAULT_GROUP_AVATAR_URL : DEFAULT_USER_AVATAR_URL; }}
              />
              <div>
                <div className="font-semibold">{selectedChat.name}</div>
                <div className="text-xs text-text-secondary h-4">
                  {typingDisplayString ? (
                    <span className="italic animate-pulse text-primary">{typingDisplayString}</span>
                  ) : selectedChat.type === 'private' && status ? (
                    status.isOnline ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Online
                      </span>
                    ) : (
                      'Offline'
                    )
                  ) : (
                    'Group Chat' // Default text for groups or if status is missing
                  )}
                </div>
              </div>
            </div>
             {/* Add action buttons here if needed later (e.g., group info) */}
          </div>
    );
}

export default MessageHeader;