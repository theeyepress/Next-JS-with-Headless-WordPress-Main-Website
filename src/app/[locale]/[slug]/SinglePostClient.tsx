// src/app/[locale]/[slug]/SinglePostClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PostCard from "@/components/PostCard";
import AdBanner from "@/components/AdBanner";
import SubscribeForm from "@/components/SubscribeForm";
import CategoryCard from "@/components/CategoryCard";
import VideoSlider from "@/components/VideoSlider";
import CommentSection from "@/components/CommentSection";

type Post = {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  date: string;
  modified: string;
  slug: string;
  view_count?: number;
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
      avatar?: {
        url: string;
      };
    };
  };
};

type SinglePostClientProps = {
  locale: string;
  post: Post;
  relatedPosts: any[];
  siteLogo?: string;
  ads?: any[];
  allCategories?: any[];
  initialVideos?: any[];
};

const SinglePostClient: React.FC<SinglePostClientProps> = ({
  locale,
  post,
  relatedPosts,
  siteLogo,
  ads = [],
  allCategories = [],
  initialVideos = [],
}) => {
  const [viewCount, setViewCount] = useState((post as any).view_count || 0);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    const trackView = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.theeyepress.com';
        const response = await fetch(`${API_URL}/wp-json/eyepress/v1/track-view?slug=${post.slug}&locale=${locale}`);
        const data = await response.json();
        if (data.success && data.views) {
          setViewCount(data.views);
        } else {
          setViewCount((prev: number) => prev + 1);
        }
      } catch (e) {
        console.log('View tracking failed:', e);
        setViewCount((prev: number) => prev + 1);
      }
    };
    trackView();
  }, [post.slug, locale]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (locale === "bn") {
      const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      const day = date.getDate().toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      const month = date.toLocaleString("bn-BD", { month: "long" });
      const year = date.getFullYear().toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      return `${day} ${month}, ${year}`;
    }
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (locale === "bn") {
      const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const hrStr = hours.toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      const minStr = minutes.toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      return `${hrStr}:${minStr}`;
    }
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const labels = {
    by: locale === "bn" ? "লিখেছেন" : "By",
    share: locale === "bn" ? "শেয়ার" : "Share",
    related: locale === "bn" ? "সম্পর্কিত খবর" : "Related News",
    tags: locale === "bn" ? "ট্যাগ" : "Tags",
    readTime: locale === "bn" ? "পড়তে সময়" : "Read time",
    minutes: locale === "bn" ? "মিনিট" : "min",
    updated: locale === "bn" ? "আপডেট" : "Updated",
    category: locale === "bn" ? "বিভাগ" : "Category",
  };

  const wordCount = post.content?.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const breadcrumbs = [
    { label: locale === "bn" ? "হোম" : "Home", href: `/${locale}` },
    ...(post.categories?.nodes?.[0]
      ? [{ label: post.categories.nodes[0].name, href: `/${locale}/category/${post.categories.nodes[0].slug}` }]
      : []),
    { label: post.title },
  ];

  return (
    <main className="bg-white min-h-screen pt-14 sm:pt-16 lg:pt-20">
      <div className="container mx-auto px-4 pt-4 pb-2">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <article className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <header className="mb-6">
              {post.categories?.nodes?.[0] && (
                <Link
                  href={`/${locale}/category/${post.categories.nodes[0].slug}`}
                  className="inline-block px-3 py-1 text-white text-sm font-bold uppercase tracking-wide rounded mb-4 transition-all hover:bg-[#B42125]"
                  style={{ backgroundColor: '#6C1312' }}
                >
                  {post.categories.nodes[0].name}
                </Link>
              )}

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              {/* Enhanced Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-800 mb-4 pb-4 border-b border-gray-100">
                {post.author?.node && (
                  <div className="flex items-center gap-2">
                    {post.author.node.avatar?.url ? (
                      <Image
                        src={post.author.node.avatar.url}
                        alt={post.author.node.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#A41E22] flex items-center justify-center text-white font-bold">
                        {post.author.node.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-semibold text-gray-900">
                      {labels.by} {post.author.node.name}
                    </span>
                  </div>
                )}
                <span className="hidden md:inline text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(post.date)}
                </span>
                <span className="hidden md:inline text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(post.date)}
                </span>
                <span className="hidden md:inline text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readingTime} {labels.minutes} {labels.readTime}
                </span>
                {viewCount !== undefined && (
                  <>
                    <span className="hidden md:inline text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US').format(viewCount)} {locale === "bn" ? "বার" : "views"}
                    </span>
                  </>
                )}
              </div>
            </header>

            {post.featuredImage?.node?.sourceUrl && (
              <div className="relative w-full h-96 mb-6 rounded-lg overflow-hidden">
                <Image
                  src={post.featuredImage.node.sourceUrl}
                  alt={post.featuredImage.node.altText || post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div className="mb-6">
              <AdBanner slotId={5} className="rounded-lg" />
            </div>

            <div className="mb-6">
              {ads.length > 15 && (
                <AdBanner slotId={16} adImage={ads[15]?.image} adLink={ads[15]?.link} className="rounded-lg" />
              )}
            </div>

            <div 
              className="post-content" 
              style={{ color: '#1a1a1a', lineHeight: '1.9', fontSize: '1.1rem' }}
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />

            <div className="my-6">
              {ads.length > 16 && (
                <AdBanner slotId={17} adImage={ads[16]?.image} adLink={ads[16]?.link} className="rounded-lg" />
              )}
            </div>

            {post.tags?.nodes && post.tags.nodes.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-bold text-gray-900 mb-3">{labels.tags}:</h4>
                <div className="flex flex-wrap gap-2">
                  {post.tags.nodes.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/${locale}/tag/${tag.slug}`}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-[#A41E22] hover:text-white transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-3">{labels.share}</h4>
              <div className="flex gap-3 flex-wrap">
                {/* Twitter/X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${currentUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#000000' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#4267B2' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${currentUrl}&title=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#0077B5' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>

                {/* Native Share (Mobile) */}
                {currentUrl && typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    onClick={() => {
                      navigator.share({
                        title: post.title,
                        url: currentUrl,
                      }).catch(() => {});
                    }}
                    className="p-2 rounded text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#6C1312' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                )}

                {/* Copy Link */}
                <button
                  onClick={() => {
                    if (currentUrl && navigator.clipboard) {
                      navigator.clipboard.writeText(currentUrl);
                      alert(locale === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link copied!');
                    }
                  }}
                  className="p-2 rounded text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#6B7280' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {post.id && (
              <CommentSection postId={parseInt(post.id)} locale={locale} />
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="mb-6">
              <AdBanner slotId={6} className="rounded-lg" />
            </div>

            <div className="mb-6">
              <SubscribeForm variant="hero" />
            </div>

            {relatedPosts.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-[#6C1312] mb-4">{labels.related}</h3>
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <PostCard key={relatedPost.id} post={relatedPost} variant="list" locale={locale} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>

      {/* Video Section */}
      {initialVideos && initialVideos.length > 0 && (
        <section className="container mx-auto px-4 py-8 border-t">
          <VideoSlider videos={initialVideos} locale={locale} />
        </section>
      )}

      {relatedPosts.length > 0 && (
        <section className="container mx-auto px-4 py-8 border-t">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-[#A41E22]" />
            <h2 className="text-2xl font-bold text-[#6C1312]">{labels.related}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedPosts.slice(0, 4).map((relatedPost) => (
              <PostCard key={relatedPost.id} post={relatedPost} variant="medium" locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Ad Slot 18 - Below Related Posts */}
      {ads.length > 17 && (
        <section className="container mx-auto px-4 py-4">
          <AdBanner slotId={18} adImage={ads[17]?.image} adLink={ads[17]?.link} className="rounded-lg" />
        </section>
      )}

      <section className="container mx-auto px-4 py-8">
        <SubscribeForm variant="hero" />
      </section>

      {/* Categories Section */}
      {allCategories.length > 0 && (
        <section className="container mx-auto px-4 pb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-10 h-1 bg-[#A41E22]" />
              <span className="text-[#A41E22] font-semibold text-sm uppercase tracking-wider">
                {locale === "bn" ? "আবিষ্কার করুন" : "Discover"}
              </span>
              <div className="w-10 h-1 bg-[#A41E22]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#6C1312]">
              {locale === "bn" ? "বিভাগসমূহ" : "Categories"}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
            {allCategories.slice(0, 6).map((cat) => (
              <CategoryCard key={cat.id} category={cat} locale={locale} variant="featured" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default SinglePostClient;
