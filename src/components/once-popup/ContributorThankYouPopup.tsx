"use client";

import type React from "react";
import type { Contributor } from "./contributors";

type ContributorThankYouPopupProps = {
  contributor: Contributor;
  onClose: () => void;
};

const ContributorThankYouPopup: React.FC<ContributorThankYouPopupProps> = ({
  contributor,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          ✕
        </button>

        <div className="mb-3 text-4xl">🤍</div>

        <h2 className="mb-3 text-2xl font-bold text-slate-900">
          ধন্যবাদ{contributor.name ? ` ${contributor.name}` : ""}! 🎉
        </h2>

        <p className="mb-4 text-base leading-relaxed text-slate-700">
          {contributor.contribution} তোমাকে অনেক ধন্যবাদ। তোমার মতো মানুষদের
          সাহায্যেই এই সাইটটা দিন দিন আরও ভালো হচ্ছে।
        </p>

        <p className="mb-6 rounded-lg bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
          {contributor.result ??
            "তোমার নাম Contributions লিস্টে যোগ করা হয়েছে।"}{" "}
          আবার কোনো ডিজাইন বা আইডিয়া থাকলে নির্দ্বিধায় পাঠিয়ে দিও — আমরা
          অপেক্ষায় আছি! ✨
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          ধন্যবাদ, বুঝতে পেরেছি ✅
        </button>
      </div>
    </div>
  );
};

export default ContributorThankYouPopup;
