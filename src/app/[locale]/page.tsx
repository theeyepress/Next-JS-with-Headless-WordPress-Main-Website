// src/app/[locale]/page.tsx
import { routing } from "@/i18n/routing";
import HomepageClient from "./HomepageClient";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  date: string;
  view_count?: number;
  featuredImage?: { node: { sourceUrl: string; altText: string } };
  categories?: { nodes: Array<{ name: string; slug: string }> };
};

type Category = {
  id: string;
  name: string;
  slug: string;
  count?: number;
};

type VideoPost = {
  type: "youtube" | "self-hosted" | "selfhosted" | "post";
  videoId?: string;
  url?: string;
  title: string;
  thumbnail?: string;
};

type AdConfig = {
  slot: string;
  label?: string;
  image: string;
  link: string;
};

async function getHomepageData(locale: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.theeyepress.com';
  
  const [
    siteRes, 
    catsRes, 
    heroPostsRes,
    trendingPostsRes,
    popularPostsRes,
    editorsChoiceRes,
    latestPostsRes,
    videosRes, 
    adsRes
  ] = await Promise.all([
    fetch(`${API_URL}/wp-json/eyepress/v1/site-options?locale=${locale}`, { next: { revalidate: 600 } }),
    fetch(`${API_URL}/wp-json/eyepress/v1/categories?locale=${locale}`, { next: { revalidate: 1800 } }),
    // Hero: Fetch more posts and ensure category diversity (fetch 15, show top 5 with different categories)
    fetch(`${API_URL}/wp-json/eyepress/v1/posts?locale=${locale}&per_page=15`, { next: { revalidate: 300 } }),
    // Trending: All posts sorted by view count (no category filter for now)
    fetch(`${API_URL}/wp-json/eyepress/v1/trending?locale=${locale}&per_page=5`, { next: { revalidate: 300 } }),
    // Most Popular: Entertainment (29)
    fetch(`${API_URL}/wp-json/eyepress/v1/posts?locale=${locale}&category_id=29&per_page=5`, { next: { revalidate: 300 } }),
    // Editor's Choice: Business (35)
    fetch(`${API_URL}/wp-json/eyepress/v1/posts?locale=${locale}&category_id=35&per_page=5`, { next: { revalidate: 300 } }),
    // Latest News: All posts
    fetch(`${API_URL}/wp-json/eyepress/v1/posts?locale=${locale}&per_page=30`, { next: { revalidate: 300 } }),
    fetch(`${API_URL}/wp-json/eyepress/v1/videos?locale=${locale}`, { next: { revalidate: 60 } }),
    fetch(`${API_URL}/wp-json/eyepress/v1/ads`, { next: { revalidate: 600 } }),
  ]);

  const siteData = siteRes.ok ? await siteRes.json() : { logo: '', siteIcon: '' };
  const catsData = catsRes.ok ? await catsRes.json() : [];
  const heroPosts = heroPostsRes.ok ? await heroPostsRes.json() : [];
  const trendingPosts = trendingPostsRes.ok ? await trendingPostsRes.json() : [];
  const popularPosts = popularPostsRes.ok ? await popularPostsRes.json() : [];
  const editorsChoice = editorsChoiceRes.ok ? await editorsChoiceRes.json() : [];
  const latestPosts = latestPostsRes.ok ? await latestPostsRes.json() : [];
  const videosData = videosRes.ok ? await videosRes.json() : [];
  const adsData = adsRes.ok ? await adsRes.json() : [];

  return {
    siteLogo: siteData.logo || '',
    siteIcon: siteData.siteIcon || '',
    categories: (catsData as Category[]).slice(0, 12),
    heroPosts: heroPosts as Post[],
    trendingPosts: trendingPosts as Post[],
    popularPosts: popularPosts as Post[],
    editorsChoicePosts: editorsChoice as Post[],
    latestPosts: latestPosts as Post[],
    videos: videosData as VideoPost[],
    ads: adsData as AdConfig[],
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const validLocale = locale && routing.locales.includes(locale as typeof routing.locales[number])
    ? locale
    : routing.defaultLocale;

  const { 
    siteLogo, 
    siteIcon, 
    categories, 
    heroPosts, 
    trendingPosts,
    popularPosts,
    editorsChoicePosts,
    latestPosts,
    videos, 
    ads 
  } = await getHomepageData(validLocale);

  return (
    <HomepageClient
      locale={validLocale}
      siteLogo={siteLogo}
      siteIcon={siteIcon}
      menuCategories={categories}
      heroPosts={heroPosts}
      trendingPosts={trendingPosts}
      popularPosts={popularPosts}
      editorsChoicePosts={editorsChoicePosts}
      latestPosts={latestPosts}
      initialVideos={videos}
      initialAds={ads}
    />
  );
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const revalidate = 300;
