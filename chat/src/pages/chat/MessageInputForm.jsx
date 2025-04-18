import React from 'react';

function MessageInputForm({
    newMessageContent,
    onInputChange,
    onSendMessage,
    onInputBlur, // To handle typing stop on blur
    isConnected,
    isLoadingMessages,
    selectedChat // To know if a chat is selected
}) {
    const isDisabled = !isConnected || isLoadingMessages || !selectedChat || !newMessageContent.trim();

    return (
        <div className="p-4 border-t border-border bg-background">
            <form onSubmit={onSendMessage} className="flex items-center gap-3">
                <input
                    type="text"
                    placeholder={selectedChat ? "Type your message..." : "Select a chat to type..."}
                    value={newMessageContent}
                    onChange={onInputChange}
                    onBlur={onInputBlur}
                    className="flex-1 px-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={!isConnected || isLoadingMessages || !selectedChat}
                    autoFocus // Consider if this is always desired
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    disabled={isDisabled}
                >
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    );
}

export default MessageInputForm;