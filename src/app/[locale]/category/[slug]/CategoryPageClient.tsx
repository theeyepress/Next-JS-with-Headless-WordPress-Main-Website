// src/app/[locale]/category/[slug]/CategoryPageClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/Breadcrumbs";
import PostCard from "@/components/PostCard";
import AdBanner from "@/components/AdBanner";
import SubscribeForm from "@/components/SubscribeForm";
import CategoryCard from "@/components/CategoryCard";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  date: string;
  featuredImage?: { node: { sourceUrl: string; altText: string } };
  categories?: { nodes: Array<{ name: string; slug: string }> };
};

type Category = {
  id: string;
  name: string;
  description?: string;
  slug: string;
  count?: number;
  posts?: { nodes: Post[] };
  pagination?: {
    current: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

type CategoryPageClientProps = {
  locale: string;
  category: Category;
  ads?: any[];
  popularPosts?: Post[];
  allCategories?: any[];
  currentPage?: number;
};

const CategoryPageClient: React.FC<CategoryPageClientProps> = ({
  locale,
  category,
  ads = [],
  popularPosts = [],
  allCategories = [],
  currentPage = 1,
}) => {
  const [activeTab, setActiveTab] = useState<"trending" | "latest" | "all">("latest");
  const [posts, setPosts] = useState<Post[]>(category.posts?.nodes || []);
  const [loading, setLoading] = useState(false);

  const labels = {
    trending: locale === "bn" ? "আলোচিত" : "Trending",
    latest: locale === "bn" ? "সর্বশেষ" : "Latest",
    all: locale === "bn" ? "সব পোস্ট" : "All Posts",
    posts: locale === "bn" ? "টি প্রতিবেদন" : "posts",
    noPosts: locale === "bn" ? "কোনো পোস্ট পাওয়া যায়নি" : "No posts found",
    page: locale === "bn" ? "পৃষ্ঠা" : "Page",
    of: locale === "bn" ? "এর" : "of",
    popular: locale === "bn" ? "জনপ্রিয়" : "Popular",
    categories: locale === "bn" ? "বিভাগসমূহ" : "Categories",
    viewAll: locale === "bn" ? "সব দেখুন" : "View All",
    previous: locale === "bn" ? "পূর্ববর্তী" : "Previous",
    next: locale === "bn" ? "পরবর্তী" : "Next",
    backToHome: locale === "bn" ? "হোমপেজে ফিরে যান" : "Back to Home",
  };

  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);
  const pagination = category.pagination;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (locale === "bn") {
      const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      const day = date.getDate().toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      const month = date.toLocaleString("bn-BD", { month: "short" });
      const year = date.getFullYear().toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      return `${day} ${month}, ${year}`;
    }
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPageNumbers = () => {
    if (!pagination || pagination.total_pages <= 1) return [];
    
    const pages: (number | string)[] = [];
    const total = pagination.total_pages;
    const current = pagination.current;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(total);
      }
    }
    
    return pages;
  };

  const breadcrumbs = [
    { label: locale === "bn" ? "হোম" : "Home", href: `/${locale}` },
    { label: category.name },
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-[39px] sm:pt-8 lg:pt-[54px] pb-1">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Hero Section - Category Banner */}
      <div className="container mx-auto px-4 pb-6 pt-4 sm:pt-6 lg:pt-8">
        <div className="relative bg-gradient-to-r from-[#6C1312] to-[#A41E22] rounded-xl overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`,
            }} />
          </div>
          <div className="relative px-8 py-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-gray-200 text-lg max-w-2xl mx-auto mb-4">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ad Banner - Slot 7 */}
      <div className="container mx-auto px-4 pb-6">
        <AdBanner slotId={7} height="100px" className="rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 pb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm">
          {(["trending", "latest", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === tab
                  ? "bg-[#A41E22] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab === "trending" && "🔥 "}
              {tab === "latest" && "🆕 "}
              {tab === "all" && "📋 "}
              {labels[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Featured Post */}
            {featuredPost && activeTab === "latest" && (
              <div className="mb-8">
                <Link
                  href={`/${locale}/${featuredPost.slug}`}
                  className="group block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="relative h-64 md:h-80 w-full">
                    {featuredPost.featuredImage?.node?.sourceUrl ? (
                      <Image
                        src={featuredPost.featuredImage.node.sourceUrl}
                        alt={featuredPost.featuredImage.node.altText || featuredPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-[#A41E22] text-white text-sm font-bold rounded">
                        {locale === "bn" ? "ফিচারড" : "FEATURED"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-[#A41E22] transition-colors mb-3">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p
                        className="text-gray-600 line-clamp-2 mb-4"
                        dangerouslySetInnerHTML={{ __html: featuredPost.excerpt }}
                      />
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatDate(featuredPost.date)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Posts Grid */}
            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(activeTab === "latest" ? gridPosts : posts).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      variant="medium"
                      locale={locale}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                  <div className="mt-12">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {/* Previous */}
                      {pagination.current > 1 && (
                        <Link
                          href={`/${locale}/category/${category.slug}?page=${pagination.current - 1}`}
                          className="px-4 py-2 bg-white rounded-lg font-medium shadow-sm hover:bg-gray-100 transition-colors text-gray-900"
                        >
                          ← {labels.previous}
                        </Link>
                      )}

                      {/* Page Numbers */}
                      {getPageNumbers().map((page, idx) => (
                        typeof page === "number" ? (
                          <Link
                            key={idx}
                            href={`/${locale}/category/${category.slug}?page=${page}`}
                            className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                              page === pagination.current
                                ? "bg-[#A41E22] text-white"
                                : "bg-white hover:bg-gray-100 text-gray-900"
                            }`}
                          >
                            {locale === "bn" 
                              ? page.toString().split("").map(d => "০১২৩৪৫৬৭৮৯"[parseInt(d)] || d).join("")
                              : page
                            }
                          </Link>
                        ) : (
                          <span key={idx} className="px-2 py-2 text-gray-600">
                            {page}
                          </span>
                        )
                      ))}

                      {/* Next */}
                      {pagination.current < pagination.total_pages && (
                        <Link
                          href={`/${locale}/category/${category.slug}?page=${pagination.current + 1}`}
                          className="px-4 py-2 bg-white rounded-lg font-medium shadow-sm hover:bg-gray-100 transition-colors text-gray-900"
                        >
                          {labels.next} →
                        </Link>
                      )}
                    </div>

                    {/* Page Info */}
                    <p className="text-center text-gray-700 mt-4 text-sm font-medium">
                      {labels.page} {pagination.current} {labels.of} {pagination.total_pages}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <p className="text-gray-700 text-lg">{labels.noPosts}</p>
                <Link
                  href={`/${locale}`}
                  className="inline-block mt-4 px-6 py-2 bg-[#6C1312] text-white rounded-lg font-medium hover:bg-[#B42125] transition-all"
                >
                  {labels.backToHome}
                </Link>
              </div>
            )}

            {/* Ad Slot 19 - Between Post Grids */}
            {ads.length > 18 && (
              <div className="mt-8">
                <AdBanner
                  slotId={19}
                  adImage={ads[18]?.image}
                  adLink={ads[18]?.link}
                  className="rounded-lg"
                />
              </div>
            )}

            {/* Ad Banner - Slot 8 */}
            <div className="mt-8">
              <AdBanner slotId={8} height="100px" className="rounded-lg" />
            </div>

            {/* Ad Slot 20 - Below All Posts */}
            {ads.length > 19 && (
              <div className="mt-8">
                <AdBanner
                  slotId={20}
                  adImage={ads[19]?.image}
                  adLink={ads[19]?.link}
                  className="rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            {/* Popular Posts */}
            {popularPosts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                <h3 className="text-lg font-bold text-[#6C1312] mb-4 flex items-center gap-2">
                  <span>📌</span> {labels.popular}
                </h3>
                <div className="space-y-4">
                  {popularPosts.slice(0, 5).map((post, idx) => (
                    <Link
                      key={post.id}
                      href={`/${locale}/${post.slug}`}
                      className="group flex gap-3 items-start"
                    >
                      <span className="text-2xl font-bold text-gray-300 group-hover:text-[#A41E22] transition-colors">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-[#A41E22] transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <span className="text-xs text-gray-400">
                          {formatDate(post.date)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {allCategories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                <h3 className="text-lg font-bold text-[#6C1312] mb-4 flex items-center gap-2">
                  <span>📁</span> {labels.categories}
                </h3>
                <div className="space-y-2">
                  {allCategories.slice(0, 10).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/${locale}/category/${cat.slug}`}
                      className={`group flex items-center py-2 px-3 rounded-lg transition-colors ${
                        cat.slug === category.slug
                          ? "bg-[#A41E22] text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <span className={`font-medium ${
                        cat.slug === category.slug ? "text-white" : "text-gray-700"
                      }`}>
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Ad Slot - Sidebar */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <AdBanner slotId={9} height="250px" className="rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Subscribe Section */}
      <section className="container mx-auto px-4 py-8">
        <SubscribeForm variant="hero" />
      </section>

      {/* Categories Section */}
      {allCategories.length > 0 && (
        <section className="container mx-auto px-4 py-8">
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

export default CategoryPageClient;
