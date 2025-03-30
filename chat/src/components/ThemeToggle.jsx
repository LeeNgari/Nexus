import React from "react"
import { useTheme } from "../contexts/ThemeToggle"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button className="btn btn-ghost btn-icon relative" onClick={toggleTheme}>
      {/* Sun icon */}
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
        className={`h-5 w-5 transition-all ${theme === "dark" ? "opacity-0 scale-0" : "opacity-100 scale-100"}`}
        style={{ position: theme === "dark" ? "absolute" : "static" }}
      >
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>

      {/* Moon icon */}
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
        className={`h-5 w-5 transition-all ${theme === "light" ? "opacity-0 scale-0" : "opacity-100 scale-100"}`}
        style={{ position: theme === "light" ? "absolute" : "static" }}
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      </svg>

      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

