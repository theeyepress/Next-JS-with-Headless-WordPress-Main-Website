// src/app/[locale]/profile/ProfileClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, LogOut, Loader2 } from "lucide-react";

type UserData = {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
};

type ProfileClientProps = {
  locale: string;
};

const ProfileClient: React.FC<ProfileClientProps> = ({ locale }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const content = {
    bn: {
      title: "প্রোফাইল",
      welcome: "স্বাগতম,",
      logout: "লগআউট",
      noUser: "কোনো ব্যবহারকারী পাওয়া যায়নি",
      loginPrompt: "অনুগ্রহ করে লগইন করুন",
      loginBtn: "লগইন করুন",
      role: "ভূমিকা",
    },
    en: {
      title: "Profile",
      welcome: "Welcome,",
      logout: "Logout",
      noUser: "No user found",
      loginPrompt: "Please login to continue",
      loginBtn: "Login",
      role: "Role",
    },
  };

  const t = content[locale as keyof typeof content] || content.en;

  useEffect(() => {
    const userData = localStorage.getItem('wp_user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem('wp_user');
        localStorage.removeItem('wp_token');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('wp_token');
    localStorage.removeItem('wp_user');
    router.push(`/${locale}/login`);
    router.refresh();
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#A41E22]" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.noUser}</h2>
            <p className="text-gray-600 mb-6">{t.loginPrompt}</p>
            <Link
              href={`/${locale}/login`}
              className="inline-block bg-[#A41E22] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#8B1510] transition-colors"
            >
              {t.loginBtn}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-block">
            <h1 className="text-3xl font-bold text-[#A41E22]">TheEyePress</h1>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">{t.title}</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-30 h-30 bg-[#A41E22] rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-800">{t.welcome} {user.name}</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-[#A41E22] mr-3" />
              <div>
                <p className="text-sm text-gray-500">{locale === 'bn' ? "ব্যবহারকারীর নাম" : "Username"}</p>
                <p className="font-medium text-gray-800">{user.username}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-[#A41E22] mr-3" />
              <div>
                <p className="text-sm text-gray-500">{locale === 'bn' ? "ইমেইল" : "Email"}</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-[#A41E22] mr-3" />
              <div>
                <p className="text-sm text-gray-500">{t.role}</p>
                <p className="font-medium text-gray-800 capitalize">{user.role || (locale === 'bn' ? "ব্যবহারকারী" : "User")}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-[#A41E22] text-[#A41E22] py-3 px-4 rounded-lg font-semibold hover:bg-[#A41E22] hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t.logout}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href={`/${locale}`} className="text-gray-600 hover:text-[#A41E22]">
            ← {locale === 'bn' ? "হোমপেজে ফিরে যান" : "Back to Home"}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ProfileClient;
