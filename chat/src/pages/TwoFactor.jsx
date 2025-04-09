import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from "../components/ThemeToggle";

const TwoFactorForm = ({ onViewChange, email }) => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = Array(6).fill(0).map(() => useRef(null));

  const navigate = useNavigate();
  
  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }
    
    if (value && /^[0-9]$/.test(value)) {
      const newVerificationCode = [...verificationCode];
      newVerificationCode[index] = value;
      setVerificationCode(newVerificationCode);
      
      if (index < 5 && value) {
        inputRefs[index + 1].current.focus();
      }
    } else if (value === '') {
      const newVerificationCode = [...verificationCode];
      newVerificationCode[index] = '';
      setVerificationCode(newVerificationCode);
    }
  };
  
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!verificationCode[index] && index > 0) {
        inputRefs[index - 1].current.focus();
      }
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const code = verificationCode.join('');
    const userId = sessionStorage.getItem("pending_2fa_user");
    
    if (!userId) {
      setError('Session expired. Please login again.');
      setIsLoading(false);
      return;
    }
  
    const handleVerify = async () => {
      try {
        const response = await fetch('/api/auth/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            user_id: userId,
            code: code
          }),
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Verification failed');
        }
  
        sessionStorage.removeItem("pending_2fa_user");
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      
      } catch (err) {
        setError(err.message || 'Invalid verification code');
        setIsLoading(false);
      }
    };
    
    handleVerify();
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md p-8 mx-4 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-center">floakly</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Two-Factor Authentication
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-900 border-l-4 border-gray-800 dark:border-gray-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
              We've sent a verification code to <span className="font-medium">{email || 'your email'}</span>
            </p>
            
            <label className="block text-xs font-medium mb-2">
              Verification Code
            </label>
            <div className="flex justify-between gap-2">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                />
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full p-3 text-white bg-black dark:bg-white dark:text-black font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <button
              type="button"
              className="font-medium text-black dark:text-white hover:underline"
              onClick={() => navigate('/login')}
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorForm;