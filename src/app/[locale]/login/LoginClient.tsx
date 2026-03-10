// src/app/[locale]/login/LoginClient.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type LoginClientProps = {
  locale: string;
};

const LoginClient: React.FC<LoginClientProps> = ({ locale }) => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const content = {
    bn: {
      title: "আপনার অ্যাকাউন্টে লগইন করুন",
      usernamePlaceholder: "আপনার ব্যবহারকারীর নাম বা ইমেইল",
      passwordPlaceholder: "আপনার পাসওয়ার্ড",
      rememberMe: "মনে রাখুন",
      forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
      loginBtn: "লগইন করুন",
      or: "অথবা",
      noAccount: "অ্যাকাউন্ট নেই?",
      registerNow: "নিবন্ধন করুন",
      backToHome: "হোমপেজে ফিরে যান",
      loginSuccess: "লগইন সফল!",
      invalidCredentials: "ব্যবহারকারীর নাম বা পাসওয়ার্ড সঠিক নয়",
      connectionError: "সংযোগ সমস্যা। আবার চেষ্টা করুন।",
    },
    en: {
      title: "Sign in to your account",
      usernamePlaceholder: "Enter your username or email",
      passwordPlaceholder: "Enter your password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      loginBtn: "Sign In",
      or: "OR",
      noAccount: "Don't have an account?",
      registerNow: "Register Now",
      backToHome: "Back to Home",
      loginSuccess: "Login successful!",
      invalidCredentials: "Invalid username or password",
      connectionError: "Connection error. Please try again.",
    },
  };

  const t = content[locale as keyof typeof content] || content.en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.theeyepress.com';
      
      const response = await fetch(`${API_URL}/wp-json/eyepress/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('wp_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('wp_token', data.token);
        }
        setError(t.loginSuccess);
        setTimeout(() => {
          router.push(`/${locale}/profile`);
          router.refresh();
        }, 1000);
      } else {
        setError(data.message || t.invalidCredentials);
      }
    } catch (err) {
      setError(t.connectionError);
    }
    
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-block">
            <h1 className="text-3xl font-bold text-[#A41E22]">TheEyePress</h1>
          </Link>
          <p className="text-gray-600 mt-2">{t.title}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`px-4 py-3 rounded-lg text-sm ${error === t.loginSuccess ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {locale === 'bn' ? "ব্যবহারকারীর নাম / ইমেইল" : "Username / Email"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition-all"
                placeholder={t.usernamePlaceholder}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {locale === 'bn' ? "পাসওয়ার্ড" : "Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition-all pr-12"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-[#A41E22] border-gray-300 rounded focus:ring-[#A41E22]" />
                <span className="ml-2 text-sm text-gray-600">{t.rememberMe}</span>
              </label>
              <Link href={`/${locale}/forgot-password`} className="text-sm text-[#A41E22] hover:underline">
                {t.forgotPassword}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#A41E22] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#8B1510] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {t.loginBtn}
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
            {t.noAccount}{" "}
            <Link href={`/${locale}/register`} className="text-[#A41E22] font-semibold hover:underline">
              {t.registerNow}
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

export default LoginClient;
