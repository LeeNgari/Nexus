import { useState, useEffect } from "react";

const SessionCheck = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const checkSession = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/check-session', {
                method: 'GET',
                credentials: 'include' // Ensure cookies are sent
            });

            if (!response.ok) throw new Error('Session check failed');

            const data = await response.json();
            console.log("lee")
            console.log(data)
            setUser(data.authenticated ? data.user : null);
            console.log(user)
        } catch (error) {
            console.error('Session check error:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSession();

        // Add event listener for storage changes
        const handleStorageChange = () => {
            checkSession();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    return children({ user , checkSession});
};

export default SessionCheck;