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
    name: "People",
    href: "/dashboard/people",
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
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M17 5v2"></path>
          <path d="M21 5v2"></path>
          <path d="M19 3h2"></path>
          <path d="M19 7h2"></path>
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
        const response = await fetch('http://localhost:5000/api/users/me', {
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
      const response = await fetch('http://localhost:5000/api/auth/logout', {
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
        <div className="p-5 border-b flex items-center justify-center">
          {isCollapsed ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold">
                F
              </div>
          ) : (
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                floakly
              </h1>
          )}
        </div>

        {/* User Info Panel */}
        {!isCollapsed && userData && (
            <div className="p-4 border-b">
              <div className="flex items-center gap-3 mb-3">
                {userData.avatar_url ? (
                    <img
                        src={userData.avatar_url}
                        alt={userData.username}
                        className="w-12 h-12 rounded-full"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium">
                      {getInitials(userData.username)}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{userData.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{userData.email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="flex items-center">
                {userData.is_online ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                      <span className="text-green-500">Online</span>
                    </>
                ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></span>
                      <span>Offline</span>
                    </>
                )}
              </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last active:</span>
                  <span>{formatLastActive(userData.last_active)}</span>
                </div>
              </div>
            </div>
        )}

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