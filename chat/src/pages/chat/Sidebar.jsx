// src/components/chat/Sidebar.jsx
import React, { useMemo } from 'react'; // Import useMemo
import ChatListItem from './ChatListItem'; // Adjust path

// Default Avatar URLs (needed if not passing from parent, or move to config)
// const DEFAULT_USER_AVATAR_URL = '...';
// const DEFAULT_GROUP_AVATAR_URL = '...';


function Sidebar({
    privateChats,
    groupChats,
    selectedChat,
    onSelectChat,
    isLoadingChats,
    error,
    clearError,
    userStatuses,
    filterType, // Receive filter state
    onFilterChange // Receive filter handler
}) {
    // Note: Search input is structure only here

    // Use useMemo to compute the list of chats to display based on the filter
    const visibleChats = useMemo(() => {
        let chatsToDisplay = [];

        if (filterType === 'private') {
            // Filter: People (Private Chats only)
            // The backend should return private chats already sorted by last message
            chatsToDisplay = privateChats.map(chat => ({ ...chat, type: 'private' })); // Ensure type is present
        } else if (filterType === 'group') {
            // Filter: Groups (Group Chats only)
            // The backend should return group chats already sorted by last message
            chatsToDisplay = groupChats.map(chat => ({ ...chat, type: 'group' })); // Ensure type is present
        } else { // filterType === 'all'
            // Filter: All (Combine both, sort by last message)
            const combined = [
                ...privateChats.map(chat => ({ ...chat, type: 'private' })),
                ...groupChats.map(chat => ({ ...chat, type: 'group' })),
            ];

            // Sort the combined list by last_message_at (descending),
            // falling back to created_at if last_message_at is null
            combined.sort((a, b) => {
                // Backend should provide last_message_at and created_at
                const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : new Date(a.created_at).getTime();
                const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : new Date(b.created_at).getTime();

                // Handle potential invalid dates if necessary (though timestamps should be reliable)
                if (isNaN(timeA)) return 1; // a is invalid, b comes first
                if (isNaN(timeB)) return -1; // b is invalid, a comes first

                return timeB - timeA; // Descending sort (newest last message first)
            });

            chatsToDisplay = combined;
        }

        return chatsToDisplay;

    }, [privateChats, groupChats, filterType]); // Recalculate this list when these dependencies change

    // Helper text for empty state
    const emptyMessage = useMemo(() => {
        if (filterType === 'all') return 'No conversations found.';
        if (filterType === 'private') return 'No direct messages found.';
        if (filterType === 'group') return 'No groups found.';
        return 'Select a filter.'; // Should not happen
    }, [filterType]);


    return (
        <div className="w-full md:w-[380px] lg:w-[420px] border-r border-border flex flex-col bg-background">
            {/* Search Input */}
            <div className="p-4 border-b border-border">
                {/* ... (Search Input JSX) ... */}
                 <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-5 h-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                        </svg>
                    </span>
                    <input
                        type="search"
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-3 m-4 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900 dark:text-red-200">
                    {error}
                    <button onClick={clearError} className="float-right font-bold text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-100">
                        ✕
                    </button>
                </div>
            )}

            {/* Filter Tabs and Conversation List Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Filter Tabs */}
                <div className="grid grid-cols-3 gap-1 px-4 pt-4 border-b border-border">
                    <button
                        className={`px-4 py-2 rounded-t-md text-sm font-medium ${filterType === 'all' ? 'bg-primary text-primary-foreground' : 'text-text-secondary hover:bg-hover'}`}
                        onClick={() => onFilterChange('all')}
                    >All</button>
                    <button
                         className={`px-4 py-2 rounded-t-md text-sm font-medium ${filterType === 'private' ? 'bg-primary text-primary-foreground' : 'text-text-secondary hover:bg-hover'}`}
                         onClick={() => onFilterChange('private')}
                    >People</button>
                    <button
                         className={`px-4 py-2 rounded-t-md text-sm font-medium ${filterType === 'group' ? 'bg-primary text-primary-foreground' : 'text-text-secondary hover:bg-hover'}`}
                         onClick={() => onFilterChange('group')}
                    >Groups</button>
                </div>

                {/* Chat List Area - Render the single visibleChats list */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    {isLoadingChats && <p className="p-4 text-center text-text-secondary text-sm italic">Loading chats...</p>}

                    {/* Show empty message only if not loading and the visible list is empty */}
                    {!isLoadingChats && visibleChats.length === 0 && (
                         <p className="p-4 text-center text-text-secondary text-sm italic">
                           {emptyMessage}
                         </p>
                     )}

                     {/* Render the list of visible chats */}
                    <div className="space-y-1">
                        {/* Map over the single visibleChats array */}
                        {!isLoadingChats && visibleChats.map((chat) => (
                            <ChatListItem
                                key={chat.id} // Key is based on chat/room id
                                chat={chat} // Pass the chat object (includes type, name, avatar_url, other_user_id, last_message_at etc.)
                                isSelected={selectedChat?.id === chat.id}
                                onSelect={onSelectChat}
                                userStatuses={userStatuses}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;