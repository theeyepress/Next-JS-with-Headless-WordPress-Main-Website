// src/app/[locale]/subscribe/SubscribePageClient.tsx
"use client";

import React from "react";
import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";
import AdBanner from "@/components/AdBanner";

type SubscribePageClientProps = {
  locale: string;
};

const SubscribePageClient = ({ locale }: SubscribePageClientProps) => {
  const content = {
    bn: {
      title: "সাবস্ক্রাইব করুন",
      subtitle: "সর্বশেষ খবর পেতে",
      description: "আমাদের নিউজলেটারে সাবস্ক্রাইব করুন এবং সর্বশেষ খবর, আপডেট এবং বিশেষ অফার সরাসরি আপনার ইমেইলে পান।",
      benefits: "সুবিধাসমূহ",
      benefitsList: [
        "দ্রুত খবর পান",
        "বিশেষ প্রতিবেদন",
        "এক্সক্লুসিভ কন্টেন্ট",
        "কোনো স্প্যাম নেই"
      ],
      trust: "আমরা আপনার ইমেইল নিরাপদ রাখি। যেকোনো সময় আনসাবস্ক্রাইব করতে পারেন।"
    },
    en: {
      title: "Subscribe",
      subtitle: "Get the Latest News",
      description: "Subscribe to our newsletter and get the latest news, updates, and special offers directly to your email.",
      benefits: "Benefits",
      benefitsList: [
        "Get news faster",
        "Special reports",
        "Exclusive content",
        "No spam"
      ],
      trust: "We keep your email safe. Unsubscribe at any time."
    }
  };

  const c = content[locale as keyof typeof content] || content.bn;

  return (
    <main className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#6C1312] via-[#8a1a1d] to-[#A41E22] py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            {c.title}
          </h1>
          <p className="text-xl text-white/80 text-center max-w-2xl mx-auto">
            {c.subtitle}
          </p>
        </div>
      </div>

      {/* Subscribe Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Info */}
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {c.description}
              </p>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#6C1312] mb-4">{c.benefits}</h2>
                <ul className="space-y-3">
                  {c.benefitsList.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-gray-500">
                {c.trust}
              </p>
            </div>

            {/* Right - Form */}
            <div className="bg-gray-50 p-8 rounded-2xl">
              <SubscribeForm variant="hero" />
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-[#6C1312] mb-4">
              {locale === "bn" ? "আমাদের সাথে যুক্ত থাকুন" : "Stay Connected with Us"}
            </h2>
            <p className="text-gray-700 mb-6">
              {locale === "bn" 
                ? "সোশ্যাল মিডিয়ায় আমাদের অনুসরণ করুন এবং সর্বশেষ খবর পান।"
                : "Follow us on social media and get the latest news."}
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/theeyepress/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#6C1312] flex items-center justify-center hover:bg-[#A41E22] transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@theeyepress" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#6C1312] flex items-center justify-center hover:bg-[#A41E22] transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://x.com/theeyepress" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#6C1312] flex items-center justify-center hover:bg-[#A41E22] transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/theeyepress" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#6C1312] flex items-center justify-center hover:bg-[#A41E22] transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Banner */}
      <div className="container mx-auto px-4 pb-8">
        <AdBanner slotId={2} className="rounded-lg" />
      </div>
    </main>
  );
};

export default SubscribePageClient;
