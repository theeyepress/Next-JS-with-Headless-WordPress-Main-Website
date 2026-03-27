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
      benefits: "কেন সাবস্ক্রাইব করবেন?",
      benefitsList: [
        { icon: "⚡", title: "দ্রুত খবর", desc: "খবর পান আগেভাগে" },
        { icon: "📰", title: "বিশেষ প্রতিবেদন", desc: "এক্সক্লুসিভ রিপোর্ট" },
        { icon: "🎁", title: "বিশেষ অফার", desc: "এক্সক্লুসিভ অফার" },
        { icon: "🔒", title: "নিরাপদ", desc: "সম্পূর্ণ সুরক্ষিত" }
      ],
      trust: "আমরা আপনার ইমেইল নিরাপদ রাখি। যেকোনো সময় আনসাবস্ক্রাইব করতে পারেন।",
      stayConnected: "আমাদের সাথে যুক্ত থাকুন"
    },
    en: {
      title: "Subscribe",
      subtitle: "Get the Latest News",
      description: "Subscribe to our newsletter and get the latest news, updates, and special offers directly to your email.",
      benefits: "Why Subscribe?",
      benefitsList: [
        { icon: "⚡", title: "Fast News", desc: "Get news first" },
        { icon: "📰", title: "Special Reports", desc: "Exclusive reports" },
        { icon: "🎁", title: "Special Offers", desc: "Exclusive offers" },
        { icon: "🔒", title: "Secure", desc: "Fully protected" }
      ],
      trust: "We keep your email safe. Unsubscribe at any time.",
      stayConnected: "Stay Connected with Us"
    }
  };

  const c = content[locale as keyof typeof content] || content.bn;

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#A41E22] via-[#8a1a1d] to-[#A41E22] py-16 md:py-20 pt-10 sm:pt-12 lg:pt-14">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              {c.title}
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              {c.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="max-w-5xl mx-auto">
          {/* Subscribe Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 mb-12">
            <SubscribeForm variant="hero" />
          </div>

          {/* Benefits Grid */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
              {c.benefits}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {c.benefitsList.map((benefit, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="text-2xl md:text-3xl lg:text-4xl mb-3">{benefit.icon}</div>
                  <h3 className="font-bold text-gray-800 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Section */}
          <div className="bg-white rounded-2xl p-8 mb-12">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium">{c.trust}</p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-gradient-to-r from-[#A41E22] to-[#8a1a1d] rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              {c.stayConnected}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://facebook.com/theeyepress" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://youtube.com/@theeyepress" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a 
                href="https://x.com/theeyepress" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/theeyepress" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Banner */}
      <div className="container mx-auto px-4 pb-12">
        <AdBanner slotId={2} className="rounded-lg" />
      </div>
    </main>
  );
};

export default SubscribePageClient;
