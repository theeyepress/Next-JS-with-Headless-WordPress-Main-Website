// src/app/[locale]/profile/ProfileClient.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, LogOut, Loader2, Camera, Check, X } from "lucide-react";

type UserData = {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
};

type SubscriptionStatus = {
  subscribed: boolean;
  email?: string;
  locale?: string;
  subscribed_at?: string;
};

type ProfileClientProps = {
  locale: string;
};

const ProfileClient: React.FC<ProfileClientProps> = ({ locale }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const content = {
    bn: {
      title: "প্রোফাইল",
      welcome: "স্বাগতম,",
      logout: "লগআউট",
      noUser: "কোনো ব্যবহারকারী পাওয়া যায়নি",
      loginPrompt: "অনুগ্রহ করে লগইন করুন",
      loginBtn: "লগইন করুন",
      role: "ভূমিকা",
      username: "ব্যবহারকারীর নাম",
      email: "ইমেইল",
      subscriptionStatus: "সাবস্ক্রিপশন স্ট্যাটাস",
      subscribed: "সাবস্ক্রাইবড",
      notSubscribed: "সাবস্ক্রাইব করেননি",
      unsubscribe: "আনসাবস্ক্রাইব",
      resubscribe: "আবার সাবস্ক্রাইব করুন",
      subscribedOn: "সাবস্ক্রাইব করেছেন",
      changePhoto: "ফটো পরিবর্তন করুন",
      updating: "আপডেট হচ্ছে...",
      backHome: "হোমপেজে ফিরে যান",
    },
    en: {
      title: "Profile",
      welcome: "Welcome,",
      logout: "Logout",
      noUser: "No user found",
      loginPrompt: "Please login to continue",
      loginBtn: "Login",
      role: "Role",
      username: "Username",
      email: "Email",
      subscriptionStatus: "Subscription Status",
      subscribed: "Subscribed",
      notSubscribed: "Not Subscribed",
      unsubscribe: "Unsubscribe",
      resubscribe: "Subscribe Again",
      subscribedOn: "Subscribed on",
      changePhoto: "Change Photo",
      updating: "Updating...",
      backHome: "Back to Home",
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

  useEffect(() => {
    if (user?.email) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user?.email) return;
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/subscription-status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        }
      );
      const data = await res.json();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user?.email) return;
    
    const confirmMsg = locale === 'bn' 
      ? "আপনি কি সত্যিই আনসাবস্ক্রাইব করতে চান?" 
      : "Are you sure you want to unsubscribe?";
    
    if (!confirm(confirmMsg)) return;
    
    setSubLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/unsubscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        }
      );
      const data = await res.json();
      
      if (data.success) {
        await checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
    setSubLoading(false);
  };

  const handleResubscribe = async () => {
    if (!user?.email) return;
    
    setSubLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/resubscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, locale })
        }
      );
      const data = await res.json();
      
      if (data.success) {
        await checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('Failed to resubscribe:', error);
    }
    setSubLoading(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('user_id', user.id.toString());
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/update-avatar`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const data = await res.json();
      
      if (data.success && data.avatar_url) {
        const updatedUser = { ...user, avatar: data.avatar_url };
        setUser(updatedUser);
        localStorage.setItem('wp_user', JSON.stringify(updatedUser));
      } else {
        console.error('Upload failed:', data.message);
        alert(data.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
    setIsUploading(false);
  };

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
              className="inline-block bg-[#A41E22] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#8a1a1d] transition-all"
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
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4 group">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-30 h-30 bg-[#A41E22] rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Camera overlay on hover */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-[#A41E22] text-white p-2 rounded-full shadow-lg hover:bg-[#8a1a1d] transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-[#A41E22] hover:underline font-medium"
            >
              {t.changePhoto}
            </button>
          </div>

          <h3 className="text-xl font-bold text-gray-800 text-center mb-6">
            {t.welcome} {user.name}
          </h3>

          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-[#A41E22] mr-3" />
              <div>
                <p className="text-sm text-gray-500">{t.username}</p>
                <p className="font-medium text-gray-800">{user.username}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-[#A41E22] mr-3" />
              <div>
                <p className="text-sm text-gray-500">{t.email}</p>
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

          {/* Subscription Status Section */}
          <div className="mt-6 p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #A41E22 0%, #8a1a1d 100%)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{t.subscriptionStatus}</p>
                <div className="flex items-center gap-2 mt-1">
                  {subscription?.subscribed ? (
                    <>
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-white font-bold">{t.subscribed}</span>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-bold">{t.notSubscribed}</span>
                    </>
                  )}
                </div>
                {subscription?.subscribed && subscription?.subscribed_at && (
                  <p className="text-white/60 text-xs mt-1">
                    {t.subscribedOn}: {new Date(subscription.subscribed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <button
                onClick={subscription?.subscribed ? handleUnsubscribe : handleResubscribe}
                disabled={subLoading}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  subscription?.subscribed
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-white text-[#A41E22] hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                {subLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  subscription?.subscribed ? t.unsubscribe : t.resubscribe
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-all"
            >
              <LogOut className="w-5 h-5" />
              {t.logout}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href={`/${locale}`} className="text-gray-600 hover:text-[#A41E22]">
            ← {t.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ProfileClient;
