/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

const POPUP_STORAGE_KEY = "pubcoverletter_popup_closed";

export default function OncePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ✅ ek tab/session e jodi age close kora thake, abar dekhabe na
    const alreadyClosed = sessionStorage.getItem(POPUP_STORAGE_KEY);

    if (!alreadyClosed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);

    if (typeof window !== "undefined") {
      // ✅ sudhu current tab/session er jonno off
      sessionStorage.setItem(POPUP_STORAGE_KEY, "true");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          ✕
        </button>

        <h2 className="mb-3 text-2xl font-bold text-slate-900 flex items-center gap-2">
          আপনার ডিজাইনও যোগ হোক এখানে 🎓✨
        </h2>

        <p className="mb-6 text-base text-slate-700 leading-relaxed space-y-4">
          <span className="block">
            আমাদের ভার্সিটির সব ডিপার্টমেন্টের ছেলেমেয়েরা এই সাইট থেকে
            অ্যাসাইনমেন্ট ও ল্যাব রিপোর্টের কভার পেজ প্রিন্ট করে। এখন দেখা যাচ্ছে
            প্রতি ডিপার্টমেন্ট আলাদা আলাদা টেমপ্লেট ব্যবহার করছে — তাই আমরা চাই আরও
            বেশি সুন্দর টেমপ্লেট যোগ করতে।
          </span>

          <span className="block font-semibold text-indigo-600">
            আর এটা সম্ভব হবে শুধু তোমাদের সাহায্যে! 🫶
          </span>

          <span className="block">
            নিজের বানানো কোনো কভার পেজ থাকলে শেয়ার করো — তোমার নাম দিয়ে আমরা
            সেটা টেমপ্লেট হিসেবে যোগ করে দিব। 🔥
          </span>

          <span className="block bg-indigo-50 px-4 py-3 rounded-lg font-medium text-indigo-800">
            করণীয়:
            <br />
            → ডিজাইন ফাইল Google Drive-এ আপলোড করে লিঙ্ক কপি করো
            <br />
            → Feedback পেজে নাম + ইমেইল + লিঙ্ক পাঠিয়ে দাও
            <br />
            → আমরা চেক করে তোমার নামসহ যোগ করে দিব 🤍
          </span>
        </p>

        <button
          onClick={handleClose}
          className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          ঠিক আছে, বুঝতে পেরেছি ✅
        </button>
      </div>
    </div>
  );
}
