import React from 'react';
import MessageHeader from './MessageHeader'; // Adjust path
import MessageList from './MessageList';     // Adjust path
import MessageInputForm from './MessageInputForm'; // Adjust path

function MessageArea({
    selectedChat,
    messages,
    isLoadingMessages,
    newMessageContent,
    setNewMessageContent, // Pass setter up
    handleSendMessage,
    handleInputChange,
    handleTypingStop, // Pass typing stop up
    typingDisplayString,
    userStatuses, // Pass user statuses up
    currentUserId, // Pass current user ID up
    isConnected // Pass connection status up
}) {
    return (
         <div className="flex-1 flex flex-col bg-muted/30">
              {!selectedChat ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-secondary">
                    <svg
                        className="w-16 h-16 mb-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.04 8.25-7.625 8.25-1.414 0-2.743-.372-3.875-.968a.375.375 0 0 1-.112-.477m-.283-3.546a.375.375 0 0 0-.112-.477m0 0c-.399-.285-.84-.487-1.312-.613a4.5 4.5 0 0 1 0-7.752c.472-.126.913-.328 1.313-.612m3.875 9.24a.375.375 0 0 1 .112.477m0 0a4.496 4.496 0 0 0 4.125-3.234m0 0a4.496 4.496 0 0 0 0-6.468m0 0a4.504 4.504 0 0 0-4.125-3.234m0 0a.375.375 0 0 0-.112.477m-.283 3.546a.375.375 0 0 1-.112.477"
                    />
                    </svg>
                    <h3 className="text-lg font-medium text-text-primary">Select a conversation</h3>
                    <p className="mt-1 text-sm">Choose from your existing conversations or start a new one.</p>
                </div>
            ) : (
                <>
                     <MessageHeader
                        selectedChat={selectedChat}
                        typingDisplayString={typingDisplayString}
                        userStatuses={userStatuses}
                    />
                     <MessageList
                        messages={messages}
                        currentUserId={currentUserId}
                        isLoading={isLoadingMessages}
                        selectedChat={selectedChat} // Pass selectedChat for group/private check in MessageItem
                    />
                    <MessageInputForm
                        newMessageContent={newMessageContent}
                        onInputChange={handleInputChange}
                        onSendMessage={handleSendMessage}
                        onInputBlur={handleTypingStop} // Add blur handler
                        isConnected={isConnected}
                        isLoadingMessages={isLoadingMessages}
                        selectedChat={selectedChat}
                    />
                </>
            )}
         </div>
    );
}

export default MessageArea;