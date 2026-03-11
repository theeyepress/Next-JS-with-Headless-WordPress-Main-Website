export async function fetchGraphQL(query: string, variables = {}, locale?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (locale) {
    headers["Accept-Language"] = locale;
    headers["X-WP-Language"] = locale;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch GraphQL");
  }

  const json = await res.json();
  return json.data;
}

// NEW: Direct REST API for menus (bypasses Polylang)
export async function fetchMenusViaRest(locale: string): Promise<any[]> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/menus?locale=${locale}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      throw new Error("Failed to fetch menus");
    }
    return await res.json();
  } catch (e) {
    console.error("REST menu fetch failed:", e);
    return [];
  }
}

// NEW: Direct REST API for footer menu
export async function fetchFooterMenuViaRest(locale: string): Promise<any[]> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/menus/footer?locale=${locale}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      throw new Error("Failed to fetch footer menu");
    }
    const data = await res.json();
    console.log("Footer menu API response:", data);
    return data;
  } catch (e) {
    console.error("REST footer menu fetch failed:", e);
    return [];
  }
}

// NEW: Direct REST API for ticker posts
export async function fetchTickerViaRest(locale: string, count: number = 7): Promise<any[]> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/eyepress/v1/ticker?locale=${locale}&count=${count}`;
  
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to fetch ticker");
    }
    return await res.json();
  } catch (e) {
    console.error("REST ticker fetch failed:", e);
    return [];
  }
}
