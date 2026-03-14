// src/components/PostCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
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
  author?: {
    node: {
      name: string;
      slug: string;
    };
  };
};

type PostCardProps = {
  post: Post;
  variant?: "large" | "medium" | "small" | "list" | "compact";
  showCategory?: boolean;
  showAuthor?: boolean;
  locale?: string;
  className?: string;
};

const PostCard: React.FC<PostCardProps> = ({
  post,
  variant = "medium",
  showCategory = true,
  showAuthor = true,
  locale = "bn",
  className = "",
}) => {
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

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const excerpt = post.excerpt ? stripHtml(post.excerpt).slice(0, 120) + "..." : "";
  const category = post.categories?.nodes?.[0];
  const imageUrl = post.featuredImage?.node?.sourceUrl;
  const imageAlt = post.featuredImage?.node?.altText || post.title;

  const variants = {
    large: "col-span-2 row-span-2",
    medium: "col-span-1",
    small: "col-span-1",
    list: "flex-row",
    compact: "col-span-1",
  };

  if (variant === "list") {
    return (
      <Link
        href={`/${locale}/${encodeURIComponent(post.slug)}`}
        className={`group flex gap-2 md:gap-4 p-2 md:p-3 bg-white hover:bg-gray-50 transition-all duration-300 ${className}`}
      >
        {imageUrl && (
          <div className="relative w-20 h-16 md:w-32 md:h-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 80px, 128px"
            />
          </div>
        )}
        <div className="flex flex-col justify-center flex-1 min-w-0">
          {showCategory && category && (
            <span className="text-xs font-bold text-[#A41E22] uppercase tracking-wide">
              {category.name}
            </span>
          )}
          <h3 className="text-xs md:text-sm font-bold text-gray-900 group-hover:text-[#A41E22] transition-colors line-clamp-2 mt-0.5 md:mt-1">
            {post.title}
          </h3>
          <span className="text-xs text-gray-700 mt-1 md:mt-2">{formatDate(post.date)}</span>
        </div>
      </Link>
    );
  }

  if (variant === "large") {
    return (
      <Link
        href={`/${locale}/${encodeURIComponent(post.slug)}`}
        className={`group block bg-white hover:shadow-lg transition-all duration-300 ${className}`}
      >
        {imageUrl && (
          <div className="relative w-full h-48 md:h-56 lg:h-64 xl:h-80 overflow-hidden rounded-t-lg bg-gray-100">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-500"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {showCategory && category && (
              <div className="absolute top-2 md:top-3 left-2 md:left-3">
                <span className="px-2 md:px-3 py-1 bg-[#A41E22] text-white text-xs font-bold uppercase tracking-wide rounded">
                  {category.name}
                </span>
              </div>
            )}
          </div>
        )}
        <div className="p-3 md:p-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-[#A41E22] transition-colors line-clamp-2">
            {post.title}
          </h2>
          <p className="text-gray-600 mt-1 md:mt-2 line-clamp-2 md:line-clamp-3 text-sm">{excerpt}</p>
          <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3 text-xs md:text-sm text-gray-700">
            {showAuthor && post.author?.node && (
              <span className="font-medium text-gray-700">{post.author.node.name}</span>
            )}
            {showAuthor && post.author?.node && <span>•</span>}
            <span>{formatDate(post.date)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}/${encodeURIComponent(post.slug)}`}
      className={`group block bg-white hover:shadow-lg transition-all duration-300 ${className}`}
    >
      {imageUrl && (
        <div className="relative w-full h-36 md:h-48 overflow-hidden rounded-t-lg bg-gray-100">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {showCategory && category && (
            <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2">
              <span className="px-2 py-0.5 md:py-1 bg-[#A41E22] text-white text-xs font-bold uppercase tracking-wide rounded">
                {category.name}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="p-2 md:p-3">
        <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-[#A41E22] transition-colors line-clamp-2">
          {post.title}
        </h3>
        <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-2 text-xs text-gray-700">
          <span>{formatDate(post.date)}</span>
          {showAuthor && post.author?.node && (
            <>
              <span>•</span>
              <span className="font-medium text-gray-700">{post.author.node.name}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
