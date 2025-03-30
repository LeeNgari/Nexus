import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Messages from "./pages/Messages"
import { useTheme } from "./contexts/ThemeToggle"
import TwoFactorForm from "./pages/TwoFactor"
import Profile from "./pages/Profile"
import React from "react"

function App() {
  const { theme } = useTheme()

  return (
    <div className={theme}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/twofactorform" element={<TwoFactorForm />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="/dashboard/messages" />} />
          <Route path="messages" element={<Messages />} />
          <Route path="people" element={<div>People Page</div>} />
          <Route path="groups" element={<div>Groups Page</div>} />
          <Route path="giving" element={<div>Giving Page</div>} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App

