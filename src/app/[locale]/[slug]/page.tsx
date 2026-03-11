// src/app/[locale]/[slug]/page.tsx
import { routing } from "@/i18n/routing";
import SinglePostClient from "./SinglePostClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getPostData(slug: string, locale: string) {
  const decodedSlug = decodeURIComponent(slug);

  try {
    // Use REST API with locale parameter - cache for 10 minutes
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/post/${decodedSlug}?locale=${locale}`,
      { next: { revalidate: 600 } } // 10 minutes
    );
    
    if (!response.ok) {
      console.log("Post API error:", response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

async function getRelatedPosts(categorySlug: string, excludeId: string, locale: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/posts?locale=${locale}&category=${categorySlug}&per_page=5`,
      { next: { revalidate: 300 } } // 5 minutes
    );
    
    if (!response.ok) {
      return [];
    }
    
    const posts = await response.json();
    return posts.filter((p: any) => p.id !== excludeId).slice(0, 4);
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }
}

export default async function SinglePostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  
  const validLocale = locale && routing.locales.includes(locale as typeof routing.locales[number])
    ? locale
    : routing.defaultLocale;

  const post = await getPostData(slug, validLocale);

  if (!post) {
    notFound();
  }

  // Fetch ads
  let ads: any[] = [];
  try {
    const adsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/ads`,
      { next: { revalidate: 600 } }
    );
    if (adsRes.ok) {
      ads = await adsRes.json();
    }
  } catch (e) {
    console.log("Ads fetch error:", e);
  }

  // Get site logo
  let siteLogo = "";
  try {
    const logoRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/site-options?locale=${validLocale}`,
      { next: { revalidate: 600 } }
    );
    if (logoRes.ok) {
      const logoData = await logoRes.json();
      siteLogo = logoData.logo || "";
    }
  } catch (e) {
    console.log("Logo fetch error:", e);
  }

  // Get related posts
  const categorySlug = post.categories?.nodes?.[0]?.slug;
  const relatedPosts = categorySlug 
    ? await getRelatedPosts(categorySlug, post.id, validLocale)
    : [];

  // Get categories
  let allCategories: any[] = [];
  try {
    const catsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/categories?locale=${validLocale}`,
      { next: { revalidate: 1800 } }
    );
    if (catsRes.ok) {
      allCategories = await catsRes.json();
    }
  } catch (e) {
    console.log("Categories fetch error:", e);
  }

  // Get videos
  let videos: any[] = [];
  try {
    const videosRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/videos?locale=${validLocale}`,
      { next: { revalidate: 900 } }
    );
    if (videosRes.ok) {
      videos = await videosRes.json();
    }
  } catch (e) {
    console.log("Videos fetch error:", e);
  }

  return (
    <SinglePostClient
      locale={validLocale}
      post={post}
      relatedPosts={relatedPosts}
      siteLogo={siteLogo}
      ads={ads}
      allCategories={allCategories}
      initialVideos={videos}
    />
  );
}
