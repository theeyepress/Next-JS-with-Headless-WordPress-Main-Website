// src/app/[locale]/register/RegisterClient.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";

type RegisterClientProps = {
  locale: string;
};

const RegisterClient: React.FC<RegisterClientProps> = ({ locale }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const content = {
    bn: {
      title: "আমাদের সাথে যোগ দিন",
      fullName: "পূর্ণ নাম",
      fullNamePlaceholder: "আপনার নাম",
      username: "ব্যবহারকারীর নাম",
      usernamePlaceholder: "একটি ব্যবহারকারীর নাম চয়ন করুন",
      email: "ইমেইল",
      emailPlaceholder: "আপনার ইমেইল ঠিকানা",
      password: "পাসওয়ার্ড",
      passwordPlaceholder: "একটি শক্তিশালী পাসওয়ার্ড",
      confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
      confirmPasswordPlaceholder: "পাসওয়ার্ড আবার লিখুন",
      minLength: "কমপক্ষে ৬ অক্ষর",
      uppercase: "একটি বড় অক্ষর",
      number: "একটি সংখ্যা",
      passwordMismatch: "পাসওয়ার্ড মিলছে না",
      registerBtn: "নিবন্ধন করুন",
      or: "অথবা",
      hasAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
      loginNow: "লগইন করুন",
      backToHome: "হোমপেজে ফিরে যান",
      registrationSuccess: "নিবন্ধন সফল! এখন লগইন করুন।",
      registrationFailed: "নিবন্ধন ব্যর্থ। আবার চেষ্টা করুন।",
    },
    en: {
      title: "Join us today",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your name",
      username: "Username",
      usernamePlaceholder: "Choose a username",
      email: "Email",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Create a password",
      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm your password",
      minLength: "At least 6 characters",
      uppercase: "One uppercase letter",
      number: "One number",
      passwordMismatch: "Passwords do not match",
      registerBtn: "Create Account",
      or: "OR",
      hasAccount: "Already have an account?",
      loginNow: "Sign In",
      backToHome: "Back to Home",
      registrationSuccess: "Registration successful! Please login.",
      registrationFailed: "Registration failed. Please try again.",
    },
  };

  const t = content[locale as keyof typeof content] || content.en;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    if (formData.password.length < 6) {
      setError(t.minLength);
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.theeyepress.com';
      
      const response = await fetch(`${API_URL}/wp-json/eyepress/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(t.registrationSuccess);
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 2000);
      } else {
        setError(data.message || t.registrationFailed);
      }
    } catch (err) {
      setError(t.registrationFailed);
    }
    
    setIsLoading(false);
  };

  const passwordRequirements = [
    { met: formData.password.length >= 6, text: t.minLength },
    { met: /[A-Z]/.test(formData.password), text: t.uppercase },
    { met: /[0-9]/.test(formData.password), text: t.number },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12 pt-24 sm:pt-28 lg:pt-32">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-block">
            <h1 className="text-3xl font-bold text-[#A41E22]">TheEyePress</h1>
          </Link>
          <p className="text-gray-600 mt-2">{t.title}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.fullName}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition-all"
                placeholder={t.fullNamePlaceholder}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.username}</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition-all"
                placeholder={t.usernamePlaceholder}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.email}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition-all"
                placeholder={t.emailPlaceholder}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition-all pr-12"
                  placeholder={t.passwordPlaceholder}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {req.met ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-gray-400" />}
                      <span className={req.met ? "text-green-600" : "text-gray-500"}>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.confirmPassword}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition-all"
                placeholder={t.confirmPasswordPlaceholder}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#6C1312] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#B42125] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {t.registerBtn}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t.or}</span>
            </div>
          </div>

          <p className="text-center text-gray-600">
            {t.hasAccount}{" "}
            <Link href={`/${locale}/login`} className="text-[#A41E22] font-semibold hover:underline">
              {t.loginNow}
            </Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href={`/${locale}`} className="text-gray-600 hover:text-[#A41E22]">
            ← {t.backToHome}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default RegisterClient;
