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

        <h2 className="mb-2 text-xl font-bold text-slate-900">
          ধন্যবাদ{contributor.name ? ` ${contributor.name}` : ""}! 🤍
        </h2>

        <p className="mb-4 text-sm leading-relaxed text-slate-700">
          {contributor.contribution} ধন্যবাদ।{" "}
          {contributor.result ?? "তোমার নাম Contributions লিস্টে আছে।"}
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          ঠিক আছে ✅
        </button>
      </div>
    </div>
  );
};

export default ContributorThankYouPopup;
