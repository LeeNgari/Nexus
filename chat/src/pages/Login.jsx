import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import React from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
     
      console.log("lee")
      sessionStorage.setItem("pending_2fa_user", data.user_id);
      console.log(typeof data.user_id);
      
      // Redirect to dashboard or home page
      navigate("/TwoFactorForm");
      
    } catch (err) {
      setError(err.message || "Invalid email or password");
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
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-900 border-l-4 border-gray-800 dark:border-gray-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-gray-600 dark:text-gray-400">
                Remember me
              </label>
            </div>
            
            <Link to="/forgot-password" className="font-medium text-black dark:text-white hover:underline">
              Forgot password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className="w-full p-3 mt-4 text-white bg-black dark:bg-white dark:text-black font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-black dark:text-white hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}