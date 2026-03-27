// src/components/Header.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  fetchCategorySlugs,
  translateSlug,
  isCategoryPage,
  getSlugFromPath,
  isPostPage,
  translatePostSlug,
  refreshCategorySlugs
} from "@/lib/categorySlugMap";
import NotificationBell from "@/components/NotificationBell";

type MenuItem = {
  label: string;
  url: string;
  childItems?: {
    nodes: MenuItem[];
  };
};

type Language = {
  code: string;
  name: string;
  url: string;
};

type SiteOptions = {
  logo?: string;
  urgentNotice?: string;
  siteIcon?: string;
};

type CategorySlugMap = {
  bn_slug: string;
  en_slug: string;
  bn_name: string;
  en_name: string;
};

type TickerItem = {
  title: string;
  href: string;
};

type HeaderProps = {
  siteOptions: SiteOptions;
  menuItems: MenuItem[];
  languages: Language[];
};

const Header: React.FC<HeaderProps> = ({ siteOptions, menuItems, languages }) => {
  const t = useTranslations("Header");
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<string>("bn");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categorySlugs, setCategorySlugs] = useState<CategorySlugMap[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch ticker for mobile
  useEffect(() => {
    async function fetchTicker() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/ticker?locale=${currentLang}&count=10`);
        if (res.ok) {
          const data = await res.json();
          setTickerItems(data);
        }
      } catch (e) {
        console.log("REST ticker failed:", e);
      }
    }
    fetchTicker();
  }, [currentLang]);

  // Check if a menu item is active
  const isActive = (url: string) => {
    if (!url) return false;
    // Remove locale prefix from pathname for comparison
    const pathWithoutLocale = pathname.replace(/^\/(bn|en)/, '') || '/';
    const urlWithoutLocale = url.replace(/^\/(bn|en)/, '') || '/';
    // Exact match or if pathname starts with the URL (for category pages)
    return pathname === url || pathname.startsWith(url.replace(/\/$/, '')) || 
           pathWithoutLocale === urlWithoutLocale || 
           pathname.startsWith(urlWithoutLocale.replace(/\/$/, ''));
  };

  // Fetch category slugs on mount
  useEffect(() => {
    fetchCategorySlugs().then(setCategorySlugs);
  }, []);

  // Helper function to generate fallback slug (for when API fails)
  const generateFallbackSlug = (slug: string, toLocale: string): string => {
    // Simple transliteration fallback
    const bnToEn: Record<string, string> = {
      'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri',
      'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
      'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
      'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
      'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
      'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
      'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
      'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
      'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't',
      'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
      'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
      ' ': '-', '_': '-'
    };
    
    let result = '';
    const lowerSlug = slug.toLowerCase();
    
    for (const char of lowerSlug) {
      if (bnToEn[char]) {
        result += bnToEn[char];
      } else if (/[a-z0-9]/.test(char)) {
        result += char;
      }
    }
    
    result = result.replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // Add suffix for English posts
    if (toLocale === 'en' && !result.endsWith('-en')) {
      result = result + '-en';
    }
    
    return result;
  };

  // Also fetch fresh slugs when language switch is attempted
  const handleLanguageSwitch = async () => {
    const newLang = currentLang === "bn" ? "en" : "bn";
    const path = window.location.pathname;
    
    // Parse the path
    const parts = path.split('/').filter(Boolean);
    const firstPart = parts[0];
    
    let newPath = '';
    
    // Check if this is a category page: /bn/category/slug or /en/category/slug
    const categoryIndex = parts.indexOf('category');
    if (categoryIndex !== -1 && parts[categoryIndex + 1]) {
      // Category page - use API to find translation
      let currentSlug = parts[categoryIndex + 1];
      
      try {
        // Get categories in both languages to find the translation
        const wpUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.theeyepress.com';
        
        // Fetch both bn and en categories
        const [bnRes, enRes] = await Promise.all([
          fetch(`${wpUrl}/wp-json/eyepress/v1/categories?locale=bn`),
          fetch(`${wpUrl}/wp-json/eyepress/v1/categories?locale=en`)
        ]);
        
        if (bnRes.ok && enRes.ok) {
          const bnCategories = await bnRes.json();
          const enCategories = await enRes.json();
          
          // Find current category in the appropriate list
          const currentCategories = currentLang === 'bn' ? bnCategories : enCategories;
          const targetCategories = currentLang === 'bn' ? enCategories : bnCategories;
          
          // Find the category by slug
          const currentCat = currentCategories.find((c: any) => 
            c.slug === currentSlug || 
            c.slug === decodeURIComponent(currentSlug)
          );
          
          if (currentCat && currentCat.translation_group_id) {
            // Find the translation by matching translation_group_id
            const translatedCat = targetCategories.find((c: any) => 
              c.translation_group_id === currentCat.translation_group_id
            );
            
            if (translatedCat) {
              parts[0] = newLang;
              parts[categoryIndex + 1] = translatedCat.slug;
              newPath = '/' + parts.join('/');
              console.log('Found category translation:', translatedCat.slug);
            } else {
              // No translation found - use fallback
              const fallbackSlug = generateFallbackSlug(currentSlug, newLang);
              parts[0] = newLang;
              parts[categoryIndex + 1] = fallbackSlug;
              newPath = '/' + parts.join('/');
            }
          } else {
            // Category not found by translation_group_id - use fallback
            const fallbackSlug = generateFallbackSlug(currentSlug, newLang);
            parts[0] = newLang;
            parts[categoryIndex + 1] = fallbackSlug;
            newPath = '/' + parts.join('/');
          }
        } else {
          // API failed - use fallback
          const fallbackSlug = generateFallbackSlug(currentSlug, newLang);
          parts[0] = newLang;
          parts[categoryIndex + 1] = fallbackSlug;
          newPath = '/' + parts.join('/');
        }
      } catch (error) {
        console.error('Category language switch error:', error);
        // Fallback
        const fallbackSlug = generateFallbackSlug(currentSlug, newLang);
        parts[0] = newLang;
        parts[categoryIndex + 1] = fallbackSlug;
        newPath = '/' + parts.join('/');
      }
    }
    // Static pages: about, contact, subscribe, privacy, terms, search, login, register, profile
    else if ((firstPart === 'bn' || firstPart === 'en') && parts.length === 2) {
      const staticPages = ['about', 'contact', 'subscribe', 'privacy', 'terms', 'search', 'login', 'register', 'profile'];
      const pageSlug = parts[1];
      
      if (staticPages.includes(pageSlug)) {
        // Static page - just switch locale
        parts[0] = newLang;
        newPath = '/' + parts.join('/');
      } else {
        // Could be a post - try translation API
        const postSlug = parts[1];
        let translatedPostSlug = null;
        
        try {
          const wpUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.theeyepress.com';
          const response = await fetch(
            `${wpUrl}/wp-json/eyepress/v1/post-translation/${postSlug}?locale=${newLang}`
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log('Translation API response:', data);
            
            if (data.found && data.slug) {
              translatedPostSlug = data.slug;
              parts[0] = newLang;
              parts[1] = translatedPostSlug;
              newPath = '/' + parts.join('/');
              console.log('Found translation, redirecting to:', newPath);
            } else {
              const fallbackSlug = generateFallbackSlug(postSlug, newLang);
              console.log('No translation found, using fallback:', fallbackSlug);
              
              if (fallbackSlug !== postSlug && fallbackSlug !== postSlug + '-en') {
                parts[0] = newLang;
                parts[1] = fallbackSlug;
                newPath = '/' + parts.join('/');
              } else {
                alert(currentLang === 'bn' 
                  ? 'এই পোস্টের ইংরেজি অনুবাদ এখনো হয়নি। শীঘ্রই আসবে।' 
                  : 'Translation coming soon! This post is not yet available in English.');
                return;
              }
            }
          } else {
            const fallbackSlug = generateFallbackSlug(postSlug, newLang);
            parts[0] = newLang;
            parts[1] = fallbackSlug;
            newPath = '/' + parts.join('/');
          }
        } catch (error) {
          console.error('Language switch error:', error);
          const fallbackSlug = generateFallbackSlug(postSlug, newLang);
          parts[0] = newLang;
          parts[1] = fallbackSlug;
          newPath = '/' + parts.join('/');
        }
      }
    }
    // Check if this is a post page: /bn/slug or /en/slug
    else if ((firstPart === 'bn' || firstPart === 'en') && parts.length >= 2) {
      const postSlug = parts[1];
      let translatedPostSlug = null;
      
      try {
        // Call REST API to get translation
        const wpUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.theeyepress.com';
        const response = await fetch(
          `${wpUrl}/wp-json/eyepress/v1/post-translation/${postSlug}?locale=${newLang}`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('Translation API response:', data);
          
          if (data.found && data.slug) {
            // Translation exists - redirect to translated post
            translatedPostSlug = data.slug;
            parts[0] = newLang; // Switch locale!
            parts[1] = translatedPostSlug;
            newPath = '/' + parts.join('/');
            console.log('Found translation, redirecting to:', newPath);
          } else {
            // Try fallback slug generation
            const fallbackSlug = generateFallbackSlug(postSlug, newLang);
            console.log('No translation found, using fallback:', fallbackSlug);
            
            // Check if fallback might work (not just the original slug)
            if (fallbackSlug !== postSlug && fallbackSlug !== postSlug + '-en') {
              parts[0] = newLang;
              parts[1] = fallbackSlug;
              newPath = '/' + parts.join('/');
            } else {
              // No translation - show message
              alert(currentLang === 'bn' 
                ? 'এই পোস্টের ইংরেজি অনুবাদ এখনো হয়নি। শীঘ্রই আসবে।' 
                : 'Translation coming soon! This post is not yet available in English.');
              return;
            }
          }
        } else {
          // API error - fallback to slug generation
          const fallbackSlug = generateFallbackSlug(postSlug, newLang);
          parts[0] = newLang;
          parts[1] = fallbackSlug;
          newPath = '/' + parts.join('/');
        }
      } catch (error) {
        console.error('Language switch error:', error);
        // Fallback: generate slug
        const fallbackSlug = generateFallbackSlug(postSlug, newLang);
        parts[0] = newLang;
        parts[1] = fallbackSlug;
        newPath = '/' + parts.join('/');
      }
    }
    // Homepage or other pages
    else if (firstPart === 'bn' || firstPart === 'en') {
      parts[0] = newLang;
      newPath = '/' + parts.join('/');
    } else {
      // No locale in URL
      newPath = '/' + newLang;
    }
    
    window.location.href = newPath || '/';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/${currentLang}/search?q=${encodeURIComponent(searchQuery)}`;
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts[0] === 'en') {
      setCurrentLang("en");
    } else {
      setCurrentLang("bn");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  const toggleDropdown = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  const hasChildren = (item: MenuItem) => item.childItems && item.childItems.nodes.length > 0;

  return (
    <>
      {/* Preload logo images to prevent buffering during scroll */}
      {siteOptions?.logo && (
        <link rel="preload" as="image" href={siteOptions.logo} />
      )}
      {siteOptions?.siteIcon && (
        <link rel="preload" as="image" href={siteOptions.siteIcon} />
      )}
      
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
          overflow: visible;
        }
        .ticker-animate {
          animation: ticker-scroll 50s linear infinite;
          display: inline-flex;
          flex-wrap: nowrap;
        }
        @media (max-width: 768px) {
          .ticker-animate {
            animation: ticker-scroll 35s linear infinite;
          }
        }
        .ticker-animate:hover {
          animation-play-state: paused;
        }
        @keyframes urgent-blink {
          0%, 90% { opacity: 1; }
          95% { opacity: 0; }
          100% { opacity: 1; }
        }
        .urgent-blink {
          animation: urgent-blink 10s ease-in-out infinite;
        }
        @keyframes red-dot-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(164, 30, 34, 0.7);
          }
          50% { 
            transform: scale(1.1);
            box-shadow: 0 0 0 6px rgba(164, 30, 34, 0);
          }
        }
        .red-dot-pulse {
          animation: red-dot-pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(164, 30, 34, 0.3);
          }
          50% { 
            box-shadow: 0 0 15px rgba(164, 30, 34, 0.6);
          }
        }
        .lang-btn-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        /* Star spinning animation for TRENDING/আলোচিত label */
        @keyframes star-orbit-always {
          0% {
            transform: rotate(0deg) translateX(22px) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translateX(22px) rotate(-360deg);
            opacity: 0;
          }
        }
        @keyframes star-glow-always {
          0%, 100% {
            filter: drop-shadow(0 0 3px #6C1312) drop-shadow(0 0 6px #6C1312);
          }
          50% {
            filter: drop-shadow(0 0 6px #6C1312) drop-shadow(0 0 10px #6C1312);
          }
        }
        .trending-star::before,
        .trending-star::after {
          content: '★';
          position: absolute;
          font-size: 11px;
          color: #A41E22;
          opacity: 0;
          animation: star-glow-always 1s ease-in-out infinite;
        }
        
        @keyframes star-glow-always {
          0%, 100% {
            filter: drop-shadow(0 0 3px #A41E22) drop-shadow(0 0 6px #A41E22);
          }
          50% {
            filter: drop-shadow(0 0 6px #A41E22) drop-shadow(0 0 10px #A41E22);
          }
        }
        
        .trending-star::before {
          left: -15px;
          animation: star-orbit-always 2.5s linear infinite;
        }
        .trending-star::after {
          left: -15px;
          animation: star-orbit-always 2.5s linear infinite 1.25s;
        }
        
        /* Logo Star Orbit Animation - Rectangular border path */
        @keyframes star-glow-logo {
          0%, 100% {
            filter: drop-shadow(0 0 3px #A41E22) drop-shadow(0 0 6px #A41E22);
          }
          50% {
            filter: drop-shadow(0 0 6px #A41E22) drop-shadow(0 0 12px #A41E22);
          }
        }
        
        .logo-star-orbit {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .logo-star-orbit::before,
        .logo-star-orbit::after {
          content: '★';
          position: absolute;
          font-size: 16px;
          color: #A41E22;
          opacity: 0;
          z-index: 2;
          filter: drop-shadow(0 0 8px #A41E22) drop-shadow(0 0 16px #A41E22);
          top: 0;
          left: 0;
        }
        
        .logo-star-orbit::before {
          animation: star-corner-path 8s linear infinite;
          animation-play-state: paused;
        }
        
        .logo-star-orbit::after {
          font-size: 14px;
          opacity: 0.6;
          filter: drop-shadow(0 0 4px #A41E22);
          animation: star-corner-path 8s linear infinite;
          animation-delay: -4s;
          animation-play-state: paused;
        }
        
        .logo-star-orbit:hover::before,
        .logo-star-orbit:hover::after {
          opacity: 1;
          animation-play-state: running;
        }
        
        @keyframes star-corner-path {
          0% {
            top: -8px;
            left: -8px;
          }
          25% {
            top: -8px;
            left: calc(100% + 8px);
          }
          50% {
            top: calc(100% + 8px);
            left: calc(100% + 8px);
          }
          75% {
            top: calc(100% + 8px);
            left: -8px;
          }
          100% {
            top: -8px;
            left: -8px;
          }
        }
        
        /* Menu item hover - HIGH VISIBILITY on white bg */
        .menu-item-wrapper {
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .menu-item-wrapper:hover {
          transform: translateY(-3px);
        }
        .menu-item-wrapper:hover .menu-item-text {
          color: #A41E22 !important;
        }
        .menu-item-wrapper::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 10%;
          height: 3px;
          width: 0;
          background: linear-gradient(90deg, #A41E22, #6C1312);
          transition: all 0.3s ease;
          border-radius: 2px;
        }
        .menu-item-wrapper:hover::after {
          width: 80%;
        }
        .menu-item-wrapper:hover .menu-icon {
          color: #A41E22 !important;
        }
        
        /* Logo transition */
        .logo-container {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .logo-image {
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* Smooth header transitions */
        .header-content {
          transition: padding 0.3s ease, background-color 0.3s ease;
        }
        
        /* Prevent layout shift during logo swap */
        .logo-wrapper {
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          will-change: transform, opacity;
        }
        
        /* GPU acceleration for smooth scrolling */
        .sticky-header {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>

      <header 
        className="fixed top-[34px] sm:top-[38px] lg:top-[42px] left-0 right-0 w-full bg-white/95 backdrop-blur-md shadow-md z-50 transition-shadow duration-300 sticky-header"
        ref={dropdownRef}
      >
        <div className="mx-auto flex items-center justify-between px-2 md:px-4 py-2 md:py-2.5">
          
          {/* Mobile Menu Button + Notification Bell - Left */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[#A41E22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {/* Notification Bell - Only on mobile (< 768px) */}
            <div className="lg:hidden">
              <NotificationBell locale={currentLang} />
            </div>
            
            {/* Urgent Notice - Hidden on mobile, shown on md+ */}
            {siteOptions?.urgentNotice ? (
              <div 
                className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-md text-[#A41E22] text-xs font-medium cursor-default"
                style={{ 
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #e0e0e0",
                }}
              >
                <span style={{ fontWeight: 800, color: "#A41E22", textTransform: "uppercase" }}>
                  {currentLang === "en" ? "Notice:" : "নোটিশ:"}
                </span>
                <span className="whitespace-nowrap urgent-blink" style={{ 
                  animationDuration: '4s',
                  color: "#A41E22",
                  fontWeight: 600
                }}>
                  {siteOptions.urgentNotice}
                </span>
              </div>
            ) : null}
          </div>

          {/* Center - Logo - Responsive */}
          <div className="flex-1 flex justify-center px-1 md:px-2 pt-2 md:pt-4 lg:pt-5">
            <div className="logo-star-orbit logo-container">
              <div className="logo-wrapper">
                {siteOptions?.logo ? (
                  <Link href="/">
                    {/* Show both images but toggle visibility for smooth transition */}
                    <div className="relative flex items-center justify-center">
                      {/* Large logo - shown when not scrolled */}
                      <img 
                        src={siteOptions.logo} 
                        alt="Site Logo" 
                        className={`h-10 w-auto md:h-12 xl:h-14 object-contain transition-all duration-300 ease-out ${
                          isScrolled ? 'opacity-0 scale-90 absolute' : 'opacity-100'
                        }`}
                      />
                      {/* Small icon - shown when scrolled */}
                      {siteOptions.siteIcon ? (
                        <img 
                          src={siteOptions.siteIcon} 
                          alt="Site Icon" 
                          className={`h-10 w-10 md:h-10 md:w-10 object-contain transition-all duration-300 ease-out ${
                            isScrolled ? 'opacity-100' : 'opacity-0 scale-90 absolute'
                          }`}
                        />
                      ) : (
                        <img 
                          src={siteOptions.logo} 
                          alt="Site Icon" 
                          className={`h-10 w-10 md:h-10 md:w-10 object-contain transition-all duration-300 ease-out ${
                            isScrolled ? 'opacity-100' : 'opacity-0 scale-90 absolute'
                          }`}
                        />
                      )}
                    </div>
                  </Link>
                ) : (
                  <Link href="/" className={`text-[#A41E22] font-bold transition-all duration-300 ${isScrolled ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}>
                    The EyePress
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right - Search + Live + Language - Compact on mobile */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Notification Bell - Only show on lg+ screens */}
            <div className="hidden lg:block">
              <NotificationBell locale={currentLang} />
            </div>
            
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full text-[#A41E22] font-semibold text-sm transition-all cursor-pointer hover:bg-gray-100"
              title={currentLang === "bn" ? "অনুসন্ধান" : "Search"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Live Button */}
            <a
              href="https://www.youtube.com/@TheEyePress"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-md text-[#A41E22] font-semibold text-xs md:text-sm transition-all cursor-pointer hover:bg-gray-200"
              style={{ 
                backgroundColor: "#f5f5f5",
                border: "1px solid #e0e0e0"
              }}
            >
              <span className="red-dot-pulse w-2 h-2 rounded-full" style={{ backgroundColor: "#A41E22" }}></span>
              <span style={{ fontWeight: 700, color: "#A41E22" }}>
                {currentLang === "en" ? "LIVE" : "লাইভ"}
              </span>
            </a>
            
            {/* Subscribe Button - Temporary replacement for language switcher */}
            <a
              href={`/${currentLang}/subscribe`}
              className="flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-full font-semibold text-xs md:text-sm transition-all cursor-pointer hover:brightness-110 hover:scale-105 text-white"
              style={{ 
                backgroundColor: "#6C1312",
              }}
            >
              <span className="font-bold hidden xs:inline text-white">
                {currentLang === "bn" ? "সাবস্ক্রাইব" : "Subscribe"}
              </span>
              <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </a>
          </div>
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
        <div className="hidden xl:block border-t border-gray-100">
          <nav className="flex items-center justify-center gap-0 px-2 py-1" style={{ fontFamily: "var(--font-bengali), sans-serif" }}>
            {/* TRENDING label */}
            <div 
              className="trending-star relative px-3 py-1.5 rounded-md text-white font-semibold text-sm mr-2 flex items-center"
              style={{ backgroundColor: "#6C1312" }}
            >
              <span style={{ color: "#ffffff" }}>
                {currentLang === "en" ? "TRENDING" : "আলোচিত"}
              </span>
            </div>

            {/* Menu Items */}
            {menuItems.map((item, index) => {
              const isItemActive = isActive(item.url);
              return (
              <div key={index} className="relative">
                {hasChildren(item) ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`menu-item-wrapper flex items-center gap-0.5 px-2 py-1.5 font-bold text-xs rounded-md transition-all cursor-pointer ${currentLang === 'en' ? 'capitalize' : 'uppercase'} tracking-wide ${
                        isItemActive ? 'bg-[#6C1312]' : 'hover:bg-gray-50'
                      }`}
                      style={{ 
                        fontWeight: 600,
                        color: isItemActive ? '#ffffff !important' : '#1a1a1a',
                        backgroundColor: isItemActive ? '#6C1312' : 'transparent'
                      }}
                    >
                      <span className="menu-item-text" style={{ color: isItemActive ? '#ffffff !important' : '#1a1a1a' }}>{item.label}</span>
                      <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke={isItemActive ? '#ffffff' : 'currentColor'} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown */}
                    {activeDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-1 py-2 min-w-[180px] rounded-md shadow-xl z-50 bg-white border border-gray-200">
                        {item.childItems?.nodes.map((child, childIndex) => {
                          const isChildActive = isActive(child.url);
                          return (
                            <a
                              key={childIndex}
                              href={child.url}
                              className={`menu-item-wrapper block px-3 py-2 font-bold text-xs transition-all no-underline ${currentLang === 'en' ? 'capitalize' : 'uppercase'} tracking-wide ${
                                isChildActive ? 'bg-[#6C1312]' : 'hover:bg-gray-50'
                              }`}
                            style={{ 
                              fontWeight: 600,
                              color: isChildActive ? '#ffffff !important' : '#1a1a1a',
                              backgroundColor: isChildActive ? '#6C1312' : 'transparent'
                            }}
                          >
                            <span className="menu-item-text" style={{ color: isChildActive ? '#ffffff !important' : '#1a1a1a' }}>{child.label}</span>
                          </a>
                        );})}
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href={item.url}
                    className={`menu-item-wrapper px-2 py-1.5 font-bold text-xs rounded-md transition-all no-underline ${currentLang === 'en' ? 'capitalize' : 'uppercase'} tracking-wide ${
                      isItemActive ? 'bg-[#6C1312]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="menu-item-text" style={{ color: isItemActive ? '#ffffff !important' : '#1a1a1a' }}>{item.label}</span>
                  </a>
                )}
              </div>
            );})}
          </nav>
        </div>

        {/* Mobile Menu Dropdown with Overlay */}
        {isMobileMenuOpen && (
          <>
            {/* Overlay - click to close */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div ref={mobileMenuRef} className="xl:hidden border-t border-gray-100 bg-white fixed top-auto left-0 right-0 z-50 shadow-lg">
              <nav className="flex flex-col py-2 px-2 max-h-[70vh] overflow-y-auto" style={{ fontFamily: "var(--font-bengali), sans-serif" }}>
              {menuItems.map((item, index) => {
                const isItemActive = isActive(item.url);
                return (
                <div key={index} className="border-b border-gray-100 last:border-0">
                  {hasChildren(item) ? (
                    <>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={`flex items-center justify-between w-full px-3 py-2.5 font-bold text-sm transition-all cursor-pointer ${
                          isItemActive ? 'text-[#A41E22]' : 'text-gray-800'
                        }`}
                      >
                        <span>{item.label}</span>
                        <svg className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === item.label ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {activeDropdown === item.label && (
                        <div className="pl-4 pb-2">
                          {item.childItems?.nodes.map((child, childIndex) => {
                            const isChildActive = isActive(child.url);
                            return (
                            <a
                              key={childIndex}
                              href={child.url}
                              className={`block px-3 py-2 text-sm font-medium transition-colors ${
                                isChildActive ? 'text-[#A41E22] bg-gray-50' : 'text-gray-600 hover:text-[#A41E22]'
                              }`}
                            >
                              {child.label}
                            </a>
                          );})}
                        </div>
                      )}
                    </>
                  ) : (
                    <a
                      href={item.url}
                      className={`block px-3 py-2.5 font-bold text-sm transition-colors ${
                        isItemActive ? 'text-[#A41E22] bg-red-50' : 'text-gray-800 hover:text-[#A41E22]'
                      }`}
                    >
                      {item.label}
                    </a>
                  )}
                </div>
              );})}
            </nav>
          </div>
          </>
        )}

        {/* Mobile Ticker - Under Logo - Show on xs to lg (below xl where TopHeader has ticker) */}
        {tickerItems.length > 0 && (
          <div className="xl:hidden px-2 py-2 bg-[#A41E22]" style={{ fontFamily: "var(--font-bengali), sans-serif" }}>
            <div className="flex items-center overflow-hidden">
              <span className="font-extrabold uppercase text-xs flex-shrink-0 whitespace-nowrap px-3 py-1" style={{ backgroundColor: '#A41E22', color: '#ffffff', zIndex: 10 }}>
                {currentLang === "bn" ? "সর্বশেষ:" : "LATEST:"}
              </span>
              <div className="flex overflow-hidden whitespace-nowrap" style={{ zIndex: 1 }}>
                <div className="ticker-animate flex" style={{ width: 'max-content' }}>
                  {[...tickerItems, ...tickerItems].map((item, index) => (
                    <Link 
                      key={index} 
                      href={item.href.replace(/\\\/bn\\\//gi, '/bn/').replace(/\\\/en\\\//gi, '/en/')}
                      className="text-white hover:text-cyan-200 text-xs mx-2 transition-colors"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Urgent Notice - Only show if no ticker */}
        {!tickerItems.length && siteOptions?.urgentNotice && (
          <div className="xl:hidden px-2 py-1.5" style={{ backgroundColor: "#f5f5f5", borderTop: "1px solid #e0e0e0" }}>
            <div className="flex items-center justify-center gap-1.5 text-[#A41E22] text-xs font-medium">
              <span style={{ fontWeight: 800, textTransform: "uppercase" }}>
                {currentLang === "en" ? "Notice:" : "নোটিশ:"}
              </span>
              <span className="whitespace-nowrap urgent-blink" style={{ animationDuration: '4s', fontWeight: 600 }}>
                {siteOptions.urgentNotice}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Search Modal - Responsive */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-start justify-center pt-20 md:pt-24 px-2 md:px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: "white" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            <div className="p-3 md:p-6 border-b" style={{ borderColor: "#e0e0e0" }}>
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={currentLang === "bn" ? "এখানে খুঁজুন..." : "Search here..."}
                  className="w-full px-4 py-3 pl-10 md:pl-14 text-base md:text-lg rounded-lg outline-none text-gray-900 placeholder-gray-400"
                  style={{ border: "2px solid #A41E22", backgroundColor: "#fff" }}
                />
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-[#A41E22]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button 
                  type="submit"
                  className="absolute right-1.5 top-1/2 transform -translate-y-1/2 px-4 md:px-6 py-2 rounded-lg text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#A41E22" }}
                >
                  {currentLang === "bn" ? "খুঁজুন" : "Search"}
                </button>
              </form>
            </div>
            
            {/* Search Suggestions */}
            <div className="p-3 md:p-6">
              <p className="text-sm font-semibold text-gray-700 mb-2 md:mb-3">
                {currentLang === "bn" ? "জনপ্রিয় অনুসন্ধান:" : "Popular searches:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {["Breaking News", "Politics", "Sports", "Technology"].map((term, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchQuery(currentLang === "bn" ? 
                        (term === "Breaking News" ? "জরুরি খবর" : 
                         term === "Politics" ? "রাজনীতি" :
                         term === "Sports" ? "খেলা" : "প্রযুক্তি") : term);
                    }}
                    className="px-3 py-1.5 text-xs md:text-sm rounded-full cursor-pointer transition-colors hover:opacity-80"
                    style={{ backgroundColor: "#f5f5f5", color: "#333" }}
                  >
                    {currentLang === "bn" ? 
                      (term === "Breaking News" ? "জরুরি খবর" : 
                       term === "Politics" ? "রাজনীতি" :
                       term === "Sports" ? "খেলা" : "প্রযুক্তি") : term}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700"
              style={{ backgroundColor: "#f5f5f5" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
