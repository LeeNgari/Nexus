import { useState, useEffect } from "react"
import ThemeToggle from "../components/ThemeToggle"

export default function UsersList() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("/api/users")
                const data = await response.json()
                if (data.success) {
                    setUsers(data.data)
                } else {
                    setError("Failed to fetch users")
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    const handleStartConversation = (userId) => {
        // In a real app, this would create a new conversation
        console.log("Starting conversation with user:", userId)
        alert(`Conversation started with user ${userId}`)
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading users...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl text-red-500">Error: {error}</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="flex items-center justify-between p-6 border-b">
                <h1 className="text-title text-2xl">All Users</h1>
                <div className="flex items-center gap-6">
                    <ThemeToggle />
                    <div className="flex items-center gap-3 ml-2">
                        <img
                            src="https://res.cloudinary.com/dydpguips/image/upload/v1735813189/profile-user-svgrepo-com_zflps6.svg"
                            alt="Current User"
                            width={40}
                            height={40}
                            className="rounded-full"
                        />
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={user.avatar_url}
                                    alt={user.username}
                                    width={48}
                                    height={48}
                                    className="rounded-full"
                                />
                                <div>
                                    <div className="text-subtitle text-lg font-medium">{user.username}</div>
                                    <div className="flex items-center gap-1.5">
                    <span
                        className={`w-2.5 h-2.5 rounded-full ${
                            user.is_online ? "bg-green-500" : "bg-gray-400"
                        }`}
                    ></span>
                                        <span className="text-sm">
                      {user.is_online ? "Online" : "Offline"}
                    </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last active:</span>
                                    <span>{formatDate(user.last_active)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Account created:</span>
                                    <span>{formatDate(user.created_at)}</span>
                                </div>

                            </div>

                            <button
                                onClick={() => handleStartConversation(user.id)}
                                className="w-full btn btn-primary py-2"
                            >
                                Start Conversation
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}