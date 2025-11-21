"use client";
import React, { useState } from 'react';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = () => {
    if (email) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div className="min-h-[80vh] bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-xl">
        {/* Logo */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-gray-900 mb-2">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}