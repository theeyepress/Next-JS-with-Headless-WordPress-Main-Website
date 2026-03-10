// src/app/[locale]/privacy/PrivacyClient.tsx
"use client";

import React from "react";
import AdBanner from "@/components/AdBanner";

type PrivacyClientProps = {
  locale: string;
};

const PrivacyClient = ({ locale }: PrivacyClientProps) => {
  const content = {
    bn: {
      title: "গোপনীয়তা নীতি",
      lastUpdate: "সর্বশেষ আপডেট: জানুয়ারি ২০২৬",
      intro: "The EyePress আমাদের ব্যবহারকারীদের গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ। এই গোপনীয়তা নীতি ব্যাখ্যা করে কীভাবে আমরা আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষা করি।",
      sections: [
        {
          title: "তথ্য সংগ্রহ",
          text: "আমরা আপনার কাছ থেকে বিভিন্ন তথ্য সংগ্রহ করি যখন আপনি আমাদের ওয়েবসাইট ব্যবহার করেন। এর মধ্যে রয়েছে: আপনার নাম, ইমেইল ঠিকানা, এবং আপনি আমাদের সাথে যোগাযোগ করার সময় প্রদান করা অন্যান্য তথ্য।"
        },
        {
          title: "তথ্য ব্যবহার",
          text: "আমরা আপনার দেওয়া তথ্য ব্যবহার করি আমাদের সেবা প্রদান করতে, আপনার সাথে যোগাযোগ করতে, এবং আমাদের ওয়েবসাইট উন্নত করতে।"
        },
        {
          title: "তথ্য সুরক্ষা",
          text: "আমরা আপনার তথ্যের সুরক্ষা নিশ্চিত করতে বিভিন্ন সুরক্ষা ব্যবস্থা গ্রহণ করি। তবে, ইন্টারনেটে কোনো তথ্য সম্পূর্ণ নিরাপদ নয়।"
        },
        {
          title: "কুকি",
          text: "আমাদের ওয়েবসাইট কুকি ব্যবহার করে ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে।"
        },
        {
          title: "তৃতীয় পক্ষ",
          text: "আমরা আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি, বাণিজ্য বা হস্তান্তর করি না।"
        },
        {
          title: "যোগাযোগ",
          text: "যদি আপনার এই গোপনীয়তা নীতি সম্পর্কে কোনো প্রশ্ন থাকে, তাহলে আমাদের সাথে যোগাযোগ করুন।"
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdate: "Last Updated: January 2026",
      intro: "The EyePress is committed to protecting our users' privacy. This Privacy Policy explains how we collect, use, and protect your information.",
      sections: [
        {
          title: "Information Collection",
          text: "We collect various information from you when you use our website. This includes: your name, email address, and any other information you provide when contacting us."
        },
        {
          title: "Information Use",
          text: "We use the information you provide to deliver our services, to contact you, and to improve our website."
        },
        {
          title: "Information Security",
          text: "We implement various security measures to protect your information. However, no information on the internet is completely secure."
        },
        {
          title: "Cookies",
          text: "Our website uses cookies to improve user experience."
        },
        {
          title: "Third Parties",
          text: "We do not sell, trade, or transfer your personal information to third parties."
        },
        {
          title: "Contact",
          text: "If you have any questions about this Privacy Policy, please contact us."
        }
      ]
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
          <p className="text-white/80 text-center">{c.lastUpdate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            {c.intro}
          </p>

          <div className="space-y-8">
            {c.sections.map((section, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-[#6C1312] mb-3">{section.title}</h2>
                <p className="text-gray-700 leading-relaxed">{section.text}</p>
              </div>
            ))}
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

export default PrivacyClient;
