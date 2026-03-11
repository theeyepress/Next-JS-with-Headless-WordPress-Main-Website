// src/app/[locale]/category/[slug]/page.tsx
import { routing } from "@/i18n/routing";
import CategoryPageClient from "./CategoryPageClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getCategoryBySlug(slug: string, locale: string) {
  const decodedSlug = decodeURIComponent(slug);
  
  try {
    // First get categories to find the category ID
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/categories?locale=${locale}`,
      { next: { revalidate: 300 } }
    );
    
    if (!response.ok) return null;
    
    const categories = await response.json();
    
    // Find matching category - normalize both for comparison
    const normalizedInputSlug = decodedSlug.toLowerCase();
    
    const category = categories.find((c: any) => {
      const catSlugDecoded = decodeURIComponent(c.slug).toLowerCase();
      const catNameLower = (c.name || '').toLowerCase();
      
      return normalizedInputSlug === catSlugDecoded || 
             normalizedInputSlug === catNameLower ||
             decodedSlug === decodeURIComponent(c.slug);
    });
    
    return category || null;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

async function getCategoryPosts(categoryId: number, page: number = 1, perPage: number = 30) {
  try {
    // Use new simple endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/category-posts?category_id=${categoryId}&page=${page}&per_page=${perPage}`,
      { next: { revalidate: 300 } }
    );
    
    if (!response.ok) {
      console.log("Category posts API error:", response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching category posts:", error);
    return null;
  }
}

async function getCategoryData(slug: string, locale: string, page: number = 1, perPage: number = 30) {
  // Use locale directly - don't decode here
  try {
    // Get category info first
    const categoryInfo = await getCategoryBySlug(slug, locale);
    
    if (!categoryInfo) {
      // Try old endpoint as fallback
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/category/${slug}?locale=${locale}&page=${page}&per_page=${perPage}`,
        { next: { revalidate: 300 } }
      );
      
      if (!response.ok) return null;
      return await response.json();
    }
    
    // Get posts using new endpoint
    const postsData = await getCategoryPosts(categoryInfo.id, page, perPage);
    
    if (!postsData) {
      // Fallback to old endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/category/${slug}?locale=${locale}&page=${page}&per_page=${perPage}`,
        { next: { revalidate: 300 } }
      );
      
      if (!response.ok) return null;
      return await response.json();
    }
    
    // Return combined data
    return {
      id: categoryInfo.id,
      name: categoryInfo.name,
      slug: categoryInfo.slug,
      count: postsData.count,
      posts: { nodes: postsData.posts },
      pagination: postsData.pagination
    };
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const { page } = await searchParams;
  
  // Use locale directly from URL
  const currentLocale = locale || 'bn';
  
  const currentPage = page ? parseInt(page) : 1;
  const perPage = 30;

  const category = await getCategoryData(slug, currentLocale, currentPage, perPage);

  if (!category) {
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

  // Fetch popular posts for sidebar
  let popularPosts: any[] = [];
  try {
    const popularRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/posts?locale=${currentLocale}&per_page=5`,
      { next: { revalidate: 300 } }
    );
    if (popularRes.ok) {
      popularPosts = await popularRes.json();
    }
  } catch (e) {
    console.log("Popular posts fetch error:", e);
  }

  // Fetch all categories for sidebar
  let allCategories: any[] = [];
  try {
    const catsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/categories?locale=${currentLocale}`,
      { next: { revalidate: 1800 } }
    );
    if (catsRes.ok) {
      allCategories = await catsRes.json();
    }
  } catch (e) {
    console.log("Categories fetch error:", e);
  }

  return (
    <CategoryPageClient
      locale={currentLocale}
      category={category}
      ads={ads}
      popularPosts={popularPosts}
      allCategories={allCategories}
      currentPage={currentPage}
    />
  );
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
