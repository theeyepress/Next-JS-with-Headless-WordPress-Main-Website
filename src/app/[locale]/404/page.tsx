// src/app/[locale]/404/page.tsx

import React from "react";
import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NotFoundPage({ params }: PageProps) {
  const { locale } = await params;

  const labels = {
    title: locale === "bn" ? "পৃষ্ঠা পাওয়া যায়নি" : "Page Not Found",
    description: locale === "bn"
      ? "দুঃখিত, আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি বিদ্যমান নেই।"
      : "Sorry, the page you are looking for does not exist.",
    goHome: locale === "bn" ? "হোম পেজে যান" : "Go to Homepage",
    explore: locale === "bn" ? "অন্যান্য খবর" : "Explore Other News",
  };

  return (
    <main className="bg-gray-50 min-h-screen flex items-center justify-center pt-20 sm:pt-24 lg:pt-28">
      <div className="container mx-auto px-4 py-12 md:py-16 text-center">
        {/* 404 Visual */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-[#A41E22] text-7xl md:text-9xl font-bold opacity-20">404</h1>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{labels.title}</h2>
        <p className="text-gray-600 mb-6 md:mb-8 max-w-md mx-auto">{labels.description}</p>

        <Link
          href={`/${locale}`}
          className="inline-block px-8 py-3 bg-[#6C1312] text-white rounded-lg font-bold hover:bg-[#B42125] transition-all"
        >
          {labels.goHome}
        </Link>

        {/* Subscribe Section */}
        <div className="mt-16 max-w-lg mx-auto">
          <SubscribeForm variant="page" />
        </div>
      </div>
    </main>
  );
}
