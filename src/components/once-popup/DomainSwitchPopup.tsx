"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DomainSwitchPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if we are on the Netlify domain
    const isNetlify = window.location.hostname.includes("netlify.app");
    
    if (isNetlify) {
      setIsOpen(true);

      // Auto redirect after 10 seconds
      const timer = setTimeout(() => {
        window.location.href = "https://pubcoverletter.vercel.app/";
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl border border-red-100">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 text-red-600">
          <div className="p-2 bg-red-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-xl font-bold">ডোমেইন পরিবর্তন সংক্রান্ত নোটিশ</h2>
        </div>

        {/* Content */}
        <div className="space-y-4 text-slate-700 leading-relaxed">
          <p className="font-medium text-lg">
            প্রিয় ইউজার, প্রতি মাসে সাইটে প্রচুর ট্রাফিক বেড়ে যাওয়ার কারণে আমরা নতুন ডোমেইনে সুইচ করেছি।
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm font-semibold text-blue-800 mb-1">আমাদের নতুন ঠিকানা:</p>
            <Link 
              href="https://pubcoverletter.vercel.app/" 
              className="text-blue-600 hover:underline font-bold break-all"
            >
              https://pubcoverletter.vercel.app/
            </Link>
          </div>

          <p className="text-sm">
            নেটলিফিতে (Netlify) আমাদের বিলিং ক্রেডিট অনেক দ্রুত শেষ হয়ে যাচ্ছে, তাই স্থায়ীভাবে আমরা ভার্সেলে (Vercel) চলে যাচ্ছি। 
          </p>

          <p className="text-xs text-slate-500 font-medium">
            * আপনাকে ১০ সেকেন্ড পর অটোমেটিক নতুন সাইটে নিয়ে যাওয়া হবে।
          </p>
          
          <p className="text-sm italic text-slate-500">
            * যদি নতুন ডোমেইনে কোনো সমস্যা ফেস করেন, তবে এই ডোমেইনে এসে কাজ চালিয়ে নিতে পারবেন। তবে আমরা রিকমেন্ড করছি নতুন ডোমেইনটি ব্যবহার করার জন্য।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Link 
            href="https://pubcoverletter.vercel.app/"
            className="w-full bg-black text-white text-center py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-black/20"
          >
            নতুন সাইটে যান 🚀
          </Link>
        </div>
      </div>
    </div>
  );
}



