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
  const [searchQuery, setSearchQuery] = useState("");
  const [categorySlugs, setCategorySlugs] = useState<CategorySlugMap[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  const hasChildren = (item: MenuItem) => item.childItems && item.childItems.nodes.length > 0;

  return (
    <>
      <style jsx global>{`
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
      `}</style>

      <header 
        className="w-full bg-white shadow-md sticky top-0 z-50"
        ref={dropdownRef}
      >
        <div className="mx-auto flex items-center justify-between px-4 py-3" style={{ minHeight: isScrolled ? "70px" : "80px" }}>
          
          {/* LEFT COLUMN - Urgent Notice (10%) */}
          <div className="w-[10%] flex items-center justify-start">
            {siteOptions?.urgentNotice ? (
              <div 
                className="flex items-center gap-1 px-3 py-2 rounded-md text-[#A41E22] text-sm font-medium cursor-default transition-all"
                style={{ 
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #e0e0e0",
                  fontWeight: 500
                }}
                title={siteOptions.urgentNotice}
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
            ) : (
              <div />
            )}
          </div>

          {/* MIDDLE COLUMN - Logo + Menu (80%) */}
          <div className="w-[80%] flex flex-col items-center gap-3">
            {/* Logo - Full logo when not scrolled, Site icon when scrolled */}
            <div className="logo-star-orbit logo-container">
              <div className="logo">
                {isScrolled ? (
                  // Site icon when sticky/scrolled (50x50)
                  siteOptions?.siteIcon ? (
                    <Link href="/">
                      <img 
                        src={siteOptions.siteIcon} 
                        alt="Site Icon" 
                        className="logo-image h-[50px] w-[50px] object-contain"
                      />
                    </Link>
                  ) : siteOptions?.logo ? (
                    <Link href="/">
                      <img 
                        src={siteOptions.logo} 
                        alt="Site Logo" 
                        className="logo-image h-[50px] w-auto object-contain"
                      />
                    </Link>
                  ) : (
                    <Link href="/" className="text-[#A41E22] text-xl font-bold">
                      The EyePress
                    </Link>
                  )
                ) : (
                  // Full logo when not scrolled
                  siteOptions?.logo ? (
                    <Link href="/">
                      <img 
                        src={siteOptions.logo} 
                        alt="Site Logo" 
                        className="logo-image h-20 w-auto object-contain"
                        style={{ maxHeight: "80px" }}
                      />
                    </Link>
                  ) : (
                    <Link href="/" className="text-[#A41E22] text-2xl font-bold">
                      The EyePress
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* Menu with আলোচিত/TRENDING label */}
            <nav className="flex items-center gap-1 relative" style={{ fontFamily: "var(--font-bengali), sans-serif" }}>
              {/* আলোচিত or TRENDING label with spinning stars */}
              <div 
                className="trending-star relative px-3 py-1.5 rounded-md text-white font-semibold text-base mr-2 flex items-center"
                style={{ 
                  backgroundColor: "#6C1312"
                }}
              >
                <span style={{ color: "#ffffff" }}>
                  {currentLang === "en" ? "TRENDING" : "আলোচিত"}
                </span>
              </div>

              {/* Menu Items - HIGH VISIBILITY */}
              {menuItems.map((item, index) => {
                const isItemActive = isActive(item.url);
                return (
                <div key={index} className="relative">
                  {hasChildren(item) ? (
                    <>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={`menu-item-wrapper flex items-center gap-1 px-4 py-2 font-bold text-sm rounded-md transition-all cursor-pointer uppercase tracking-wide ${
                          isItemActive ? 'bg-[#6C1312]' : 'hover:bg-gray-50'
                        }`}
                        style={{ 
                          fontWeight: 600,
                          color: isItemActive ? '#ffffff !important' : '#1a1a1a',
                          backgroundColor: isItemActive ? '#6C1312' : 'transparent'
                        }}
                      >
                        <span className="menu-item-text" style={{ color: isItemActive ? '#ffffff !important' : '#1a1a1a' }}>{item.label}</span>
                        <svg 
                          className="menu-icon w-4 h-4 transition-transform duration-200"
                          fill="none" 
                          stroke={isItemActive ? '#ffffff' : 'currentColor'} 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown */}
                      {activeDropdown === item.label && (
                        <div 
                          className="absolute top-full left-0 mt-1 py-2 min-w-[200px] rounded-md shadow-xl z-50 bg-white border border-gray-200"
                        >
                          {item.childItems?.nodes.map((child, childIndex) => {
                            const isChildActive = isActive(child.url);
                            return (
                            <a
                              key={childIndex}
                              href={child.url}
                              className={`menu-item-wrapper block px-4 py-2.5 font-bold text-sm transition-all no-underline uppercase tracking-wide ${
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
                      className={`menu-item-wrapper px-4 py-2 font-bold text-sm rounded-md transition-all no-underline uppercase tracking-wide ${
                        isItemActive ? 'bg-[#6C1312]' : 'hover:bg-gray-50'
                      }`}
                      style={{ 
                        fontWeight: 600,
                        color: isItemActive ? '#ffffff !important' : '#1a1a1a',
                        backgroundColor: isItemActive ? '#6C1312' : 'transparent'
                      }}
                    >
                      <span className="menu-item-text" style={{ color: isItemActive ? '#ffffff !important' : '#1a1a1a' }}>{item.label}</span>
                    </a>
                  )}
                </div>
              );})}
            </nav>
          </div>

          {/* RIGHT COLUMN - Search + Live Button + Language Switcher (10%) */}
          <div className="w-[10%] flex items-center justify-end gap-2">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full text-[#A41E22] font-semibold text-sm transition-all cursor-pointer hover:bg-gray-100"
              style={{ backgroundColor: 'transparent' }}
              title={currentLang === "bn" ? "অনুসন্ধান" : "Search"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <a
              href="https://www.youtube.com/@TheEyePress"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-[#A41E22] font-semibold text-sm transition-all cursor-pointer"
              style={{ 
                backgroundColor: "#f5f5f5",
                border: "1px solid #e0e0e0"
              }}
              title={siteOptions?.urgentNotice || "Live"}
            >
              <span className="red-dot-pulse w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#A41E22" }}></span>
              <span style={{ fontWeight: 700, color: "#A41E22" }}>
                {currentLang === "en" ? "LIVE" : "লাইভ"}
              </span>
            </a>
            <button
              onClick={handleLanguageSwitch}
              className="lang-btn-glow flex items-center gap-2 px-4 py-2 rounded-full text-[#A41E22] font-semibold text-sm transition-all cursor-pointer"
              style={{ 
                backgroundColor: "#fff",
                border: "2px solid #A41E22"
              }}
              title={currentLang === "bn" ? t('switchToEnglish') : t('switchToBengali')}
            >
              <span className="font-bold" style={{ fontSize: '12px' }}>
                {currentLang === "bn" ? "English" : "বাংলা"}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="w-full max-w-2xl mx-4 rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: "white" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            <div className="p-6 border-b" style={{ borderColor: "#e0e0e0" }}>
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={currentLang === "bn" ? "এখানে খুঁজুন..." : "Search here..."}
                  className="w-full px-5 py-4 pl-14 text-lg rounded-xl outline-none text-gray-900 placeholder-gray-400"
                  style={{ border: "2px solid #A41E22", backgroundColor: "#fff" }}
                />
                <svg 
                  className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#A41E22]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2.5 rounded-lg text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#A41E22" }}
                >
                  {currentLang === "bn" ? "খুঁজুন" : "Search"}
                </button>
              </form>
            </div>
            
            {/* Search Suggestions */}
            <div className="p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {currentLang === "bn" ? "জনপ্রিয় অনুসন্ধান:" : "Popular searches:"}
              </p>
              <div className="flex flex-wrap gap-3">
                {["Breaking News", "Politics", "Sports", "Technology"].map((term, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchQuery(currentLang === "bn" ? 
                        (term === "Breaking News" ? "জরুরি খবর" : 
                         term === "Politics" ? "রাজনীতি" :
                         term === "Sports" ? "খেলা" : "প্রযুক্তি") : term);
                    }}
                    className="px-4 py-2 text-sm rounded-full cursor-pointer transition-colors hover:opacity-80"
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
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700"
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
