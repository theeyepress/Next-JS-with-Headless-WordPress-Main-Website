// src/components/TopHeader.tsx
"use client";

import React, { useEffect, useState, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

type TickerItem = {
  title: string;
  href: string;
};

type TopHeaderProps = {
  siteIconUrl: string;
  tickerHTML: string;
  dateTimeHTML: string;
};

const TopHeader: React.FC<TopHeaderProps> = ({
  siteIconUrl,
  tickerHTML,
  dateTimeHTML,
}) => {
  const t = useTranslations("TopHeader");
  const locale = useLocale();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);

  // Fetch ticker from REST API with caching
  useEffect(() => {
    async function fetchTicker() {
      try {
        // Use ISR with 5-minute cache for better performance
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/ticker?locale=${locale}&count=10`, { 
          next: { revalidate: 300 } // 5 minutes cache
        });
        if (res.ok) {
          const data = await res.json();
          console.log(`Ticker fetched for ${locale}:`, data.length, 'posts');
          setTickerItems(data);
        }
      } catch (e) {
        console.log("REST ticker failed, using HTML fallback:", e);
      }
    }
    fetchTicker();
  }, [locale]);

  const [staticDate, setStaticDate] = useState("");
  
  // Parse date HTML on client only (DOMParser not available on server)
  useEffect(() => {
    if (!dateTimeHTML) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(dateTimeHTML, "text/html");
    let dateSlide = doc.querySelector(".datetime-slide");
    if (!dateSlide) {
      dateSlide = doc.querySelector(".datetime-slide-en");
    }
    setStaticDate(dateSlide?.textContent?.trim() || "");
  }, [dateTimeHTML]);

  useEffect(() => {
    const bn_nums = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];

    function toBn(num: number) {
      return num.toString().split("").map(n => bn_nums[parseInt(n)] || n).join("");
    }

    function updateTime() {
      const now = new Date();
      const hours24 = now.getHours();
      const hours = hours24 % 12 || 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      let periodKey = "";
      if (hours24 >= 6 && hours24 < 12) periodKey = "morning";
      else if (hours24 >= 12 && hours24 < 16) periodKey = "noon";
      else if (hours24 >= 16 && hours24 < 18) periodKey = "afternoon";
      else if (hours24 >= 18 && hours24 < 20) periodKey = "evening";
      else periodKey = "night";

      const period = t(periodKey);

      const hrStr = hours < 10 ? "0" + hours : hours.toString();
      const minStr = minutes < 10 ? "0" + minutes : minutes.toString();
      const secStr = seconds < 10 ? "0" + seconds : seconds.toString();

      const timeStr = locale === "bn" 
        ? `${toBn(parseInt(hrStr))}:${toBn(parseInt(minStr))}:${toBn(parseInt(secStr))}`
        : `${hrStr}:${minStr}:${secStr}`;

      setCurrentTime(`${t('now')} ${period} - ${timeStr}`);
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [t, locale]);

  // Parse ticker HTML fallback on client only
  const [parsedTickerItems, setParsedTickerItems] = useState<TickerItem[]>([]);
  useEffect(() => {
    if (!tickerHTML || tickerItems.length > 0) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(tickerHTML, "text/html");
    const itemElements = doc.querySelectorAll(".ticker-item a");
    const parsedItems: TickerItem[] = Array.from(itemElements).map((el) => ({
      title: el.textContent || "",
      href: el.getAttribute("href") || "#",
    }));
    setParsedTickerItems(parsedItems);
  }, [tickerHTML, tickerItems.length]);

  const items = tickerItems.length > 0 ? tickerItems : parsedTickerItems;

  return (
    <>
      <style jsx global>{`
        @keyframes ticker-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-66.67%, 0, 0);
          }
        }
        .ticker-animate {
          animation: ticker-scroll 90s linear infinite;
        }
        .ticker-animate:hover {
          animation-play-state: paused;
        }
        @keyframes slideVertical {
          0%, 40% { transform: translateY(0); }
          50%, 90% { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }
        .datetime-slider {
          animation: slideVertical 8s ease-in-out infinite;
        }
        @keyframes star-orbit {
          0% {
            transform: rotate(0deg) translateX(30px) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translateX(30px) rotate(-360deg);
            opacity: 0;
          }
        }
        @keyframes star-glow {
          0%, 100% {
            filter: drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 6px #ffffff);
          }
          50% {
            filter: drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 12px #ffffff);
          }
        }
        .icon-star-orbit {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .icon-star-orbit::before,
        .icon-star-orbit::after {
          content: '★';
          position: absolute;
          font-size: 12px;
          color: #ffffff;
          opacity: 0;
          transition: opacity 0.3s ease;
          animation: star-glow 1s ease-in-out infinite;
        }
        .icon-star-orbit:hover::before {
          opacity: 1;
          animation: star-orbit 2s linear infinite;
        }
        .icon-star-orbit:hover::after {
          opacity: 1;
          animation: star-orbit 2s linear infinite 1s;
        }
      `}</style>
      
      <div className="w-full bg-[#6c1312] text-white px-2.5 py-2 flex items-center justify-between" style={{ fontFamily: 'var(--font-bengali), sans-serif' }}>
        {/* Left */}
        <div className="flex items-center gap-6">
          <button
            className="text-white focus:outline-none cursor-pointer"
            onClick={() => setIsSideNavOpen(true)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <a href="/" className="icon-star-orbit">
            <Image src={siteIconUrl} alt="Site Icon" width={48} height={48} className="w-12 h-12 object-contain" />
          </a>
        </div>

        {/* Middle: Ticker */}
        <div className="flex-1 mx-8 overflow-hidden flex items-center">
          {items.length > 0 && (
            <div className="flex items-center gap-2 w-full overflow-hidden">
              <span className="ticker-label whitespace-nowrap text-cyan-400 font-extrabold tracking-widest uppercase text-base flex-shrink-0">
                {t('latest')}
              </span>
                <div className="ticker-track overflow-hidden flex-1" style={{ width: '100%' }}>
                <div className="ticker-animate flex whitespace-nowrap" style={{ width: 'max-content' }}>
                  {[...items, ...items, ...items].map((item, index) => (
                    <span key={index} className="ticker-item mx-0.5">
                      <a
                        href={item.href}
                        className="text-white hover:text-cyan-200 transition-colors text-sm font-normal no-underline cursor-pointer"
                      >
                        {item.title}
                      </a>
                      <span className="text-cyan-300 mx-2">|</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Date/Time + Links */}
        <div className="flex items-center gap-4">
          {(dateTimeHTML || staticDate) && (
            <div 
              className="date-time text-sm whitespace-nowrap ml-6"
              style={{ minWidth: "200px", textAlign: "center", height: "1.5em", overflow: "hidden", color: '#ffffff' }}
            >
              <div className="datetime-slider h-[1.5em]">
                <div className="h-[1.5em]" style={{ color: '#ffffff' }}>{currentTime || "..."}</div>
                <div className="h-[1.5em]" style={{ color: '#ffffff' }}>{staticDate || "..."}</div>
              </div>
            </div>
          )}
          <AuthButtons locale={locale} />
        </div>
      </div>

      {/* Side Navigation */}
      {isSideNavOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed left-0 top-0 w-64 h-full bg-white shadow-lg p-4">
            <button className="mb-4" onClick={() => setIsSideNavOpen(false)}>{t('close')}</button>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="hover:underline">{t('home')}</Link>
              <a href="/category/news" className="hover:underline">{t('news')}</a>
              <a href="/category/sports" className="hover:underline">{t('sports')}</a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

const AuthButtons: React.FC<{ locale: string }> = ({ locale }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  const checkAuth = () => {
    const token = localStorage.getItem('wp_token');
    const userData = localStorage.getItem('wp_user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem('wp_token');
        localStorage.removeItem('wp_user');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
    setHasChecked(true);
  };

  useEffect(() => {
    checkAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wp_user' || e.key === 'wp_token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('wp_token');
    localStorage.removeItem('wp_user');
    setUser(null);
    window.location.href = `/${locale}`;
  };

  if (isLoading || !hasChecked) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-[#A41E22] rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-white text-sm font-medium hidden md:inline">{user.name}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="bg-white text-[#a41e22] px-3 py-1.5 text-sm font-bold rounded-md cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:bg-[#a41e22] hover:text-white border border-[#a41e22]"
        >
          {locale === 'bn' ? "লগআউট" : "Logout"}
        </button>
      </div>
    );
  }

  return (
    <>
      <Link
        href={`/${locale}/login`}
        className="bg-white text-[#a41e22] px-4 py-1.5 text-sm font-bold rounded-md cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:bg-[#a41e22] hover:text-white border border-[#a41e22]"
      >
        {locale === 'bn' ? "লগইন" : "Login"}
      </Link>
      <Link
        href={`/${locale}/register`}
        className="bg-[#a41e22] text-white px-4 py-1.5 text-sm font-bold rounded-md cursor-pointer ml-3 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:bg-[#6c1312]"
      >
        {locale === 'bn' ? "নিবন্ধন" : "Register"}
      </Link>
    </>
  );
};

export default TopHeader;
