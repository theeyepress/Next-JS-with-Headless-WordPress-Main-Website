// Category slug mapping utility for language switching
// Fetches and caches category slug translations from WordPress

type CategorySlugMap = {
  bn_slug: string;
  en_slug: string;
  bn_name: string;
  en_name: string;
};

let cachedSlugs: CategorySlugMap[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 300000; // 5 minutes in milliseconds (reduced for development)

export async function fetchCategorySlugs(locale?: string, forceRefresh: boolean = false): Promise<CategorySlugMap[]> {
  const now = Date.now();
  
  // Return cached if still valid and not forcing refresh
  if (!forceRefresh && cachedSlugs && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSlugs;
  }

  try {
    const wpUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!wpUrl) {
      console.error('NEXT_PUBLIC_API_BASE_URL not configured');
      return [];
    }

    const response = await fetch(`${wpUrl}/wp-json/eyepress/v1/category-slugs`, {
      cache: 'no-store' // Don't cache at all for development
    });

    if (!response.ok) {
      console.error('Failed to fetch category slugs:', response.status);
      return cachedSlugs || [];
    }

    const data = await response.json();
    console.log('Category slugs fetched:', data);
    cachedSlugs = data;
    lastFetchTime = now;
    return cachedSlugs || [];
  } catch (error) {
    console.error('Error fetching category slugs:', error);
    return cachedSlugs || [];
  }
}

// Force refresh the cache - useful when categories are updated
export async function refreshCategorySlugs(): Promise<CategorySlugMap[]> {
  cachedSlugs = null;
  lastFetchTime = 0;
  return fetchCategorySlugs(undefined, true);
}

// Bengali to English transliteration mapping
const bengaliToEnglishMap: Record<string, string> = {
  'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
  'ৎ': 't',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  '্': '', '়': '',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  ' ': '-', '_': '-'
};

function transliterateBengaliToEnglish(text: string): string {
  if (!text) return '';
  
  let result = '';
  const lowerText = text.toLowerCase();
  
  for (let i = 0; i < lowerText.length; i++) {
    const char = lowerText[i];
    if (bengaliToEnglishMap[char]) {
      result += bengaliToEnglishMap[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    }
  }
  
  // Clean up multiple dashes
  result = result.replace(/-+/g, '-');
  result = result.replace(/^-+|-+$/g, '');
  
  return result;
}

export function translateSlug(
  currentSlug: string,
  fromLocale: string,
  toLocale: string,
  slugs: CategorySlugMap[] = []
): string {
  if (fromLocale === toLocale) {
    return currentSlug;
  }

  // Decode the current slug in case it's URL-encoded
  const decodedSlug = decodeURIComponent(currentSlug);
  console.log('Translating slug:', { currentSlug, decodedSlug, fromLocale, toLocale, slugsCount: slugs.length });

  // If going from Bengali to English
  if (fromLocale === 'bn' && toLocale === 'en') {
    // Try to find existing mapping - check ALL possible variations
    const mapping = slugs.find(
      (s) => {
        const sbn = s.bn_slug;
        const decodedSbSlug = decodeURIComponent(sbn);
        return (
          s.bn_slug === currentSlug || 
          s.bn_slug === decodedSlug ||
          decodeURIComponent(s.bn_slug) === decodedSlug ||
          sbn === decodedSbSlug ||
          encodeURIComponent(s.bn_slug) === currentSlug ||
          decodeURIComponent(sbn) === decodedSlug
        );
      }
    );
    
    console.log('Found mapping:', mapping);
    
    if (mapping && mapping.en_slug) {
      return mapping.en_slug;
    }
    
    // FALLBACK: Auto-transliterate if no mapping found
    const transliterated = transliterateBengaliToEnglish(decodedSlug);
    console.log('Using fallback transliteration:', transliterated);
    if (transliterated && transliterated !== decodedSlug) {
      return transliterated;
    }
  }

  // If going from English to Bengali
  if (fromLocale === 'en' && toLocale === 'bn') {
    // Try to find by matching English slug (case-insensitive)
    const mapping = slugs.find(
      (s) => 
        s.en_slug.toLowerCase() === currentSlug.toLowerCase() || 
        s.en_slug.toLowerCase() === decodedSlug.toLowerCase()
    );
    
    console.log('Found EN->BN mapping:', mapping);
    
    if (mapping && mapping.bn_slug) {
      const bnSlug = mapping.bn_slug;
      // If the slug contains non-ASCII characters, URL-encode it
      if (/[^\x00-\x7F]/.test(bnSlug)) {
        return encodeURIComponent(bnSlug);
      }
      return bnSlug;
    }
    
    // FALLBACK: If no mapping found, we can't easily reverse transliterate
    // Just return the original slug
  }

  // If no mapping found and no fallback worked, return original slug
  console.log('No mapping found, returning original slug');
  return currentSlug;
}

// Check if a slug is a category page
export function isCategoryPage(pathname: string): boolean {
  return pathname.includes('/category/');
}

// Get the current slug from pathname
export function getSlugFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  const categoryIndex = parts.indexOf('category');
  if (categoryIndex !== -1 && parts[categoryIndex + 1]) {
    return parts[categoryIndex + 1];
  }
  return '';
}

// Check if current path is a post
export function isPostPage(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  // Post pages typically have locale + post slug (no category keyword)
  // e.g., /bn/some-post or /en/some-post-2
  if ((parts[0] === 'bn' || parts[0] === 'en') && parts.length >= 2) {
    // Make sure it's not category page
    return !pathname.includes('/category/');
  }
  return false;
}

// Get post slug from pathname (keep as-is, API handles -2 suffix)
export function getPostSlugFromPath(pathname: string, locale: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if ((parts[0] === 'bn' || parts[0] === 'en') && parts[1]) {
    return parts[1];
  }
  return '';
}

// Translate post slug between locales - DON'T modify slug, API handles -2 automatically!
export function translatePostSlug(
  currentSlug: string,
  fromLocale: string,
  toLocale: string
): string {
  // Just return the slug as-is - WordPress API will handle adding/removing -2
  return currentSlug;
}
