// src/components/SubscribeForm.tsx
"use client";

import React, { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

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
        setMessage(locale === "bn" 
          ? "আপনার সাবস্ক্রিপশন সফল হয়েছে!" 
          : "Subscription successful!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message || (locale === "bn" 
          ? "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।" 
          : "Something went wrong. Please try again."));
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
    description: locale === "bn"
      ? "সর্বশেষ খবর পেতে আমাদের সাথে যুক্ত থাকুন"
      : "Stay connected to get the latest news",
    placeholder: locale === "bn" ? "আপনার ইমেইল লিখুন" : "Enter your email",
    button: locale === "bn" ? "সাবস্ক্রাইব" : "Subscribe",
    noSpam: locale === "bn" 
      ? "কোনো স্প্যাম নেই। আপনি যেকোনো সময় আনসাবস্ক্রাইব করতে পারেন।" 
      : "No spam. Unsubscribe anytime.",
  };

  // Hero variant - Large premium design with bubbles
  if (variant === "hero") {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-r from-[#6C1312] via-[#8a1a1d] to-[#A41E22] rounded-2xl p-8 md:p-12 text-center ${className}`}>
        {/* Bubble decorations */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-12 -translate-y-12 animate-pulse" />
        <div className="absolute top-10 left-20 w-8 h-8 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-10 right-20 w-12 h-12 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-1/2 left-10 w-6 h-6 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute top-20 right-1/3 w-10 h-10 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        
        <div className="relative z-10">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{labels.title}</h3>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto text-lg">{labels.description}</p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={labels.placeholder}
                className="w-full px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30 text-lg bg-white placeholder-gray-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-4 bg-[#6C1312] text-white rounded-full font-bold text-lg hover:bg-[#B42125] transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {status === "loading" ? "..." : labels.button}
            </button>
          </form>
          
          {message && (
            <p className={`mt-4 ${status === "error" ? "text-yellow-300" : "text-green-300"}`}>
              {message}
            </p>
          )}
          
          <p className="text-white/60 text-sm mt-4">{labels.noSpam}</p>
        </div>
      </div>
    );
  }

  // Popup variant
  if (variant === "popup") {
    return (
      <div className={`bg-[#6C1312] text-white p-8 rounded-lg ${className}`}>
        <h3 className="text-2xl font-bold mb-2">{labels.title}</h3>
        <p className="mb-4 opacity-90">{labels.description}</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={labels.placeholder}
            className="flex-1 px-4 py-3 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A41E22]"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 bg-[#6C1312] text-white hover:bg-[#B42125] rounded font-bold transition-all disabled:opacity-50"
          >
            {status === "loading" ? "..." : labels.button}
          </button>
        </form>
        {message && (
          <p className={`mt-2 ${status === "error" ? "text-yellow-300" : "text-green-300"}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Page variant
  if (variant === "page") {
    return (
      <div className={`bg-gray-100 p-8 rounded-lg ${className}`}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#6C1312] mb-3">{labels.title}</h2>
          <p className="text-gray-700 mb-6">{labels.description}</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={labels.placeholder}
              className="flex-1 px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-[#A41E22] focus:ring-1 focus:ring-[#A41E22]"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-3 bg-[#6C1312] text-white hover:bg-[#B42125] rounded font-bold transition-all disabled:opacity-50"
            >
              {status === "loading" ? "..." : labels.button}
            </button>
          </form>
          {message && (
            <p className={`mt-4 ${status === "error" ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className={`${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.placeholder}
          className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-[#A41E22] text-sm"
          required
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-4 py-2 bg-[#6C1312] text-white hover:bg-[#B42125] rounded text-sm font-bold transition-all disabled:opacity-50"
        >
          {status === "loading" ? "..." : labels.button}
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-xs ${status === "error" ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default SubscribeForm;
