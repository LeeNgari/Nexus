import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom"

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
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

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
  }

  return (
    <div className={`
      h-full flex flex-col border-r bg-background/95 backdrop-blur-sm
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-20' : 'w-64'}
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
                         location.pathname.startsWith(`${item.href}/`)
          const activeStyles = getActiveStyles(isActive)
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`
                flex items-center gap-3 rounded-lg transition-all duration-200
                ${isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                dark:${activeStyles.dark}
                light:${activeStyles.light}
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
          )
        })}
      </nav>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t">
  <div className={`
    flex items-center gap-3 rounded-lg transition-colors
    ${isCollapsed ? 'justify-center p-2' : 'px-2 py-1.5 hover:bg-accent/50'}
  `}>
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium flex-shrink-0">
      L
    </div>
    
    {!isCollapsed && (
      <>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">Lee Ngari</p>
          <p className="text-xs text-muted-foreground truncate">lgngari</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-full">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
          </svg>
        </button>
      </>
    )}
  </div>

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
  )
}