// src/components/CategoryCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Newspaper, Globe, Cpu, Utensils, Plane, Heart, 
  Music, Film, BookOpen, Briefcase, ChevronRight, Sparkles
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  count?: number;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
};

type CategoryCardProps = {
  category: Category;
  variant?: "large" | "medium" | "small" | "featured";
  locale?: string;
  className?: string;
};

const gradients = [
  "from-[#A41E22] via-[#8B1A1D] to-[#6C1312]",
  "from-[#1E3A8A] via-[#1D4ED8] to-[#1E40AF]",
  "from-[#047857] via-[#059669] to-[#047857]",
  "from-[#7C3AED] via-[#8B5CF6] to-[#7C3AED]",
  "from-[#EA580C] via-[#F97316] to-[#EA580C]",
  "from-[#0891B2] via-[#06B6D4] to-[#0891B2]"
];

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('news') || name.includes('খবর') || name.includes('সংবাদ')) return Newspaper;
  if (name.includes('world') || name.includes('বিশ্ব') || name.includes('international')) return Globe;
  if (name.includes('tech') || name.includes('technology') || name.includes('প্রযুক্তি')) return Cpu;
  if (name.includes('food') || name.includes('খাবার') || name.includes('রান্না')) return Utensils;
  if (name.includes('travel') || name.includes('ভ্রমণ')) return Plane;
  if (name.includes('health') || name.includes('স্বাস্থ্য')) return Heart;
  if (name.includes('music') || name.includes('সঙ্গীত')) return Music;
  if (name.includes('movie') || name.includes('film') || name.includes('সিনেমা')) return Film;
  if (name.includes('book') || name.includes('education') || name.includes('শিক্ষা') || name.includes('বই')) return BookOpen;
  if (name.includes('business') || name.includes('finance') || name.includes('ব্যবসা')) return Briefcase;
  return Sparkles;
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  variant = "medium",
  locale = "bn",
  className = "",
}) => {
  const imageUrl = category.featuredImage?.node?.sourceUrl;
  const imageAlt = category.featuredImage?.node?.altText || category.name;
  const categoryLink = `/${locale}/category/${category.slug}`;
  const Icon = getCategoryIcon(category.name);
  const gradientIndex = parseInt(category.id) || 0;
  const gradient = gradients[gradientIndex % gradients.length];

  // Featured variant - New attractive design with gradients and icons
  if (variant === "featured") {
    return (
      <Link
        href={categoryLink}
        className={`group relative block overflow-hidden rounded-2xl ${className}`}
      >
        <div className={`
          relative overflow-hidden p-4 md:p-6
          bg-gradient-to-br ${gradient}
          transform transition-all duration-500
          hover:scale-105 hover:-translate-y-2
          shadow-lg
          before:absolute before:inset-0
          before:bg-gradient-to-br before:from-white/10 before:to-transparent
          before:opacity-0 before:transition-opacity
          hover:before:opacity-100
        `}>
          <div className="absolute top-0 right-0 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-xl" />
          <div className="absolute bottom-0 left-0 w-12 md:w-16 h-12 md:h-16 bg-black/10 rounded-full translate-y-4 -translate-x-4 blur-lg" />
          
          <div className="relative z-10">
            <div className="
              w-10 h-10 md:w-12 md:h-12 rounded-xl
              bg-white/20 backdrop-blur-sm
              flex items-center justify-center
              transform transition-all duration-500
              group-hover:rotate-12 group-hover:scale-110 mb-2 md:mb-3
            ">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2} />
            </div>
            
            <h3 className="text-base md:text-lg font-bold text-white group-hover:text-white transition-colors line-clamp-1">
              {category.name}
            </h3>
            
            <p className="text-white/70 text-xs md:text-sm mt-0.5 md:mt-1">
              {locale === "bn" ? "আরও দেখুন" : "Explore now"}
            </p>
          </div>
          
          <div className="
            absolute bottom-3 md:bottom-4 right-3 md:right-4
            w-6 md:w-7 h-6 md:h-7 rounded-full
            bg-white/20 backdrop-blur-sm
            flex items-center justify-center
            transform transition-all duration-500
            opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0
          ">
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "large") {
    return (
      <Link
        href={categoryLink}
        className={`group relative block overflow-hidden rounded-lg ${className}`}
      >
        {imageUrl ? (
          <div className="relative h-40 md:h-48 lg:h-64 bg-gray-100">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        ) : (
          <div className={`relative h-40 md:h-48 lg:h-64 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute top-3 md:top-4 right-3 md:right-4">
              <Icon className="w-6 h-6 md:w-8 md:h-8 text-white/30" />
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
          <h3 className="text-base md:text-xl font-bold text-white group-hover:text-white/80 transition-colors">
            {category.name}
          </h3>
        </div>
      </Link>
    );
  }

  if (variant === "small") {
    return (
      <Link
        href={categoryLink}
        className={`group flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
      >
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm md:text-base">
              {category.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 group-hover:text-[#A41E22] transition-colors text-sm md:text-base">
            {category.name}
          </h4>
        </div>
      </Link>
    );
  }

  // Medium variant (default)
  return (
    <Link
      href={categoryLink}
      className={`group relative block overflow-hidden rounded-lg ${className}`}
    >
      {imageUrl ? (
        <div className="relative h-28 md:h-36 bg-gray-100">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
      ) : (
        <div className={`relative h-28 md:h-36 bg-gradient-to-br ${gradient}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-2 md:top-3 right-2 md:right-3">
            <Icon className="w-4 h-4 md:w-6 md:h-6 text-white/40" />
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
        <h3 className="text-sm md:text-base font-bold text-white group-hover:text-white/80 transition-colors">
          {category.name}
        </h3>
      </div>
    </Link>
  );
};

export default CategoryCard;
