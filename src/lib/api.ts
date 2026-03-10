// src/lib/api.ts - REST API client for The EyePress
// Replaces GraphQL with REST API calls

const WP_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.theeyepress.com';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  date: string;
  language?: string;
  translation_group_id?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  categories?: {
    nodes: Array<{
      name: string;
      slug: string;
    }>;
  };
  tags?: {
    nodes: Array<{
      name: string;
      slug: string;
    }>;
  };
  author?: {
    node: {
      name: string;
      slug: string;
    };
  };
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count: number;
}

interface TranslationResponse {
  found: boolean;
  message?: string;
  locale?: string;
  slug?: string;
  id?: number;
  group_id?: string;
}

interface Stats {
  total_posts: number;
  bn_posts: number;
  en_posts: number;
  with_translation_group: number;
  untranslated: number;
}

async function fetchAPI(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${WP_URL}/wp-json/${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 60 },
  });
  
  if (!res.ok) {
    console.error(`API Error: ${res.status} - ${res.statusText}`);
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  
  return res.json();
}

export async function getPosts(locale: 'bn' | 'en' = 'bn', page: number = 1, perPage: number = 20, category?: string): Promise<Post[]> {
  const params: Record<string, string> = {
    locale,
    page: page.toString(),
    per_page: perPage.toString(),
  };
  
  if (category) {
    params.category = category;
  }
  
  return fetchAPI('eyepress/v1/posts', params);
}

export async function getPost(slug: string, locale: 'bn' | 'en' = 'bn'): Promise<Post | null> {
  try {
    const post = await fetchAPI(`eyepress/v1/post/${slug}`, { locale });
    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function getCategories(locale: 'bn' | 'en' = 'bn'): Promise<Category[]> {
  return fetchAPI('eyepress/v1/categories', { locale });
}

export async function getCategory(slug: string, locale: 'bn' | 'en' = 'bn', page: number = 1, perPage: number = 30) {
  return fetchAPI(`eyepress/v1/category/${slug}`, {
    locale,
    page: page.toString(),
    per_page: perPage.toString(),
  });
}

export async function getTranslation(groupId: string, targetLocale: 'bn' | 'en'): Promise<TranslationResponse> {
  return fetchAPI(`eyepress/v1/translation/${groupId}`, { locale: targetLocale });
}

export async function getPostTranslation(slug: string, targetLocale: 'bn' | 'en'): Promise<TranslationResponse> {
  return fetchAPI(`eyepress/v1/post-translation/${slug}`, { locale: targetLocale });
}

export async function getStats(): Promise<Stats> {
  return fetchAPI('eyepress/v1/stats');
}

export async function getMenus(locale: 'bn' | 'en' = 'bn') {
  return fetchAPI('eyepress/v1/menus', { locale });
}

export async function getSiteOptions(locale: 'bn' | 'en' = 'bn') {
  return fetchAPI('eyepress/v1/site-options', { locale });
}

export async function getTicker(locale: 'bn' | 'en' = 'bn', count: number = 10) {
  return fetchAPI('eyepress/v1/ticker', { locale, count: count.toString() });
}

export async function searchPosts(query: string, locale: 'bn' | 'en' = 'bn', page: number = 1) {
  return fetchAPI('eyepress/v1/search', { 
    q: query, 
    locale, 
    page: page.toString() 
  });
}

export async function getVideos(locale: 'bn' | 'en' = 'bn') {
  return fetchAPI('eyepress/v1/videos', { locale });
}

export async function getAds() {
  return fetchAPI('eyepress/v1/ads');
}

export async function getCategorySlugs() {
  return fetchAPI('eyepress/v1/category-slugs');
}

export async function getAuthorPosts(authorSlug: string, locale: 'bn' | 'en' = 'bn', page: number = 1) {
  return fetchAPI(`eyepress/v1/author/${authorSlug}`, { 
    locale, 
    page: page.toString() 
  });
}

export { WP_URL };
