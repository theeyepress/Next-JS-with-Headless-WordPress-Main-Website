// src/components/TranslationPrompt.tsx
"use client";

import React, { useState } from "react";

type TranslationPromptProps = {
  locale: "bn" | "en";
  onClose?: () => void;
};

const TranslationPrompt: React.FC<TranslationPromptProps> = ({ locale, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const isBengali = locale === "bn";

  return (
    <div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
      style={{ maxWidth: "400px" }}
    >
      <div
        className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-lg shadow-xl p-4"
        style={{
          backgroundColor: isBengali ? "#fffbeb" : "#fef3c7",
          borderLeftColor: "#f59e0b",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#f59e0b" }}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4
              className="font-bold text-sm"
              style={{ color: isBengali ? "#92400e" : "#78350f" }}
            >
              {isBengali
                ? "এই পোস্টের ইংরেজি অনুবাদ এখনো হয়নি"
                : "Translation Coming Soon"}
            </h4>
            <p
              className="text-xs mt-1"
              style={{ color: isBengali ? "#b45309" : "#92400e" }}
            >
              {isBengali
                ? "আমরা এই পোস্টটি ইংরেজিতে অনুবাদ করছি। শীঘ্রই এটি উপলব্ধ হবে।"
                : "We are working on translating this post to English. It will be available soon."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded hover:bg-amber-100 transition-colors"
            style={{ color: "#b45309" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationPrompt;
