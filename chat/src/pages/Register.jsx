import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import React from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      
      setSuccess("Account created successfully! Redirecting to login...");
      
      // Redirect after showing success message
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md p-8 mx-4 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-center">floakly</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Create an account to get started</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-900 border-l-4 border-gray-800 dark:border-gray-200 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-900 border-l-4 border-gray-800 dark:border-gray-200 text-sm">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-xs font-medium mb-2">
              Username
            </label>
            <input
              id="username"
              placeholder="yourusername"
              type="text"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              placeholder="you@example.com"
              type="email"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-xs font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              placeholder="•••••••••••"
              type="password"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full p-3 mt-4 text-white bg-black dark:bg-white dark:text-black font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-black dark:text-white hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}