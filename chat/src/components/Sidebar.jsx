import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    ),
  },
  {
    name: "Status",
    href: "/dashboard/giving",
    icon: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
        >
          {/* Dotted circle outline */}
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeDasharray="2,4" fill="none" />

          {/* User silhouette inside */}
          <circle cx="12" cy="9" r="3" fill="currentColor" />
          <path d="M12 12a5 5 0 0 1 5 5H7a5 5 0 0 1 5-5z" fill="currentColor" />
        </svg>
    ),
  },
  {
    name: "My Profile",
    href: "/dashboard/profile",
    icon: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
    ),
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Format the last active date
  const formatLastActive = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  };

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/me', {
          credentials: 'include', // Important for cookies
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      console.log('Logout successful');
      // Clear user data from your app state
      setUserData(null);
      // Redirect to login page or home page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  const getActiveStyles = (isActive) => {
    return isActive
        ? {
          light: 'bg-primary/20 text-primary border-l-4 border-primary',
          dark: 'bg-primary/30 text-primary-foreground border-l-4 border-primary'
        }
        : {
          light: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          dark: 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
        }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
      <div className={`
      h-full flex flex-col border-r bg-background/95 backdrop-blur-sm
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-20' : 'w-72'}
    `}>
        {/* Collapse Button */}
        <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-5 z-10 rounded-full border bg-background p-1.5 shadow-sm hover:bg-accent transition-colors"
        >
          {isCollapsed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6"/>
              </svg>
          ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
          )}
        </button>

        {/* Logo/Header */}
        <div className="p-5 border-b flex items-center justify-center bg-white">
  {isCollapsed ? (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden shadow-md">
      <img
        src="data:image/png;base64,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"
        className="w-full h-full object-cover"
      />
    </div>
  ) : (
    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text  block relative z-10">
    Nexus
  </h1>
  
  )}
</div>


        {/* User Info Panel */}
       

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Menu Section */}
          {!isCollapsed && (
              <div className="px-5 pt-5 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                Menu
              </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href ||
                  location.pathname.startsWith(`${item.href}/`);
              const activeStyles = getActiveStyles(isActive);

              return (
                  <Link
                      key={item.href}
                      to={item.href}
                      className={`
                  flex items-center gap-3 rounded-lg transition-all duration-200
                  ${isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                  ${isActive ? activeStyles.light : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}
                  dark:${activeStyles.dark}
                  ${isCollapsed && isActive ? 'ring-2 ring-primary' : ''}
                `}
                      title={isCollapsed ? item.name : undefined}
                  >
                <span className={`
                  p-1.5 rounded-lg flex-shrink-0
                  ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-accent-foreground'
                }
                `}>
                  {item.icon}
                </span>

                    {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.name}</span>
                          {item.badge && (
                              <span className={`
                        text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0
                        ${isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }
                      `}>
                        {item.badge}
                      </span>
                          )}
                        </>
                    )}
                  </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t">
          {loading ? (
              <div className="flex items-center justify-center p-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
          ) : (
              <div className={`
            flex items-center gap-3 rounded-lg transition-colors
            ${isCollapsed ? 'justify-center p-2' : 'px-2 py-1.5 hover:bg-accent/50'}
          `}>
                {userData && userData.avatar_url ? (
                    <img
                        src={userData.avatar_url}
                        alt={userData.username}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium flex-shrink-0">
                      {userData ? getInitials(userData.username) : "?"}
                    </div>
                )}

                {!isCollapsed && userData && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{userData.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{userData.email}</p>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground p-1 rounded-full">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                        </svg>
                      </button>
                    </>
                )}
              </div>
          )}

          {/* Logout Button */}
          <button
              onClick={logout}
              className={`
            w-full mt-2 flex items-center gap-2 rounded-lg p-2 text-sm
            transition-colors hover:bg-destructive/90 hover:text-destructive-foreground
            ${isCollapsed ? 'justify-center' : 'px-3'}
          `}
          >
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-destructive"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <path d="M16 17l5-5-5-5"/>
              <path d="M21 12H9"/>
            </svg>
            {!isCollapsed && (
                <span className="truncate">Sign Out</span>
            )}
          </button>
        </div>
      </div>
  );
}