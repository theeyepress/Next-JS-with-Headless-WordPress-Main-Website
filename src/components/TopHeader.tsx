// src/components/TopHeader.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

type TickerItem = {
  title: string;
  href: string;
};

type MenuItem = {
  label: string;
  url: string;
  childItems?: {
    nodes: MenuItem[];
  };
};

type TopHeaderProps = {
  siteIconUrl: string;
  tickerHTML: string;
  dateTimeHTML: string;
  menuItems?: MenuItem[];
};

const TopHeader: React.FC<TopHeaderProps> = ({
  siteIconUrl,
  tickerHTML,
  dateTimeHTML,
  menuItems = [],
}) => {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'bn';
  const t = useTranslations("TopHeader");
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);

  // Fetch ticker from REST API
  useEffect(() => {
    async function fetchTicker() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/ticker?locale=${locale}&count=10`);
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

  const [dateSlides, setDateSlides] = useState<string[]>([]);
  
  // Parse date HTML on client only (DOMParser not available on server)
  useEffect(() => {
    if (!dateTimeHTML) {
      const today = new Date();
      const bnDates = [
        getBengaliDate(today),
        getBengaliDate(new Date(today.getTime() - 86400000))
      ];
      setDateSlides(bnDates);
      return;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(dateTimeHTML, "text/html");
    const slides = doc.querySelectorAll(".datetime-slide, .datetime-slide-en");
    if (slides.length > 0) {
      const dates = Array.from(slides).map(s => s.textContent?.trim() || "").filter(d => d);
      if (dates.length > 1) {
        setDateSlides(dates.slice(0, 2));
      } else if (dates.length === 1) {
        setDateSlides([dates[0], locale === "bn" ? getBengaliDate(new Date()) : getEnglishDate(new Date())]);
      } else {
        setDateSlides([locale === "bn" ? getBengaliDate(new Date()) : getEnglishDate(new Date()), locale === "bn" ? getBengaliDate(new Date()) : getEnglishDate(new Date())]);
      }
    } else {
      let dateSlide = doc.querySelector(".datetime-slide");
      if (!dateSlide) {
        dateSlide = doc.querySelector(".datetime-slide-en");
      }
      const date = dateSlide?.textContent?.trim() || "";
      if (date) {
        setDateSlides([date, locale === "bn" ? getBengaliDate(new Date()) : getEnglishDate(new Date())]);
      } else {
        setDateSlides([locale === "bn" ? getBengaliDate(new Date()) : getEnglishDate(new Date()), locale === "bn" ? getBengaliDate(new Date()) : getEnglishDate(new Date())]);
      }
    }
  }, [dateTimeHTML, locale]);

  function getBengaliDate(date: Date) {
    const bnMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const bnDays = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
    const day = date.getDate();
    const month = bnMonths[date.getMonth()];
    const year = date.getFullYear();
    const dayName = bnDays[date.getDay()];
    return `${dayName}, ${day} ${month} ${year}`;
  }

  function getEnglishDate(date: Date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const dayName = days[date.getDay()];
    return `${dayName}, ${month} ${day}, ${year}`;
  }

  useEffect(() => {
    const bn_nums = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];

    function toBn(num: number) {
      return num.toString().split("").map(n => bn_nums[parseInt(n)] || n).join("");
    }

    const translations = {
      bn: { now: "এখন", morning: "সকাল", noon: "দুপুর", afternoon: "বিকেল", evening: "সন্ধ্যা", night: "রাত" },
      en: { now: "Now", morning: "Morning", noon: "Noon", afternoon: "Afternoon", evening: "Evening", night: "Night" }
    };

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

      const trans = translations[locale as keyof typeof translations] || translations.bn;
      const period = trans[periodKey as keyof typeof trans];
      const nowText = trans.now;

      const hrStr = hours < 10 ? "0" + hours : hours.toString();
      const minStr = minutes < 10 ? "0" + minutes : minutes.toString();
      const secStr = seconds < 10 ? "0" + seconds : seconds.toString();

      const timeStr = `${toBn(parseInt(hrStr))}:${toBn(parseInt(minStr))}:${toBn(parseInt(secStr))}`;

      setCurrentTime(`${nowText} ${period} - ${timeStr}`);
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [locale]);

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

  // Fix escaped slashes in href (e.g., "\/bn\/post" -> "/bn/post")
  const fixHref = (href: string) => {
    if (!href) return "#";
    return href.replace(/\\\/bn\\\//gi, '/bn/').replace(/\\\/en\\\//gi, '/en/');
  };

  return (
    <>
      <style jsx global>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-track {
          overflow: hidden;
          width: 100%;
        }
        .ticker-animate {
          animation: ticker-scroll 60s linear infinite;
          white-space: nowrap;
          width: max-content;
        }
        @media (max-width: 768px) {
          .ticker-animate {
            animation: ticker-scroll 40s linear infinite;
          }
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
        .datetime-slider:hover {
          animation-play-state: paused;
        }
        @media (max-width: 768px) {
          .datetime-slider {
            animation: slideVertical 8s ease-in-out infinite;
          }
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
      
      <div className="w-full bg-[#6c1312] text-white px-2 py-1.5 md:py-2 flex items-center justify-between sticky top-0 z-40" style={{ fontFamily: 'var(--font-bengali), sans-serif' }}>
        {/* Left - Menu Button + Site Icon */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            className="text-white focus:outline-none cursor-pointer p-1"
            onClick={() => setIsSideNavOpen(true)}
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
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
            <Image src={siteIconUrl} alt="Site Icon" width={48} height={48} className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain" />
          </a>
        </div>

        {/* Middle: Ticker - Show only on xl where there's room in header */}
        <div className="hidden xl:flex flex-1 mx-2 lg:mx-8 overflow-hidden items-center">
          {items.length > 0 && (
            <div className="flex items-center gap-2 w-full overflow-hidden">
              <span className="ticker-label whitespace-nowrap text-cyan-400 font-extrabold tracking-widest uppercase text-xs lg:text-base flex-shrink-0 z-10">
                {t('latest')}
              </span>
              <div className="ticker-track overflow-hidden flex-1 min-w-0">
                <div className="ticker-animate whitespace-nowrap">
                  {[...items, ...items, ...items].map((item, index) => (
                    <span key={index} className="ticker-item mx-0.5 inline-flex">
                      <a
                        href={fixHref(item.href)}
                        className="text-white hover:text-cyan-200 transition-colors text-xs lg:text-sm font-normal no-underline cursor-pointer"
                      >
                        {item.title}
                      </a>
                      <span className="text-cyan-300 mx-1 lg:mx-2">|</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Date/Time - Sliding between date and time */}
        <div className="flex items-center gap-1 md:gap-3 lg:gap-4">
          {currentTime && (
            <div 
              className="date-time text-xs md:text-sm whitespace-nowrap flex items-center"
              style={{ height: '1.5em', overflow: 'hidden' }}
            >
              <div className="datetime-slider h-[1.5em]">
                {/* Slide 1: Time */}
                <div className="h-[1.5em]" style={{ color: '#ffffff' }}>
                  {currentTime}
                </div>
                {/* Slide 2: Date */}
                <div className="h-[1.5em]" style={{ color: '#ffffff' }}>
                  {locale === "bn" ? (dateSlides[0] || getBengaliDate(new Date())) : getEnglishDate(new Date())}
                </div>
              </div>
            </div>
          )}
          <AuthButtons locale={locale} />
        </div>
      </div>

      {/* Side Navigation - Full Screen Mobile Menu */}
      {isSideNavOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100]" onClick={() => setIsSideNavOpen(false)}>
          <div className="fixed left-0 top-0 w-[280px] sm:w-[320px] h-full bg-white shadow-xl overflow-y-auto z-[101]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link href={`/${locale}`} className="flex items-center gap-3" onClick={() => setIsSideNavOpen(false)}>
                <Image src={siteIconUrl} alt="Site Icon" width={40} height={40} className="w-10 h-10 object-contain" />
                <span className="text-lg font-bold text-[#A41E22]">The EyePress</span>
              </Link>
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors" 
                onClick={() => setIsSideNavOpen(false)}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4">
              <Link 
                href={`/${locale}`} 
                className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-lg font-medium"
                onClick={() => setIsSideNavOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('home')}
              </Link>
              <Link 
                href={`/${locale}/about`} 
                className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-lg font-medium"
                onClick={() => setIsSideNavOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {locale === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}
              </Link>
              
              {/* Dynamic Menu Categories */}
              {menuItems.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">
                    {locale === 'bn' ? 'বিভাগসমূহ' : 'Categories'}
                  </p>
                  {menuItems.map((item, index) => (
                    <Link 
                      key={index}
                      href={item.url}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-800 hover:bg-gray-100 rounded-lg font-medium"
                      onClick={() => setIsSideNavOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
              
              <div className="border-t border-gray-200 my-2"></div>
              <Link 
                href={`/${locale}/contact`} 
                className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-lg font-medium"
                onClick={() => setIsSideNavOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {locale === 'bn' ? 'যোগাযোগ' : 'Contact'}
              </Link>
              <Link 
                href={`/${locale}/subscribe`} 
                className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-lg font-medium"
                onClick={() => setIsSideNavOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {locale === 'bn' ? 'সাবস্ক্রাইব' : 'Subscribe'}
              </Link>
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
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-1 sm:gap-3">
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
        >
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={32}
              height={32}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#A41E22] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-white text-xs sm:text-sm font-medium hidden md:inline">{user.name}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="bg-white text-[#a41e22] px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-md cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:bg-[#a41e22] hover:text-white border border-[#a41e22]"
        >
          <span className="hidden sm:inline">{locale === 'bn' ? "লগআউট" : "Logout"}</span>
          <span className="sm:hidden">↪</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <Link
        href={`/${locale}/login`}
        className="bg-white text-[#a41e22] px-2 sm:px-4 py-1 text-xs sm:text-sm font-bold rounded-md cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:bg-[#a41e22] hover:text-white border border-[#a41e22]"
      >
        <span className="hidden xs:inline">{locale === 'bn' ? "লগইন" : "Login"}</span>
        <span className="xs:hidden">👤</span>
      </Link>
      <Link
        href={`/${locale}/register`}
        className="hidden sm:inline-flex bg-[#a41e22] text-white px-3 sm:px-4 py-1 text-xs sm:text-sm font-bold rounded-md cursor-pointer ml-1 sm:ml-3 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:bg-[#6c1312]"
      >
        {locale === 'bn' ? "নিবন্ধন" : "Register"}
      </Link>
    </>
  );
};

export default TopHeader;
