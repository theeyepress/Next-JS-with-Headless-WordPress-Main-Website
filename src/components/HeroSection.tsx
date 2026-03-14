// src/components/HeroSection.tsx

import React from "react";
import Link from "next/link";
import Image from "next/image";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  date: string;
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

type HeroSectionProps = {
  featuredPost?: Post;
  secondaryPosts?: Post[];
  trendingPosts?: Post[];
  locale?: string;
  className?: string;
};

const HeroSection: React.FC<HeroSectionProps> = ({
  featuredPost,
  secondaryPosts = [],
  trendingPosts = [],
  locale = "bn",
  className = "",
}) => {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (locale === "bn") {
      const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      const day = date.getDate().toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      const month = date.toLocaleString("bn-BD", { month: "short" });
      return `${day} ${month}`;
    }
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const labels = {
    trending: locale === "bn" ? "আলোচিত" : "Trending",
    readMore: locale === "bn" ? "আরও পড়ুন" : "Read More",
  };

  return (
    <section className={`bg-white py-4 md:py-6 ${className}`}>
      <div className="container mx-auto px-2 md:px-4">
        {/* Boston Globe Style: Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 md:gap-6">
          
          {/* LEFT COLUMN - Main Featured */}
          <div className="lg:col-span-3">
            {featuredPost && (
              <Link href={`/${locale}/${encodeURIComponent(featuredPost.slug)}`} className="group block">
                <div className="relative h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 overflow-hidden rounded-lg bg-gray-100">
                  {featuredPost.featuredImage?.node?.sourceUrl ? (
                    <Image
                      src={featuredPost.featuredImage.node.sourceUrl}
                      alt={featuredPost.featuredImage.node.altText || featuredPost.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-500"
                      priority
                      sizes="(max-width: 1024px) 100vw, 30vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                  {featuredPost.categories?.nodes?.[0] && (
                    <div className="absolute top-2 md:top-3 left-2 md:left-3">
                      <span className="px-2 md:px-3 py-1 bg-[#A41E22] text-white text-xs font-bold uppercase tracking-wide rounded">
                        {featuredPost.categories.nodes[0].name}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mt-2 md:mt-3 group-hover:text-[#A41E22] transition-colors line-clamp-2">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-600 mt-1 md:mt-2 text-sm line-clamp-2">
                  {(featuredPost.excerpt?.replace(/<[^>]*>/g, "") || featuredPost.content?.replace(/<[^>]*>/g, "") || "").split(" ").slice(0, 10).join(" ")}...
                </p>
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs text-gray-700 mt-2 md:mt-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(featuredPost.date)}
                  </span>
                  <span className="text-gray-300 hidden sm:inline">|</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(featuredPost.date).toLocaleTimeString(locale === "bn" ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {Math.max(1, Math.ceil(((featuredPost.excerpt?.split(/\s+/).length || featuredPost.content?.split(/\s+/).length || 50) / 200)))} {locale === "bn" ? "মিনিট" : "min"} {locale === "bn" ? "পড়তে সময়" : "read"}
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* CENTER COLUMN - Secondary Stories */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {secondaryPosts.slice(0, 4).map((post) => (
              <Link key={post.id} href={`/${locale}/${encodeURIComponent(post.slug)}`} className="group block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-32 md:h-36 overflow-hidden rounded-t-lg bg-gray-100">
                  {post.featuredImage?.node?.sourceUrl ? (
                    <Image
                      src={post.featuredImage.node.sourceUrl}
                      alt={post.featuredImage.node.altText || post.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                  {post.categories?.nodes?.[0] && (
                    <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2">
                      <span className="px-2 py-0.5 md:py-1 bg-[#A41E22] text-white text-xs font-bold uppercase rounded">
                        {post.categories.nodes[0].name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2 md:p-3">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-[#A41E22] transition-colors line-clamp-2">{post.title}</h3>
                  <span className="text-xs text-gray-700 mt-1 block">{formatDate(post.date)}</span>
                </div>
              </Link>
            ))}
          </div>

            {/* RIGHT COLUMN - Trending/Most Read */}
          <div className="lg:col-span-3 bg-gray-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-1 h-5 md:h-6 bg-[#A41E22]" />
              <h3 className="text-base md:text-lg font-bold text-[#6C1312] uppercase tracking-wide">{labels.trending}</h3>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {trendingPosts.slice(0, 6).map((post, index) => {
                const getNumber = (num: number) => {
                  if (locale === "bn") {
                    const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
                    return num.toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
                  }
                  return num.toString();
                };
                
                return (
                  <Link key={post.id} href={`/${locale}/${encodeURIComponent(post.slug)}`} className="group flex gap-2 md:gap-3 items-start">
                    {/* Number - Leftmost */}
                    <span className="text-lg md:text-xl font-bold text-[#A41E22] opacity-50 group-hover:opacity-100 transition-opacity min-w-[16px] md:min-w-[20px]">
                      {getNumber(index + 1)}
                    </span>
                    
                    {/* Thumbnail - Middle */}
                    <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                      {post.featuredImage?.node?.sourceUrl ? (
                        <Image
                          src={post.featuredImage.node.sourceUrl}
                          alt={post.featuredImage.node.altText || post.title}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <svg className="w-4 h-4 md:w-6 md:h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Title & Date - Rightmost */}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-gray-900 group-hover:text-[#A41E22] transition-colors line-clamp-2">{post.title}</h4>
                      <span className="text-xs text-gray-700">{formatDate(post.date)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
