// src/app/[locale]/contact/ContactClient.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

type ContactClientProps = {
  locale: string;
};

const ContactClient = ({ locale }: ContactClientProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const content = {
    bn: {
      title: "যোগাযোগ",
      subtitle: "আমাদের সাথে যোগাযোগ করুন",
      name: "আপনার নাম",
      email: "ইমেইল",
      subject: "বিষয়",
      message: "আপনার বার্তা",
      send: "পাঠান",
      sending: "পাঠানো হচ্ছে...",
      success: "আপনার বার্তা সফলভাবে পাঠানো হয়েছে!",
      error: "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      contactInfo: "যোগাযোগের তথ্য",
      phone: "ফোন",
      address: "ঠিকানা",
      sendMessage: "বার্তা পাঠান",
      socialMedia: "সোশ্যাল মিডিয়া"
    },
    en: {
      title: "Contact",
      subtitle: "Get in Touch with Us",
      name: "Your Name",
      email: "Email",
      subject: "Subject",
      message: "Your Message",
      send: "Send",
      sending: "Sending...",
      success: "Your message has been sent successfully!",
      error: "Something went wrong. Please try again.",
      contactInfo: "Contact Information",
      phone: "Phone",
      address: "Address",
      sendMessage: "Send a Message",
      socialMedia: "Social Media"
    }
  };

  const c = content[locale as keyof typeof content] || content.bn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            locale
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <main className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#6C1312] via-[#8a1a1d] to-[#A41E22] py-16 pt-24 sm:pt-28 lg:pt-32">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 text-center">
            {c.title}
          </h1>
          <p className="text-xl text-white/80 text-center max-w-2xl mx-auto">
            {c.subtitle}
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-gray-50 p-6 md:p-8 rounded-lg">
            <h2 className="text-xl md:text-2xl font-bold text-[#6C1312] mb-4 md:mb-6">
              {c.sendMessage}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium text-sm md:text-base mb-1 md:mb-2">{c.name}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border border-gray-300 focus:border-[#6C1312] focus:ring-1 focus:ring-[#6C1312] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium text-sm md:text-base mb-1 md:mb-2">{c.email}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border border-gray-300 focus:border-[#6C1312] focus:ring-1 focus:ring-[#6C1312] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium text-sm md:text-base mb-1 md:mb-2">{c.subject}</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border border-gray-300 focus:border-[#6C1312] focus:ring-1 focus:ring-[#6C1312] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium text-sm md:text-base mb-1 md:mb-2">{c.message}</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border border-gray-300 focus:border-[#6C1312] focus:ring-1 focus:ring-[#6C1312] outline-none resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-2.5 md:py-3 bg-[#6C1312] text-white font-bold rounded-lg hover:bg-[#B42125] transition-all disabled:opacity-50"
              >
                {status === "loading" ? c.sending : c.send}
              </button>
              {status === "success" && (
                <p className="text-green-600 font-medium">{c.success}</p>
              )}
              {status === "error" && (
                <p className="text-red-600 font-medium">{c.error}</p>
              )}
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#6C1312] mb-4 md:mb-6">{c.contactInfo}</h2>
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#6C1312] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">{c.email}</h3>
                  <p className="text-gray-600 text-sm md:text-base">info@theeyepress.com</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#6C1312] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">{c.phone}</h3>
                  <p className="text-gray-600 text-sm md:text-base">01761-622666</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#6C1312] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">{c.address}</h3>
                  <p className="text-gray-600 text-sm md:text-base">78 Naya Paltan, Shanjari Tower, 1000</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 md:mt-8">
              <h3 className="font-bold text-gray-900 mb-4">
                {c.socialMedia}
              </h3>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/theeyepress/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#6C1312] flex items-center justify-center hover:bg-[#A41E22] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@theeyepress" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#6C1312] flex items-center justify-center hover:bg-[#A41E22] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="https://x.com/theeyepress" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#6C1312] flex items-center justify-center hover:bg-[#A41E22] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/theeyepress" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#6C1312] flex items-center justify-center hover:bg-[#A41E22] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
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

export default ContactClient;
