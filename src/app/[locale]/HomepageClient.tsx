// src/app/[locale]/HomepageClient.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import HeroSection from "@/components/HeroSection";
import PostCard from "@/components/PostCard";
import CategoryCard from "@/components/CategoryCard";
import VideoSlider from "@/components/VideoSlider";
import SubscribeForm from "@/components/SubscribeForm";
import AdBanner from "@/components/AdBanner";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  date: string;
  view_count?: number;
  featuredImage?: { node: { sourceUrl: string; altText: string; } };
  categories?: { nodes: Array<{ name: string; slug: string; }> };
  author?: { node: { name: string; slug: string; } };
};

type Category = {
  id: string;
  name: string;
  slug: string;
  count?: number;
  featuredImage?: { node: { sourceUrl: string; altText: string; } };
};

type VideoPost = {
  type: "youtube" | "self-hosted" | "selfhosted" | "post";
  videoId?: string;
  url?: string;
  title: string;
  thumbnail?: string;
  embedUrl?: string;
  watchUrl?: string;
  slug?: string;
  excerpt?: string;
  date?: string;
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
};

type HomepageClientProps = {
  locale: string;
  siteLogo?: string;
  siteIcon?: string;
  menuCategories?: Category[];
  heroPosts?: Post[];
  trendingPosts?: Post[];
  popularPosts?: Post[];
  editorsChoicePosts?: Post[];
  latestPosts?: Post[];
  initialVideos?: VideoPost[];
  initialAds?: AdConfig[];
};

type AdConfig = {
  slot: string;
  label?: string;
  image: string;
  link: string;
};

const HomepageClient: React.FC<HomepageClientProps> = ({
  locale, siteLogo, siteIcon, menuCategories = [], 
  heroPosts = [], trendingPosts = [], popularPosts = [], editorsChoicePosts = [], latestPosts = [],
  initialVideos = [], initialAds = []
}) => {
  console.log("Initial videos received:", initialVideos);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Category[]>(menuCategories);
  const [videos, setVideos] = useState<VideoPost[]>(initialVideos);
  const [ads, setAds] = useState<AdConfig[]>(initialAds);
  const [loading, setLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoPost | null>(null);

  // Function to open video modal - exposed to children
  const openVideoModal = (video: VideoPost) => {
    if (video.type === "youtube") {
      window.open(video.watchUrl || `https://www.youtube.com/watch?v=${video.videoId}`, "_blank");
    } else if (video.type === "self-hosted" || video.type === "selfhosted") {
      setCurrentVideo(video);
    } else if (video.type === "post") {
      if (video.embedUrl || video.url) {
        setCurrentVideo(video);
      } else if (video.slug) {
        window.open(`/${locale}/${encodeURIComponent(video.slug)}`, "_self");
      }
    }
  };

  // Function to close video modal
  const closeVideoModal = () => {
    setCurrentVideo(null);
  };

  // Helper function to get ad by slot number
  const getAdBySlot = (slotNum: number) => {
    const ad = ads.find(ad => Number(ad.slot) === slotNum);
    return ad;
  };

  // Simple GSAP animation - fade in on scroll
  useEffect(() => {
    console.log("GSAP animation initializing...");
    
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray('.gsap-section');
      console.log("Found sections for animation:", sections.length);
      
      sections.forEach((section: any) => {
        gsap.fromTo(section, 
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 90%",
              toggleActions: "play none none none"
            }
          }
        );
      });

      gsap.fromTo(".post-card-animate", 
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".post-grid",
            start: "top 90%",
            toggleActions: "play none none none"
          }
        }
      );
    }, sectionsRef);

    return () => ctx.revert();
  }, []);

  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#A41E22] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">{locale === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
        </div>
      </main>
    );
  }

  // Ensure category diversity in hero posts
  const getDiversePosts = (posts: Post[], count: number): Post[] => {
    const seenCategories = new Set<string>();
    const diversePosts: Post[] = [];
    
    for (const post of posts) {
      if (diversePosts.length >= count) break;
      const catName = post.categories?.nodes?.[0]?.name || '';
      if (!seenCategories.has(catName)) {
        seenCategories.add(catName);
        diversePosts.push(post);
      }
    }
    
    // If not enough diverse posts, fill with remaining posts
    if (diversePosts.length < count) {
      for (const post of posts) {
        if (diversePosts.length >= count) break;
        if (!diversePosts.find(p => p.id === post.id)) {
          diversePosts.push(post);
        }
      }
    }
    
    return diversePosts;
  };

  // Get IDs of posts already shown in previous sections
  const getShownPostIds = (posts: Post[]): Set<string> => {
    return new Set(posts.map(p => p.id));
  };

  // Filter out already shown posts from a section
  const filterOutShownPosts = (posts: Post[], shownIds: Set<string>, count: number): Post[] => {
    const filtered: Post[] = [];
    for (const post of posts) {
      if (filtered.length >= count) break;
      if (!shownIds.has(post.id)) {
        filtered.push(post);
      }
    }
    // If not enough posts, get from latestPosts pool
    if (filtered.length < count && latestPosts.length > 0) {
      for (const post of latestPosts) {
        if (filtered.length >= count) break;
        if (!shownIds.has(post.id) && !filtered.find(p => p.id === post.id)) {
          filtered.push(post);
        }
      }
    }
    return filtered;
  };

  const diverseHeroPosts = getDiversePosts(heroPosts, 5);
  const featuredPost = diverseHeroPosts[0];
  const secondaryPosts = diverseHeroPosts.slice(1, 5) as Post[];
  
  // Track all shown post IDs
  const heroPostIds = getShownPostIds(diverseHeroPosts);
  
  // Filter trending to exclude hero posts (from /trending API - ordered by view count)
  const allTrendingPosts = filterOutShownPosts(trendingPosts, heroPostIds, 20);
  
  // Hero sidebar shows first 6 trending posts
  const heroSidebarTrending = allTrendingPosts.slice(0, 6);
  const heroSidebarTrendingIds = getShownPostIds(heroSidebarTrending);
  
  // "Trending Now" section shows remaining trending posts (excluding hero sidebar posts)
  const displayTrendingPosts = allTrendingPosts.filter(post => !heroSidebarTrendingIds.has(post.id));
  const trendingPostIds = new Set([...heroPostIds, ...heroSidebarTrendingIds, ...getShownPostIds(displayTrendingPosts)]);
  
  // Filter popular to exclude hero + trending
  const displayPopularPosts = filterOutShownPosts(popularPosts, trendingPostIds, 8);
  const popularPostIds = new Set([...trendingPostIds, ...getShownPostIds(displayPopularPosts)]);
  
  // Filter editor's choice to exclude hero + trending + popular
  const displayEditorsChoice = filterOutShownPosts(editorsChoicePosts, popularPostIds, 12);
  const editorsPostIds = new Set([...popularPostIds, ...getShownPostIds(displayEditorsChoice)]);

  // Filter latest news to exclude all previous sections (hero + trending + popular + editors)
  const displayLatestPosts = filterOutShownPosts(latestPosts, editorsPostIds, 60);

  // Use menu categories if API categories are empty
  const displayCategories = categories.length > 0 ? categories : menuCategories;

  return (
    <main ref={sectionsRef} className="bg-gray-50 min-h-screen pt-10 sm:pt-12 lg:pt-14">
      {/* Ad Slot 12 - Above Hero */}
      {getAdBySlot(12) && (
        <section className="container mx-auto px-2 md:px-4 py-2">
          <AdBanner 
            slotId={12} 
            adImage={getAdBySlot(12)?.image} 
            adLink={getAdBySlot(12)?.link}
            className="rounded-lg" 
          />
        </section>
      )}

      <HeroSection 
        featuredPost={featuredPost} 
        secondaryPosts={secondaryPosts} 
        trendingPosts={heroSidebarTrending}
        locale={locale} 
      />

      {/* Ad Slot 1 - Below Hero */}
      {getAdBySlot(1) && (
        <section className="container mx-auto px-2 md:px-4 py-3 md:py-4">
          <AdBanner 
            slotId={1} 
            adImage={getAdBySlot(1)?.image} 
            adLink={getAdBySlot(1)?.link}
            className="rounded-lg" 
          />
        </section>
      )}

      {/* Video Section - Show message if no videos */}
      <section className="container mx-auto px-2 md:px-4 py-4 md:py-6 gsap-section">
        {videos && videos.length > 0 ? (
          <VideoSlider 
            videos={videos} 
            locale={locale}
            currentVideo={currentVideo}
            onVideoClose={closeVideoModal}
            onVideoClick={openVideoModal}
          />
        ) : (
          <div className="bg-gray-100 rounded-lg p-6 md:p-8 text-center">
            <p className="text-gray-700">
              {locale === "bn" ? "কোনো ভিডিও পাওয়া যায়নি" : "No videos available"}
            </p>
          </div>
        )}
      </section>

      {/* ========================================
          THREE NEW SECTIONS ABOVE SUBSCRIBE
      ======================================== */}

      {/* SECTION 1: Trending Now - 1 Large + 2 Small Layout */}
      <section className="container mx-auto px-2 md:px-4 py-4 md:py-6 gsap-section">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="w-1 h-6 md:h-8 bg-[#A41E22]" />
          <h2 className="text-xl md:text-2xl font-bold text-[#6C1312]">{locale === "bn" ? "আলোচিত" : "Trending Now"}</h2>
        </div>
        {displayTrendingPosts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 items-stretch">
            {/* Large Featured Post */}
            <div className="lg:col-span-2 h-full">
              <Link href={`/${locale}/${displayTrendingPosts[0]?.slug}`} className="group block">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  {displayTrendingPosts[0]?.featuredImage?.node?.sourceUrl ? (
                    <img 
                      src={displayTrendingPosts[0].featuredImage.node.sourceUrl} 
                      alt={displayTrendingPosts[0].featuredImage.node.altText || displayTrendingPosts[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-700">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                    <span className="inline-block px-2 py-0.5 md:py-1 bg-[#A41E22] text-white text-xs font-bold rounded mb-1 md:mb-2">
                      {locale === "bn" ? "আলোচিত" : "TRENDING"}
                    </span>
                    <h3 className="text-lg md:text-2xl font-bold text-white group-hover:text-[#A41E22] transition-colors line-clamp-2">
                      {displayTrendingPosts[0]?.title}
                    </h3>
                    {displayTrendingPosts[0]?.excerpt && (
                      <p className="text-gray-300 text-xs md:text-sm mt-1 md:mt-2 line-clamp-2" 
                         dangerouslySetInnerHTML={{ __html: displayTrendingPosts[0].excerpt }} 
                      />
                    )}
                  </div>
                </div>
              </Link>
            </div>
            {/* Two Small Posts - Equal height to left column */}
            <div className="flex flex-col gap-2 md:gap-4 h-full">
              {displayTrendingPosts.slice(1, 7).map((post) => (
                <Link key={post.id} href={`/${locale}/${post.slug}`} className="group flex gap-2 md:gap-3 items-center flex-1">
                  <div className="w-16 md:w-24 h-14 md:h-20 flex-shrink-0 rounded overflow-hidden">
                    {post?.featuredImage?.node?.sourceUrl ? (
                      <img 
                        src={post.featuredImage.node.sourceUrl} 
                        alt={post.featuredImage.node.altText || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs md:text-sm font-bold text-gray-800 group-hover:text-[#A41E22] transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                      <span className="text-gray-600 text-xs">
                        {new Date(post.date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US')}
                      </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-700 text-center py-4">
            {locale === "bn" ? "কোনো খবর পাওয়া যায়নি" : "No trending posts available"}
          </p>
        )}
      </section>

      {/* SECTION 2: Most Popular - Thumbnail Left List Layout */}
      <section className="container mx-auto px-2 md:px-4 py-4 md:py-6 gsap-section">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="w-1 h-6 md:h-8 bg-[#A41E22]" />
          <h2 className="text-xl md:text-2xl font-bold text-[#6C1312]">{locale === "bn" ? "সবচেয়ে জনপ্রিয়" : "Most Popular"}</h2>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {displayPopularPosts.length > 0 ? (
            displayPopularPosts.slice(0, 8).map((post) => (
              <Link 
                key={post.id} 
                href={`/${locale}/${post.slug}`} 
                className="group flex items-center gap-2 md:gap-4 p-2 md:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <div className="w-14 md:w-20 h-12 md:h-16 flex-shrink-0 rounded overflow-hidden">
                  {post?.featuredImage?.node?.sourceUrl ? (
                    <img 
                      src={post.featuredImage.node.sourceUrl} 
                      alt={post.featuredImage.node.altText || post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-[#A41E22] transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1">
                    {post.categories?.nodes?.[0] && (
                      <span className="text-xs text-[#A41E22] font-medium">
                        {post.categories.nodes[0].name}
                      </span>
                    )}
                    <span className="text-xs text-gray-700">
                      • {new Date(post.date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US')}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-700 text-center py-6 md:py-8">
              {locale === "bn" ? "কোনো খবর পাওয়া যায়নি" : "No posts available"}
            </p>
          )}
        </div>
      </section>

      {/* SECTION 3: Editor's Choice - 3-Column Grid Layout */}
      <section className="container mx-auto px-2 md:px-4 py-4 md:py-6 gsap-section">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="w-1 h-6 md:h-8 bg-[#A41E22]" />
          <h2 className="text-xl md:text-2xl font-bold text-[#6C1312]">{locale === "bn" ? "সম্পাদকের পছন্দ" : "Editor's Choice"}</h2>
        </div>
        {displayEditorsChoice.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {displayEditorsChoice.slice(0, 12).map((post) => (
              <Link key={post.id} href={`/${locale}/${post.slug}`} className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video overflow-hidden">
                  {post?.featuredImage?.node?.sourceUrl ? (
                    <img 
                      src={post.featuredImage.node.sourceUrl} 
                      alt={post.featuredImage.node.altText || post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-700">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-3 md:p-4">
                  {post.categories?.nodes?.[0] && (
                    <span className="inline-block px-2 py-0.5 md:py-1 bg-[#A41E22] text-white text-xs font-bold rounded mb-1 md:mb-2">
                      {post.categories.nodes[0].name}
                    </span>
                  )}
                  <h4 className="text-sm md:text-base font-bold text-gray-800 group-hover:text-[#A41E22] transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-xs md:text-sm text-gray-700 mt-1 md:mt-2 line-clamp-2" 
                     dangerouslySetInnerHTML={{ __html: post.excerpt || '' }} 
                  />
                  <span className="text-xs text-gray-700 mt-1 md:mt-2 block">
                    {new Date(post.date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-700 text-center py-4">
            {locale === "bn" ? "কোনো খবর পাওয়া যায়নি" : "No posts available"}
          </p>
        )}
      </section>

      {/* Categories Section - New Design */}
      <section className="container mx-auto px-2 md:px-4 py-6 md:py-8 gsap-section">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="w-6 md:w-10 h-1 bg-[#A41E22]" />
            <span className="text-[#A41E22] font-semibold text-xs md:text-sm uppercase tracking-wider">
              {locale === "bn" ? "আবিষ্কার করুন" : "Discover"}
            </span>
            <div className="w-6 md:w-10 h-1 bg-[#A41E22]" />
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#6C1312]">
            {locale === "bn" ? "বিভাগসমূহ" : "Categories"}
          </h2>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto px-2 text-sm md:text-base">
            {locale === "bn" 
              ? "আপনার আগ্রহের যেকোনো বিষয়ে সর্বশেষ খবর এবং আপডেট পান"
              : "Stay updated with the latest news on topics that interest you"
            }
          </p>
        </div>
        {displayCategories && displayCategories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
            {displayCategories.slice(0, 12).map((category) => (
              <CategoryCard key={category.id} category={category} locale={locale} variant="featured" />
            ))}
          </div>
        ) : (
          <p className="text-gray-700 text-center py-4">
            {locale === "bn" ? "কোনো বিভাগ পাওয়া যায়নি" : "No categories found"}
          </p>
        )}
      </section>

      {/* Latest News Section */}
      <section className="container mx-auto px-2 md:px-4 py-4 md:py-6 gsap-section">
        <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-1 h-6 md:h-8 bg-[#A41E22]" />
            <h2 className="text-xl md:text-2xl font-bold text-[#6C1312]">{locale === "bn" ? "সর্বশেষ খবর" : "Latest News"}</h2>
          </div>
          <Link href={`/${locale}/category/সব-পোস্ট`} className="text-[#A41E22] font-semibold hover:underline text-xs md:text-sm">
            {locale === "bn" ? "সব দেখুন" : "View All"} →
          </Link>
        </div>
        {displayLatestPosts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 post-grid">
            {displayLatestPosts.slice(0, 16).map((post) => (
              <div key={post.id} className="post-card-animate">
                <PostCard post={post} variant="medium" locale={locale} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-700 text-center py-4">
            {locale === "bn" ? "কোনো খবর পাওয়া যায়নি" : "No news available"}
          </p>
        )}
      </section>

      {/* Ad Slot 13 - Between Latest News */}
      {getAdBySlot(13) && (
        <section className="container mx-auto px-2 md:px-4 py-2">
          <AdBanner 
            slotId={13} 
            adImage={getAdBySlot(13)?.image} 
            adLink={getAdBySlot(13)?.link}
            className="rounded-lg" 
          />
        </section>
      )}

      {/* Subscribe Section */}
      <section className="container mx-auto px-2 md:px-4 py-6 md:py-8 gsap-section">
        <SubscribeForm variant="hero" />
      </section>

      {/* Ad Slot 15 - Below Subscribe */}
      {getAdBySlot(15) && (
        <section className="container mx-auto px-2 md:px-4 py-2">
          <AdBanner 
            slotId={15} 
            adImage={getAdBySlot(15)?.image} 
            adLink={getAdBySlot(15)?.link}
            className="rounded-lg" 
          />
        </section>
      )}

      {/* More Category Cards */}
      {displayCategories.length > 6 && (
        <section className="container mx-auto px-2 md:px-4 py-4 md:py-6 gsap-section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {displayCategories.slice(6, 9).map((category) => (
              <CategoryCard key={category.id} category={category} locale={locale} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {/* Ad Slot 14 - Below Categories */}
      {getAdBySlot(14) && (
        <section className="container mx-auto px-2 md:px-4 py-2">
          <AdBanner 
            slotId={14} 
            adImage={getAdBySlot(14)?.image} 
            adLink={getAdBySlot(14)?.link}
            className="rounded-lg" 
          />
        </section>
      )}

      {/* More Latest Posts - First Row (Posts 17-32) */}
      {displayLatestPosts.length > 16 && (
        <section className="container mx-auto px-2 md:px-4 py-4 md:py-6 gsap-section">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 post-grid">
            {displayLatestPosts.slice(16, 32).map((post) => (
              <div key={post.id} className="post-card-animate">
                <PostCard post={post} variant="small" locale={locale} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* More Latest Posts - Second Row (Posts 33-48) */}
      {displayLatestPosts.length > 32 && (
        <section className="container mx-auto px-2 md:px-4 py-4 md:py-6 gsap-section">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 post-grid">
            {displayLatestPosts.slice(32, 48).map((post) => (
              <div key={post.id} className="post-card-animate">
                <PostCard post={post} variant="small" locale={locale} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* More Latest Posts - Third Row (Posts 49-60) */}
      {displayLatestPosts.length > 48 && (
        <section className="container mx-auto px-2 md:px-4 py-4 md:py-6 gsap-section">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 post-grid">
            {displayLatestPosts.slice(48, 60).map((post) => (
              <div key={post.id} className="post-card-animate">
                <PostCard post={post} variant="small" locale={locale} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ad Slot 2 - Above Footer */}
      {getAdBySlot(2) && (
        <section className="container mx-auto px-2 md:px-4 py-3 md:py-4 pb-6 md:pb-8">
          <AdBanner 
            slotId={2} 
            adImage={getAdBySlot(2)?.image} 
            adLink={getAdBySlot(2)?.link}
            className="rounded-lg" 
          />
        </section>
      )}

      {/* Full Page Video Modal with Backdrop Blur */}
      {currentVideo && (
        <>
          {/* Backdrop blur overlay - covers entire viewport */}
          <div 
            className="fixed inset-0 z-[9980] bg-black/70 backdrop-blur-lg"
            onClick={closeVideoModal}
          />
          {/* Video modal container */}
          <div className="fixed inset-0 z-[9981] flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none">
            <div 
              className="relative w-full max-w-6xl h-full max-h-[85vh] bg-black rounded-2xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeVideoModal}
                className="absolute top-3 right-3 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold transition-all backdrop-blur-md border border-white/20"
              >
                ✕
              </button>
              
              {/* Video player */}
              <div className="flex-1 bg-black flex items-center justify-center min-h-0">
                {(currentVideo.type === "self-hosted" || currentVideo.type === "selfhosted") ? (
                  <video
                    src={currentVideo.url || currentVideo.embedUrl}
                    controls
                    autoPlay
                    className="w-full h-full max-h-[75vh] object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : currentVideo.embedUrl ? (
                  <iframe
                    src={currentVideo.embedUrl}
                    className="w-full h-full max-h-[75vh]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white">Video URL not available</p>
                  </div>
                )}
              </div>
              
              {/* Video info */}
              {currentVideo.title && (
                <div className="flex-shrink-0 p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                  <h3 className="text-white text-lg md:text-2xl font-bold">{currentVideo.title}</h3>
                  {currentVideo.excerpt && (
                    <p className="text-gray-300 mt-1 md:mt-2 text-sm md:text-base line-clamp-2">{currentVideo.excerpt}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </main>
  );
};

export default HomepageClient;
