// src/app/[locale]/author/[slug]/AuthorPageClient.tsx
"use client";

import React from "react";
import Image from "next/image";
import Breadcrumbs from "@/components/Breadcrumbs";
import PostCard from "@/components/PostCard";
import AdBanner from "@/components/AdBanner";

type Author = {
  id: string;
  name: string;
  description?: string;
  slug: string;
  avatar?: {
    url: string;
  };
  posts?: {
    nodes: any[];
  };
};

type AuthorPageClientProps = {
  locale: string;
  author: Author;
};

const AuthorPageClient: React.FC<AuthorPageClientProps> = ({
  locale,
  author,
}) => {
  const labels = {
    posts: locale === "bn" ? "টি প্রতিবেদন" : "posts",
    by: locale === "bn" ? "লিখেছেন" : "Written by",
    noPosts: locale === "bn" ? "কোনো পোস্ট পাওয়া যায়নি" : "No posts found",
  };

  const breadcrumbs = [
    { label: locale === "bn" ? "হোম" : "Home", href: `/${locale}` },
    { label: author.name },
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Author Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
          {author.avatar?.url ? (
            <Image
              src={author.avatar.url}
              alt={author.name}
              width={120}
              height={120}
              className="rounded-full"
            />
          ) : (
            <div className="w-30 h-30 rounded-full bg-[#A41E22] flex items-center justify-center text-white text-4xl font-bold">
              {author.name.charAt(0)}
            </div>
          )}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500 mb-1">{labels.by}</p>
            <h1 className="text-3xl font-bold text-[#6C1312] mb-2">
              {author.name}
            </h1>
            {author.description && (
              <p className="text-gray-600">{author.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {author.posts?.nodes?.length || 0} {labels.posts}
            </p>
          </div>
        </div>
      </div>

      {/* Ad Banner */}
      <div className="container mx-auto px-4 pb-4">
        <AdBanner slotId={10} height="100px" className="rounded-lg" />
      </div>

      {/* Posts Grid */}
      <section className="container mx-auto px-4 py-6">
        {author.posts?.nodes && author.posts.nodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {author.posts.nodes.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                variant="medium"
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{labels.noPosts}</p>
          </div>
        )}
      </section>

      {/* Ad Banner */}
      <div className="container mx-auto px-4 py-4">
        <AdBanner slotId={11} height="100px" className="rounded-lg" />
      </div>
    </main>
  );
};

export default AuthorPageClient;
