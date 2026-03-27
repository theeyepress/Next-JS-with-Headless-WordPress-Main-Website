// src/app/[locale]/search/SearchClient.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import Link from "next/link";

type SearchClientProps = {
  locale: string;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  date: string;
  language?: string;
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

function SearchContent({ locale }: SearchClientProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      setSearched(true);
      
      const wpUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.theeyepress.com';
      
      fetch(`${wpUrl}/wp-json/eyepress/v1/search-all?q=${encodeURIComponent(query)}&locale=${locale}`)
        .then((res) => res.json())
        .then((data) => {
          setPosts(data.results || []);
          setTotal(data.total || 0);
        })
        .catch(() => {
          setPosts([]);
          setTotal(0);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPosts([]);
      setTotal(0);
      setSearched(false);
    }
  }, [query]);

  const labels = {
    title: locale === "bn" ? "খুঁজুন" : "Search",
    placeholder: locale === "bn" ? "আপনি কী খুঁজছেন?" : "What are you looking for?",
    noResults: locale === "bn" ? "কোনো ফলাফল পাওয়া যায়নি" : "No results found",
    tryDifferent: locale === "bn" ? "অন্য কিছু খুঁজে দেখুন" : "Try different keywords",
    searching: locale === "bn" ? "খুঁজছি..." : "Searching...",
    resultsFor: locale === "bn" ? "এর জন্য ফলাফল" : "Results for",
    postsFound: locale === "bn" ? "টি পোস্ট পাওয়া গেছে" : "posts found",
    searchInBoth: locale === "bn" ? "বাংলা ও ইংরেজি সব পোস্টে খুঁজছি..." : "Searching in all posts (Bengali & English)...",
    featured: locale === "bn" ? "ফিচারড" : "Featured",
    readMore: locale === "bn" ? "আরো পড়ুন" : "Read more",
    goHome: locale === "bn" ? "হোমপেজে যান" : "Go to Homepage",
    startSearching: locale === "bn" ? "খুঁজতে শুরু করুন" : "Start Searching",
    lookingFor: locale === "bn" ? "আপনার কী নিয়ে জানতে চান?" : "What would you like to know?"
  };

  return (
    <main className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Search Section */}
      <div className="relative bg-gradient-to-r from-[#6C1312] via-[#8a1a1d] to-[#A41E22] py-16 pt-24 sm:pt-28 lg:pt-32 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-lg">
              {labels.title}
            </h1>
            <p className="text-white/80 text-lg">
              {locale === "bn" ? "আমাদের সাইটে সব খবর খুঁজুন" : "Search all news on our site"}
            </p>
          </div>

          {/* Enhanced Search Form */}
          <form className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur-md group-hover:blur-lg transition-all"></div>
              <div className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="pl-6">
                  <svg className="w-7 h-7 text-[#A41E22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder={labels.placeholder}
                  className="w-full px-4 py-4 md:px-5 md:py-6 text-base md:text-lg bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-5 py-3 md:px-8 md:py-4 bg-gradient-to-r from-[#A41E22] to-[#6C1312] text-white font-bold hover:from-[#6C1312] hover:to-[#A41E22] transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {locale === "bn" ? "খুঁজুন" : "Search"}
                </button>
              </div>
            </div>
          </form>

          {query && (
            <p className="text-center mt-4 text-white/70 text-sm">
              {labels.searchInBoth}
            </p>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="relative">
              <div className="w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#A41E22] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">{labels.searching}</p>
            <p className="text-gray-400 text-sm mt-2">{query}</p>
          </div>
        ) : searched && query ? (
          <>
            {/* Results Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    <span className="text-[#A41E22]">{total}</span> {labels.postsFound}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {labels.resultsFor}: <span className="font-semibold text-gray-800">"{query}"</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 bg-gradient-to-r from-[#6C1312] to-[#A41E22] text-white text-sm font-bold rounded-full">
                    {labels.featured}
                  </span>
                </div>
              </div>
            </div>
            
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, index) => (
                  <Link 
                    key={post.id} 
                    href={`/${locale}/${post.slug}`} 
                    className="group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                      {/* Featured Image */}
                      <div className="relative h-52 overflow-hidden">
                        {post.featuredImage?.node?.sourceUrl ? (
                          <div className="relative h-full">
                            <img 
                              src={post.featuredImage.node.sourceUrl} 
                              alt={post.featuredImage.node.altText || post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#A41E22] to-[#6C1312] flex items-center justify-center">
                            <span className="text-6xl font-bold text-white/30">
                              {post.title?.charAt(0) || "E"}
                            </span>
                          </div>
                        )}
                        
                        {/* Category Badge */}
                        {post.categories?.nodes?.[0] && (
                          <div className="absolute top-4 left-4">
                            <span className="px-4 py-1.5 bg-[#A41E22] text-white text-xs font-bold uppercase rounded-full shadow-lg backdrop-blur-sm">
                              {post.categories.nodes[0].name}
                            </span>
                          </div>
                        )}

                        {/* Language Badge */}
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-black/50 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                            {post.language === 'en' ? 'EN' : 'BN'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#A41E22] transition-colors line-clamp-2 mb-3 leading-tight">
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                          {post.excerpt?.replace(/<[^>]*>/g, "").slice(0, 80)}...
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(post.date).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <span className="text-[#A41E22] text-sm font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            {labels.readMore}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="relative w-28 h-28 mx-auto mb-6">
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-[#A41E22] to-[#6C1312] rounded-full flex items-center justify-center">
                    <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{labels.noResults}</h3>
                <p className="text-gray-500 mb-6">
                  "{query}" {labels.tryDifferent}
                </p>
                <Link 
                  href={`/${locale}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#A41E22] to-[#6C1312] text-white font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {labels.goHome}
                </Link>
              </div>
            )}
          </>
        ) : (
          /* Initial State - Show search prompt */
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#A41E22] to-[#6C1312] rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {labels.startSearching}
            </h3>
            <p className="text-gray-500">
              {labels.lookingFor}
            </p>
          </div>
        )}
      </div>

      {/* Ad Banner */}
      <div className="container mx-auto px-4 pb-8">
        <AdBanner slotId={9} height="100px" className="rounded-lg" />
      </div>
    </main>
  );
}

export default function SearchClient({ locale }: SearchClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A41E22] border-t-transparent"></div>
      </div>
    }>
      <SearchContent locale={locale} />
    </Suspense>
  );
}
