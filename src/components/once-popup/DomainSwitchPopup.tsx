"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DomainSwitchPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if we are on the Netlify domain
    const isNetlify = window.location.hostname.includes("netlify.app");
    
    if (isNetlify) {
      setIsOpen(true);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = "https://pubcoverletter.vercel.app/";
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl border border-red-100 text-center">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-6 text-red-600">
          <div className="p-3 bg-red-50 rounded-full animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold">ডোমেইন পরিবর্তন সংক্রান্ত নোটিশ</h2>
        </div>

        {/* Content */}
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <div className="space-y-2">
            <p className="font-semibold text-xl">
              আমাদের সাইটটি স্থায়ীভাবে নতুন ঠিকানায় চলে গেছে।
            </p>
            <p className="text-slate-500">
              পুরানো এই ডোমেইনটি শীঘ্রই বন্ধ হয়ে যাবে।
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
            <p className="text-sm font-medium text-blue-800 mb-2">নতুন ঠিকানা:</p>
            <Link 
              href="https://pubcoverletter.vercel.app/" 
              className="text-blue-600 hover:underline font-bold text-lg break-all"
            >
              https://pubcoverletter.vercel.app/
            </Link>
          </div>

          <div className="py-2">
            <p className="text-sm font-medium text-slate-600">
              আপনাকে অটোমেটিক নতুন সাইটে নিয়ে যাওয়া হচ্ছে...
            </p>
            <div className="mt-3 text-4xl font-black text-black">
              {countdown}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8">
          <Link 
            href="https://pubcoverletter.vercel.app/"
            className="w-full block bg-black text-white text-center py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-black/20"
          >
            এখনই নতুন সাইটে যান 🚀
          </Link>
        </div>
      </div>
    </div>
  );
}

