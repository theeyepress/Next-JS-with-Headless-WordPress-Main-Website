// src/app/[locale]/terms/TermsClient.tsx
"use client";

import React from "react";
import AdBanner from "@/components/AdBanner";

type TermsClientProps = {
  locale: string;
};

const TermsClient = ({ locale }: TermsClientProps) => {
  const content = {
    bn: {
      title: "ব্যবহারের শর্ত",
      lastUpdate: "সর্বশেষ আপডেট: জানুয়ারি ২০২৬",
      intro: "এই ব্যবহারের শর্ত আমাদের ওয়েবসাইট ব্যবহারের জন্য প্রযোজ্য। আমাদের ওয়েবসাইট ব্যবহার করার আগে অনুগ্রহ করে এই শর্তগুলি মনোযোগ সহকারে পড়ুন।",
      sections: [
        {
          title: "সেবার ব্যবহার",
          text: "আপনি এই ওয়েবসাইট ব্যবহার করে সম্মত হন যে আপনি এই শর্তগুলি মেনে চলবেন। আপনি আমাদের ওয়েবসাইট ব্যবহার করবেন নির্ধারিত উদ্দেশ্যে এবং প্রযোজ্য আইন ও প্রবিধান অনুসারে।"
        },
        {
          title: "বুদ্ধিবৃত্তিক সম্পত্তি",
          text: "এই ওয়েবসাইটের সমস্ত বিষয়বস্তু, নিবন্ধ, ছবি এবং গ্রাফিক্স The EyePress-এর মালিকানাধীন এবং কপিরাইট আইন দ্বারা সুরক্ষিত।"
        },
        {
          title: "ব্যবহারকারীর দায়িত্ব",
          text: "আপনি দায়ী যে আপনি এই ওয়েবসাইটে এমন কোনো বিষয়বস্তু পোস্ট করবেন না যা অবৈধ, ক্ষতিকর বা আপত্তিকর।"
        },
        {
          title: "তৃতীয় পক্ষের লিংক",
          text: "আমাদের ওয়েবসাইটে তৃতীয় পক্ষের লিংক থাকতে পারে। আমরা এই সাইটগুলির বিষয়বস্তু বা গোপনীয়তা নীতির জন্য দায়ী নই।"
        },
        {
          title: "সীমাবদ্ধতা",
          text: "The EyePress কোনো ত্রুটি বা বিলম্বের জন্য দায়ী থাকবে না যা এই ওয়েবসাইটের ব্যবহার থেকে উদ্ভূত।"
        },
        {
          title: "পরিবর্তন",
          text: "আমরা যেকোনো সময় এই শর্তগুলি পরিবর্তন করার অধিকার সংরক্ষণ করি। পরিবর্তনগুলি এই পৃষ্ঠায় পোস্ট করা হবে।"
        }
      ]
    },
    en: {
      title: "Terms of Use",
      lastUpdate: "Last Updated: January 2026",
      intro: "These Terms of Use apply to your use of our website. Please read these terms carefully before using our website.",
      sections: [
        {
          title: "Use of Service",
          text: "By using this website, you agree to abide by these terms. You will use our website for its intended purpose and in accordance with applicable laws and regulations."
        },
        {
          title: "Intellectual Property",
          text: "All content, articles, images, and graphics on this website are owned by The EyePress and protected by copyright law."
        },
        {
          title: "User Responsibility",
          text: "You are responsible for not posting any content that is illegal, harmful, or offensive on this website."
        },
        {
          title: "Third Party Links",
          text: "Our website may contain links to third-party sites. We are not responsible for the content or privacy policies of these sites."
        },
        {
          title: "Limitation",
          text: "The EyePress shall not be liable for any errors or delays arising from the use of this website."
        },
        {
          title: "Changes",
          text: "We reserve the right to modify these terms at any time. Changes will be posted on this page."
        }
      ]
    }
  };

  const c = content[locale as keyof typeof content] || content.bn;

  return (
    <main className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#6C1312] via-[#8a1a1d] to-[#A41E22] py-16 pt-24 sm:pt-28 lg:pt-32">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 text-center">
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

export default TermsClient;
