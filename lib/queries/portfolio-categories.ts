import { unstable_cache } from "next/cache";
import { requireSupabaseConfig } from "@/lib/supabase/config";
import { caseCategories } from "@/lib/validation/case";

export const PORTFOLIO_CATEGORIES_CACHE_TAG = "portfolio-categories";

export const getPortfolioCategories = unstable_cache(async () => {
  const { url, key } = requireSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/portfolio_categories?select=name,slug&is_active=eq.true&order=name.asc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 60, tags: [PORTFOLIO_CATEGORIES_CACHE_TAG] },
  });
  if (!response.ok) return [...caseCategories];
  const rows = await response.json() as Array<{ name: string }>;
  return rows.map((row) => row.name);
}, ["portfolio-categories"], { revalidate: 60, tags: [PORTFOLIO_CATEGORIES_CACHE_TAG] });
