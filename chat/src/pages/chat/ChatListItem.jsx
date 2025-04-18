// src/components/chat/ChatListItem.jsx
import React from 'react';

// --- Default Avatar URLs ---
const DEFAULT_USER_AVATAR_URL = 'https://res.cloudinary.com/dydpguips/image/upload/v1735813189/profile-user-svgrepo-com_zflps6.svg';
const DEFAULT_GROUP_AVATAR_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJZ4KL1u31N_9XR7fharZZUVOy4aQG0a4dkQ&s';

function ChatListItem({ chat, isSelected, onSelect, userStatuses }) {
    const chatName = chat.type === 'group'
        ? chat.name || `Group ${chat.id.substring(0, 6)}`
        : chat.name || `User ${chat.other_user_id?.substring(0, 6) || chat.id.substring(0, 6)}`;

    const chatAvatar = chat.type === 'group'
        ? chat.avatar_url || DEFAULT_GROUP_AVATAR_URL
        : chat.avatar_url || DEFAULT_USER_AVATAR_URL;

    const status = chat.type === 'private' && chat.other_user_id ? userStatuses?.[chat.other_user_id] : null;

    return (
        <div
            onClick={() => onSelect({ ...chat, type: chat.type, name: chatName })}
            className={`p-2 flex items-center gap-3 rounded-md cursor-pointer hover:bg-hover ${
                isSelected ? 'bg-primary/10 font-semibold' : ''
            }`}
            title={chatName}
        >
            <div className="relative flex-shrink-0">
                <img
                    src={chatAvatar}
                    alt={chatName}
                    className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-600"
                    onError={(e) => { e.target.onerror = null; e.target.src = chat.type === 'group' ? DEFAULT_GROUP_AVATAR_URL : DEFAULT_USER_AVATAR_URL; }}
                />
                {status && (
                    <span
                        className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                            status.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        title={
                            status.isOnline
                                ? 'Online'
                                : `Offline${status.lastActive ? ' - Last seen: ' + new Date(status.lastActive).toLocaleTimeString() : ''}`
                        }
                    ></span>
                )}
            </div>
            <div className="flex-grow overflow-hidden">
                <span className={`block font-medium truncate ${chat.hasUnread ? 'font-bold' : ''}`}>
                    {chatName}
                </span>
            </div>
            {chat.hasUnread && (
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-auto"></span>
            )}
        </div>
    );
}

export default ChatListItem;