/* eslint-disable react-hooks/set-state-in-effect */
// app/admin/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import '../(home)/globals.css';
import { Lock, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [todayDate, setTodayDate] = useState<string>('');

  // Get today's date (only day number)
  useEffect(() => {
    const today = new Date().getDate().toString();
    setTodayDate(today);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError('');

    if (password === todayDate) {
      setIsAuthenticated(true);
      setPassword('');
      // Store in session (not localStorage for security)
      sessionStorage.setItem('adminAuth', 'true');
    } else {
      setError('❌ Wrong password! ');
      setPassword('');
    }
  };

  const handleLogout = (): void => {
    setIsAuthenticated(false);
    setPassword('');
    sessionStorage.removeItem('adminAuth');
  };

  // Check if user was already authenticated (session)
  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-600 p-3 rounded-full">
                    <Lock size={32} className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Admin Portal
                </h1>
                <p className="text-gray-400">Secure Access Required</p>
              </div>

              {/* Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition"
                    autoFocus
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 transform hover:scale-105"
                >
                  Unlock Admin Panel
                </button>
              </form>

              {/* Footer */}
              <div className="text-center mt-6 text-gray-400 text-xs">
                🔒 This portal is password protected for security
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // Authenticated view
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900">
        {/* Logout Button */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Main Content */}
        <main className="w-full">
          {children}
        </main>
      </body>
    </html>
  );
}