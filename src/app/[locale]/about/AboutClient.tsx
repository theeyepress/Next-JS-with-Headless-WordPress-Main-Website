// src/app/[locale]/about/AboutClient.tsx
"use client";

import React from "react";
import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";
import AdBanner from "@/components/AdBanner";

type AboutClientProps = {
  locale: string;
};

const AboutClient = ({ locale }: AboutClientProps) => {
  const content = {
    bn: {
      title: "আমাদের সম্পর্কে",
      subtitle: "স্বাধীন ডিজিটাল সংবাদ প্ল্যাটফর্ম",
      description: "The EyePress একটি স্বাধীন ডিজিটাল সংবাদ প্ল্যাটফর্ম যা নির্ভরযোগ্য এবং সময়োপযোগী সংবাদ প্রদান করে। আমরা সততা, নির্ভুলতা এবং বস্তুনিষ্ঠতার সাথে সংবাদ পরিবেশন করি।",
      mission: "আমাদের লক্ষ্য",
      missionText: "জনগণকে সঠিক এবং নির্ভরযোগ্য তথ্য প্রদান করা যাতে তারা সচেতন সিদ্ধান্ত নিতে পারে।",
      vision: "আমাদের দৃষ্টিভঙ্গি",
      visionText: "বাংলাদেশের সবচেয়ে বিশ্বস্ত এবং জনপ্রিয় ডিজিটাল সংবাদ প্ল্যাটফর্ম হওয়া।",
      contact: "যোগাযোগ",
      subscribe: "সাবস্ক্রাইব করুন",
      subscribeText: "সর্বশেষ খবর পেতে আমাদের সাথে যুক্ত থাকুন"
    },
    en: {
      title: "About Us",
      subtitle: "Independent Digital News Platform",
      description: "The EyePress is an independent digital news platform that provides reliable and timely news. We serve news with honesty, accuracy and objectivity.",
      mission: "Our Mission",
      missionText: "To provide the public with accurate and reliable information so they can make informed decisions.",
      vision: "Our Vision",
      visionText: "To become Bangladesh's most trusted and popular digital news platform.",
      contact: "Contact",
      subscribe: "Subscribe",
      subscribeText: "Stay connected to get the latest news"
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

      {/* About Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            {c.description}
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-[#6C1312] mb-4">{c.mission}</h2>
              <p className="text-gray-700">{c.missionText}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-[#6C1312] mb-4">{c.vision}</h2>
              <p className="text-gray-700">{c.visionText}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 p-6 rounded-lg mb-12">
            <h2 className="text-2xl font-bold text-[#6C1312] mb-4">{c.contact}</h2>
            <p className="text-gray-700 mb-4">
              {locale === "bn" 
                ? "যোগাযোগের জন্য ইমেইল করুন: contact@theeyepress.com"
                : "Email us at: contact@theeyepress.com"}
            </p>
            <Link 
              href={`/${locale}/contact`}
              className="inline-block px-6 py-3 bg-[#6C1312] text-white font-bold rounded-lg hover:bg-[#A41E22] transition-colors"
            >
              {locale === "bn" ? "যোগাযোগ পৃষ্ঠা দেখুন" : "Visit Contact Page"}
            </Link>
          </div>

          {/* Subscribe Section */}
          <div className="bg-gradient-to-r from-[#6C1312] via-[#8a1a1d] to-[#A41E22] rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">{c.subscribe}</h3>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">{c.subscribeText}</p>
            <div className="max-w-lg mx-auto">
              <SubscribeForm variant="hero" />
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

export default AboutClient;
