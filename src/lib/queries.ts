// src/lib/queries.ts - Extended GraphQL queries for the news website

// Get all posts with pagination
export const GET_POSTS = `
  query GetPosts($first: Int!, $after: String, $categoryId: ID, $search: String) {
    posts(first: $first, after: $after, where: {categoryId: $categoryId, search: $search}) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        slug
        excerpt
        date
        modified
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        author {
          node {
            name
            slug
          }
        }
      }
    }
  }
`;

// Get single post by slug
export const GET_POST_BY_SLUG = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      title
      content
      excerpt
      date
      modified
      slug
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      categories {
        nodes {
          name
          slug
        }
      }
      tags {
        nodes {
          name
          slug
        }
      }
      author {
        node {
          name
          slug
          avatar {
            url
          }
        }
      }
      seo {
        title
        description
        openGraph {
          title
          description
          image {
            url
          }
        }
      }
    }
  }
`;

// Get all categories
export const GET_CATEGORIES = `
  query GetCategories {
    categories(first: 50) {
      nodes {
        id
        name
        slug
        count
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

// Get category by slug
export const GET_CATEGORY_BY_SLUG = `
  query GetCategoryBySlug($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      id
      name
      description
      slug
      count
      posts {
        nodes {
          id
          title
          slug
          excerpt
          date
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

// Get all authors
export const GET_AUTHORS = `
  query GetAuthors {
    users(first: 50) {
      nodes {
        id
        name
        slug
        description
        avatar {
          url
        }
        posts {
          nodes {
            id
          }
        }
      }
    }
  }
`;

// Get author by slug
export const GET_AUTHOR_BY_SLUG = `
  query GetAuthorBySlug($slug: ID!) {
    user(id: $slug, idType: SLUG) {
      id
      name
      description
      slug
      avatar {
        url
      }
      posts(first: 20) {
        nodes {
          id
          title
          slug
          excerpt
          date
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

// Get featured/sticky posts
export const GET_FEATURED_POSTS = `
  query GetFeaturedPosts($first: Int!) {
    posts(first: $first, where: {sticky: true}) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

// Get latest posts
export const GET_LATEST_POSTS = `
  query GetLatestPosts($first: Int!) {
    posts(first: $first) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        author {
          node {
            name
            slug
          }
        }
      }
    }
  }
`;

// Get trending/most read posts (by view count if available, otherwise latest)
export const GET_TRENDING_POSTS = `
  query GetTrendingPosts($first: Int!) {
    posts(first: $first, where: {orderby: {field: VIEW_COUNT, order: DESC}}) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

// Get posts by category
export const GET_POSTS_BY_CATEGORY = `
  query GetPostsByCategory($slug: String!, $first: Int!, $after: String) {
    posts(first: $first, after: $after, where: {categoryName: $slug}) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        author {
          node {
            name
            slug
          }
        }
      }
    }
  }
`;

// Search posts
export const SEARCH_POSTS = `
  query SearchPosts($search: String!, $first: Int!) {
    posts(first: $first, where: {search: $search}) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

// Get related posts by category
export const GET_RELATED_POSTS = `
  query GetRelatedPosts($categoryId: ID!, $postId: ID!, $first: Int!) {
    posts(first: $first, where: {categoryId: $categoryId, notIn: [$postId]}) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

// Get ad slots and site options
export const GET_AD_SLOTS = `
  query GetAdSlots {
    siteOptions {
      ads
      videos
      logo
    }
  }
`;
