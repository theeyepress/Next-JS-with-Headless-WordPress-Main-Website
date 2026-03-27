// src/components/SubscribeForm.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";

type SubscribeFormProps = {
  variant?: "inline" | "popup" | "page" | "hero";
  className?: string;
};

const SubscribeForm: React.FC<SubscribeFormProps> = ({
  variant = "inline",
  className = "",
}) => {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      const userData = localStorage.getItem("wp_user") || localStorage.getItem("eyepress_user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user?.email) {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/subscription-status`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
              }
            );
            const data = await res.json();
            if (data.subscribed) {
              setIsSubscribed(true);
            }
          }
        } catch (e) {
          console.log("Error checking subscription:", e);
        }
      }
      setIsLoadingCheck(false);
    };
    checkSubscription();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("error");
      setMessage(locale === "bn" ? "সঠিক ইমেইল ঠিকানা লিখুন" : "Please enter a valid email address");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, locale }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setIsSubscribed(true);
        setMessage(locale === "bn" 
          ? "ধন্যবাদ! আপনি সফলভাবে সাবস্ক্রাইব করেছেন।" 
          : "Thank you! You have successfully subscribed.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message || (locale === "bn" 
          ? "এই ইমেইল ইতিমধ্যে সাবস্ক্রাইব করা হয়েছে।" 
          : "This email is already subscribed."));
      }
    } catch (error) {
      setStatus("error");
      setMessage(locale === "bn"
        ? "নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।"
        : "Network error. Please try again.");
    }
  };

  const labels = {
    title: locale === "bn" ? "সাবস্ক্রাইব করুন" : "Subscribe",
    titleSuccess: locale === "bn" ? "সফল!" : "Success!",
    description: locale === "bn"
      ? "সর্বশেষ খবর পেতে আমাদের সাথে যুক্ত থাকুন"
      : "Stay connected to get the latest news",
    placeholder: locale === "bn" ? "আপনার ইমেইল লিখুন" : "Enter your email address",
    button: locale === "bn" ? "সাবস্ক্রাইব" : "Subscribe",
    buttonLoading: locale === "bn" ? "অপেক্ষা..." : "Subscribing...",
    noSpam: locale === "bn" 
      ? "কোনো স্প্যাম নেই। আপনি যেকোনো সময় আনসাবস্ক্রাইব করতে পারেন।" 
      : "No spam. Unsubscribe anytime.",
    privacy: locale === "bn"
      ? "আমরা আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখি।"
      : "We protect your personal information.",
  };

  if (!isLoadingCheck && isSubscribed) {
    return null;
  }

  if (isLoadingCheck) {
    return null;
  }

  const inputClasses = `
    w-full px-5 py-4 rounded-xl text-gray-900 
    focus:outline-none focus:ring-2 focus:ring-[#A41E22] focus:ring-offset-2
    bg-white placeholder-gray-400 text-base
    border-2 border-gray-200 focus:border-[#A41E22]
    transition-all duration-200
  `;

  const buttonClasses = `
    px-8 py-4 bg-[#A41E22] text-white rounded-xl font-bold text-base
    hover:bg-[#8a1a1d] hover:shadow-lg hover:-translate-y-0.5
    transition-all duration-200 transform
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
    flex items-center justify-center gap-2 min-w-[160px]
  `;

  // Hero variant - Large premium design
  if (variant === "hero") {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-[#A41E22] via-[#8a1a1d] to-[#6C1312] rounded-2xl p-8 md:p-12 text-center ${className}`}>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16" />
        <div className="absolute top-20 left-1/4 w-16 h-16 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-20 translate-y-20" />
        <div className="absolute bottom-16 right-1/4 w-12 h-12 bg-white/5 rounded-full" />
        
        {!isSubscribed ? (
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">{labels.title}</h3>
            <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">{labels.description}</p>
            
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder={labels.placeholder}
                    className={inputClasses}
                    required
                    disabled={status === "loading"}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className={buttonClasses}
                >
                  {status === "loading" ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {labels.buttonLoading}
                    </>
                  ) : (
                    <>
                      {labels.button}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              
              {message && (
                <p className={`mt-4 text-sm font-medium ${status === "error" ? "text-yellow-300" : "text-green-300"}`}>
                  {message}
                </p>
              )}
              
              <p className="text-white/50 text-xs mt-4 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {labels.noSpam}
              </p>
            </form>
          </div>
        ) : (
          <div className="relative z-10 animate-fade-in">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">{labels.titleSuccess}</h3>
            <p className="text-white/80 max-w-md mx-auto text-lg">{message}</p>
            <p className="text-white/50 text-sm mt-6">{labels.privacy}</p>
          </div>
        )}
      </div>
    );
  }

  // Compact inline variant
  return (
    <div className={`${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder={labels.placeholder}
            className="w-full px-4 py-2.5 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A41E22] bg-white placeholder-gray-400 text-sm border border-gray-200 focus:border-[#A41E22] transition-all"
            required
            disabled={status === "loading"}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-5 py-2.5 bg-[#A41E22] text-white rounded-lg font-semibold text-sm hover:bg-[#8a1a1d] transition-all disabled:opacity-50 flex items-center gap-1"
        >
          {status === "loading" ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            labels.button
          )}
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-xs font-medium ${status === "error" ? "text-red-500" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default SubscribeForm;
