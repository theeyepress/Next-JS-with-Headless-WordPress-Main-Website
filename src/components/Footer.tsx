// src/components/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type MenuItem = {
  label: string;
  url: string;
  ID?: number;
  childItems?: {
    nodes: MenuItem[];
  };
};

type FooterProps = {
  siteLogo?: string;
  locale?: string;
  menuItems?: MenuItem[];
};

const Footer: React.FC<FooterProps> = ({
  siteLogo,
  locale = "bn",
  menuItems = [],
}) => {
  const pathname = usePathname();
  
  const isActive = (url: string) => {
    if (!url) return false;
    const pathWithoutLocale = pathname.replace(/^\/(bn|en)/, '') || '/';
    const urlWithoutLocale = url.replace(/^\/(bn|en)/, '') || '/';
    return pathname === url || pathname.startsWith(url.replace(/\/$/, '')) || 
           pathWithoutLocale === urlWithoutLocale || 
           pathname.startsWith(urlWithoutLocale.replace(/\/$/, ''));
  };

  const currentYear = new Date().getFullYear();
  
  const labels = {
    about: locale === "bn" ? "আমাদের সম্পর্কে" : "About Us",
    categories: locale === "bn" ? "বিভাগসমূহ" : "Categories",
    quickLinks: locale === "bn" ? "দ্রুত লিংক" : "Quick Links",
    follow: locale === "bn" ? "অনুসরণ করুন" : "Follow Us",
    copyright: locale === "bn" 
      ? "সর্বস্বত্ব সংরক্ষিত। The EyePress" 
      : "All rights reserved. The EyePress",
    privacy: locale === "bn" ? "গোপনীয়তা নীতি" : "Privacy Policy",
    terms: locale === "bn" ? "ব্যবহারের শর্ত" : "Terms of Use",
    contact: locale === "bn" ? "যোগাযোগ" : "Contact",
  };

  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          {siteLogo ? (
            <Image 
              src={siteLogo} 
              alt="The EyePress" 
              width={500} 
              height={120}
              className="object-contain"
            />
          ) : (
            <span className="text-9xl font-bold text-white">TheEyePress</span>
          )}
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-[#A41E22] pb-2">
                {labels.about}
              </h3>
              <p className="text-white text-sm leading-relaxed">
                {locale === "bn" 
                  ? "The EyePress একটি স্বাধীন ডিজিটাল সংবাদ প্ল্যাটফর্ম। আমরা নির্ভরযোগ্য এবং সময়োপযোগী সংবাদ প্রদান করি।"
                  : "The EyePress is an independent digital news platform. We provide reliable and timely news coverage."}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-[#A41E22] pb-2">
                {labels.quickLinks}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href={`/${locale}`} className="text-white hover:text-[#A41E22] text-sm transition-colors">
                    {locale === "bn" ? "হোম" : "Home"}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/about`} className="text-white hover:text-[#A41E22] text-sm transition-colors">
                    {labels.about}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/contact`} className="text-white hover:text-[#A41E22] text-sm transition-colors">
                    {labels.contact}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/subscribe`} className="text-white hover:text-[#A41E22] text-sm transition-colors">
                    {locale === "bn" ? "সাবস্ক্রাইব" : "Subscribe"}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/privacy`} className="text-white hover:text-[#A41E22] text-sm transition-colors">
                    {labels.privacy}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/terms`} className="text-white hover:text-[#A41E22] text-sm transition-colors">
                    {labels.terms}
                  </Link>
                </li>
              </ul>
            </div>

            {menuItems.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-[#A41E22] pb-2">
                  {labels.categories}
                </h3>
                <ul className="space-y-2">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link 
                        href={item.url}
                        className="text-white hover:text-[#A41E22] text-sm transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-[#A41E22] pb-2">
                {labels.follow}
              </h3>
              <div className="flex gap-3 mb-4">
                <a 
                  href="https://www.facebook.com/theeyepress/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#A41E22] flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg className="w-5 h-5 text-white hover:text-[#A41E22]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.youtube.com/@theeyepress" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#A41E22] flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg className="w-5 h-5 text-white hover:text-[#A41E22]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a 
                  href="https://x.com/theeyepress" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#A41E22] flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg className="w-5 h-5 text-white hover:text-[#A41E22]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/theeyepress" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#A41E22] flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg className="w-5 h-5 text-white hover:text-[#A41E22]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 bg-black">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-white text-sm">
              © {currentYear} {labels.copyright}
            </p>
            <div className="flex gap-4">
              <Link href={`/${locale}/privacy`} className="text-white hover:text-[#A41E22] text-sm transition-colors">
                {labels.privacy}
              </Link>
              <Link href={`/${locale}/terms`} className="text-white hover:text-[#A41E22] text-sm transition-colors">
                {labels.terms}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
