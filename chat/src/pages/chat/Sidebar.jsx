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
          <div className="w-full md:w-[380px] lg:w-[420px] border-r border-border flex flex-col bg-background h-full">
      {/* Search Input */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 m-4 bg-destructive/10 text-destructive rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-2 p-1 rounded-full hover:bg-destructive/20 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* Filter Tabs and Conversation List Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filter Tabs */}
        <div className="grid grid-cols-3 gap-1 px-4 pt-4 border-b border-border">
          <button
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors relative ${
              filterType === 'all'
                ? 'text-primary bg-primary/10 font-semibold'
                : 'text-muted-foreground hover:bg-accent'
            }`}
            onClick={() => onFilterChange('all')}
          >
            All
            {filterType === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"></span>
            )}
          </button>
          <button
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors relative ${
              filterType === 'private'
                ? 'text-primary bg-primary/10 font-semibold'
                : 'text-muted-foreground hover:bg-accent'
            }`}
            onClick={() => onFilterChange('private')}
          >
            People
            {filterType === 'private' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"></span>
            )}
          </button>
          <button
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors relative ${
              filterType === 'group'
                ? 'text-primary bg-primary/10 font-semibold'
                : 'text-muted-foreground hover:bg-accent'
            }`}
            onClick={() => onFilterChange('group')}
          >
            Groups
            {filterType === 'group' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"></span>
            )}
          </button>
        </div>

        {/* Chat List Area */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isLoadingChats && (
            <div className="p-4 text-center text-muted-foreground text-sm italic">
              <div className="flex justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-primary"
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
                Loading chats...
              </div>
            </div>
          )}

          {!isLoadingChats && visibleChats.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm italic">
              {emptyMessage}
            </div>
          )}

          <div className="space-y-1">
            {!isLoadingChats &&
              visibleChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
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