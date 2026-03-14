// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import "../globals.css";

import Header from "@/components/Header";
import TopHeader from "@/components/TopHeader";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { fetchMenusViaRest, fetchFooterMenuViaRest } from "@/lib/graphql";
import { routing } from "@/i18n/routing";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoSansBengali = Noto_Sans_Bengali({ 
  variable: "--font-bengali", 
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"]
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/site-options?locale=bn`,
      { next: { revalidate: 600 } }
    );
    
    if (response.ok) {
      const siteData = await response.json();
      return {
        title: "The EyePress",
        description: "Independent Digital News Platform",
        icons: [
          { url: siteData.siteIcon || siteData.logo || "/default-icon.png", rel: "icon" },
          { url: siteData.siteIcon || siteData.logo || "/default-icon.png", rel: "shortcut icon" },
          { url: siteData.siteIcon || siteData.logo || "/default-icon.png", rel: "apple-touch-icon" },
        ],
      };
    }
  } catch (e) {
    console.log("Metadata fetch failed:", e);
  }
  
  return {
    title: "The EyePress",
    description: "Independent Digital News Platform",
  };
}

export function generatePageMetadata(locale: string, page: string): Promise<Metadata> {
  const pageTitles: Record<string, Record<string, string>> = {
    bn: {
      about: "আমাদের সম্পর্কে - The EyePress",
      contact: "যোগাযোগ - The EyePress",
      privacy: "গোপনীয়তা নীতি - The EyePress",
      terms: "ব্যবহারের শর্ত - The EyePress",
      subscribe: "সাবস্ক্রাইব - The EyePress",
      search: "খুঁজুন - The EyePress",
    },
    en: {
      about: "About Us - The EyePress",
      contact: "Contact - The EyePress",
      privacy: "Privacy Policy - The EyePress",
      terms: "Terms of Use - The EyePress",
      subscribe: "Subscribe - The EyePress",
      search: "Search - The EyePress",
    }
  };

  const titles = pageTitles[locale] || pageTitles.bn;
  
  return Promise.resolve({
    title: titles[page] || "The EyePress",
    description: "Independent Digital News Platform",
  });
}

interface MenuItem {
  label: string;
  url: string;
  ID?: number;
  childItems?: {
    nodes: MenuItem[];
  };
}

async function getMenuItems(locale: string): Promise<MenuItem[]> {
  // Use REST API to fetch menus
  try {
    const menuItems = await fetchMenusViaRest(locale);
    if (menuItems && menuItems.length > 0) {
      console.log("REST API: Found", menuItems.length, "menu items for", locale);
      return menuItems.map((item: any) => ({
        label: item.label || "",
        url: item.url || "#",
        ID: item.ID
      }));
    }
  } catch (e) {
    console.log("REST API menu fetch failed:", e);
  }

  console.log("No menu found for locale:", locale);
  return [];
}

async function getFooterMenuItems(locale: string): Promise<MenuItem[]> {
  try {
    const footerMenuItems = await fetchFooterMenuViaRest(locale);
    if (footerMenuItems && footerMenuItems.length > 0) {
      console.log("REST API: Found", footerMenuItems.length, "footer menu items for", locale);
      return footerMenuItems.map((item: any) => ({
        label: item.label || "",
        url: item.url || "#",
        ID: item.ID
      }));
    }
  } catch (e) {
    console.log("REST API footer menu fetch failed:", e);
  }

  console.log("No footer menu found for locale:", locale);
  return [];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const validLocale = locale && routing.locales.includes(locale as typeof routing.locales[number]) 
    ? locale 
    : routing.defaultLocale;
  
  const messages = await getMessages();
  
  // Fetch logo and urgent notice from REST API (NEW METHOD)
  let logoFromRest = "";
  let siteIconFromRest = "";
  let urgentNoticeFromRest = "";
  let dateTimeHTMLFromRest = "";
  let tickerHTMLFromRest = "";
  try {
    const siteRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/site-options?locale=${validLocale}`,
      { next: { revalidate: 600 } }
    );
    if (siteRes.ok) {
      const siteData = await siteRes.json();
      logoFromRest = siteData.logo || "";
      siteIconFromRest = siteData.siteIcon || "";
      urgentNoticeFromRest = siteData.urgentNotice || "";
      dateTimeHTMLFromRest = siteData.dateTimeHTML || "";
      tickerHTMLFromRest = siteData.tickerHTML || "";
    }
  } catch (e) {
    console.log("REST site-options fetch failed:", e);
  }
  
  // Fetch menu items using REST API (NEW METHOD)
  const menuItems = await getMenuItems(validLocale);
  const footerMenuItems = await getFooterMenuItems(validLocale);
  
  console.log("Final menu items for", validLocale + ":", menuItems);
  console.log("Final footer menu items for", validLocale + ":", footerMenuItems);

  // For now, use empty languages array since Polylang may not be installed
  let languages: any[] = [];

  return (
    <html lang={validLocale} suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansBengali.variable} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={validLocale}>
          <Providers>
            <div className="sticky top-0 z-[100]">
              <TopHeader
                siteIconUrl={siteIconFromRest || logoFromRest || "/default-icon.png"}
                tickerHTML={tickerHTMLFromRest}
                dateTimeHTML={dateTimeHTMLFromRest}
                menuItems={menuItems}
              />

              <Header 
                siteOptions={{ 
                  logo: logoFromRest || "",
                  urgentNotice: urgentNoticeFromRest,
                  siteIcon: siteIconFromRest || logoFromRest || ""
                }} 
                menuItems={menuItems}
                languages={languages}
              />
            </div>

            {children}

            <Footer 
              siteLogo={logoFromRest || ""} 
              locale={validLocale}
              menuItems={footerMenuItems}
            />
            
            <ScrollToTop />
            <CookieConsent locale={validLocale} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
