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
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
      <div className="relative mb-6">
        <svg
          className="w-20 h-20 text-muted-foreground/50"
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
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-primary animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Select a conversation
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        Choose from your existing conversations or start a new one to begin messaging.
      </p>
      <button
        onClick={() => onNewConversation()} // Assuming you have this handler
        className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
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
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
        New Conversation
      </button>
    </div>
  ) : (
    <div className="flex flex-col h-full">
      <MessageHeader
        selectedChat={selectedChat}
        typingDisplayString={typingDisplayString}
        userStatuses={userStatuses}
        onBack={() => setSelectedChat(null)} // Optional back button functionality
      />
      
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoadingMessages}
          selectedChat={selectedChat}
        />
      </div>
      
      <div className="border-t border-border p-4">
        <MessageInputForm
          newMessageContent={newMessageContent}
          onInputChange={handleInputChange}
          onSendMessage={handleSendMessage}
          onInputBlur={handleTypingStop}
          isConnected={isConnected}
          isLoadingMessages={isLoadingMessages}
          selectedChat={selectedChat}
        />
      </div>
    </div>
  )}
</div>
    );
}

export default MessageArea;