import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import TwoFactorForm from "./pages/TwoFactor";
import Profile from "./pages/Profile";
import UsersList from "./pages/usersList.jsx";
import Test from "./pages/test.jsx";

// Contexts
import { useTheme } from "./contexts/ThemeToggle";
import { UserContext } from "./contexts/UserContext.jsx";

// Components
import SessionCheck from "./components/checkSession.jsx";



function App() {
    const { theme } = useTheme();

    return (
        <div className={theme}>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/twofactorform" element={<TwoFactorForm />} />

                {/* Protected Routes */}
               
                    <Route path="/dashboard" element={<Dashboard />}>
                        <Route index element={<Navigate to="messages" />} />
                        <Route path="messages" element={<Messages />} />
                        <Route path="people" element={<UsersList />} />
                        <Route path="groups" element={<div>Groups Page</div>} />
                        <Route path="giving" element={<Test />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>
                
            </Routes>
        </div>
    );
}

export default App;
