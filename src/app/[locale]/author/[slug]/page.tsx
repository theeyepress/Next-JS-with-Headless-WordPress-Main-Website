// src/app/[locale]/author/[slug]/page.tsx
import { fetchGraphQL } from "@/lib/graphql";
import { routing } from "@/i18n/routing";
import AuthorPageClient from "./AuthorPageClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getAuthorData(slug: string, locale: string) {
  const decodedSlug = decodeURIComponent(slug);

  try {
    const data = await fetchGraphQL(
      `query { users(first: 20) { nodes { id name description slug avatar { url } } } }`,
      {},
      locale
    );
    
    const users = data?.users?.nodes || [];
    
    let author = users.find((u: any) => u.slug === decodedSlug);
    if (!author) {
      author = users.find((u: any) => u.slug?.toLowerCase() === decodedSlug.toLowerCase());
    }
    if (!author) {
      author = users.find((u: any) => u.name === decodedSlug);
    }
    
    if (!author) return null;
    
    // Get author's posts
    const postsData = await fetchGraphQL(
      `query GetPostsByAuthor($slug: String!) { posts(first: 20, where: {authorName: $slug}) { nodes { id title slug excerpt date featuredImage { node { sourceUrl altText } } categories { nodes { name slug } } } } }`,
      { slug: author.slug },
      locale
    );
    
    return {
      ...author,
      posts: postsData?.posts?.nodes || []
    };
  } catch (error) {
    console.error("Error fetching author:", error);
    return null;
  }
}

export default async function AuthorPage({ params }: PageProps) {
  const { locale, slug } = await params;
  
  const validLocale = locale && routing.locales.includes(locale as typeof routing.locales[number])
    ? locale
    : routing.defaultLocale;

  const author = await getAuthorData(slug, validLocale);

  if (!author) {
    notFound();
  }

  return (
    <AuthorPageClient
      locale={validLocale}
      author={author}
    />
  );
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
