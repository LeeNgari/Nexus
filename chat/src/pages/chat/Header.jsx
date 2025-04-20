// src/components/chat/Header.jsx
import React from 'react';
import ThemeToggle from  "../../components/ThemeToggle"// Adjust path if needed

function Header({ isConnected, currentUserId }) {
    return (
        <header className="flex items-center justify-between p-6 border-b border-border bg-background">
            <h1 className="text-2xl font-semibold">Messenger</h1>
            <div className="flex items-center gap-4 md:gap-6">
                <div className={`text-xs font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                    Status: {isConnected ? 'Connected' : 'Disconnected'}
                </div>
                {currentUserId && (
                    <div className="hidden md:block">
                        <div className="text-xs text-text-secondary">ID: {currentUserId.substring(0, 8)}...</div>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;