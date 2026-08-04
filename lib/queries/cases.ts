import "server-only";

import { cache } from "react";
import { requireSupabaseConfig } from "@/lib/supabase/config";
import type { PortfolioCase } from "@/lib/supabase/database.types";
import { normalizeMediaUrl } from "@/lib/portfolio/media-url";

export const CASES_CACHE_TAG = "portfolio-cases";

function coverUrl(item: PortfolioCase, baseUrl: string) {
  if (item.cover_url) return normalizeMediaUrl(item.cover_url);
  if (!item.cover_storage_bucket || !item.cover_storage_path) return "";
  return `${baseUrl}/storage/v1/object/public/${item.cover_storage_bucket}/${item.cover_storage_path}`;
}

async function fetchCases(query: string): Promise<PortfolioCase[]> {
  const config = requireSupabaseConfig();

  const response = await fetch(
    `${config.url}/rest/v1/portfolio_cases?${query}`,
    {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      cache: "force-cache",
      next: { tags: [CASES_CACHE_TAG] },
    },
  );

  if (!response.ok) {
    console.error("Falha ao consultar cases publicados", response.status);
    throw new Error("Não foi possível carregar os cases publicados.");
  }

  const data = (await response.json()) as PortfolioCase[];
  return data.map((item) => ({
    ...item,
    cover_url: coverUrl(item, config.url),
    portfolio_case_media: item.portfolio_case_media?.map((media) => ({
      ...media,
      source_url: normalizeMediaUrl(media.source_url),
    })),
  }));
}

export const getPublishedCases = cache(async () =>
  fetchCases(
    "select=*&status=eq.published&deleted_at=is.null&order=portfolio_order.asc.nullslast,published_at.desc.nullslast",
  ),
);

export const getFeaturedCases = cache(async () => {
  return fetchCases(
    "select=*&status=eq.published&deleted_at=is.null&featured_on_home=eq.true&order=home_order.asc.nullslast,published_at.desc.nullslast&limit=9",
  );
});

export const getPublishedCaseBySlug = cache(async (slug: string) => {
  const cases = await fetchCases(
    `select=*,portfolio_case_media(*)&status=eq.published&deleted_at=is.null&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  );
  return cases.find((item) => item.slug === slug) ?? null;
});

export const getPublishedCaseResolution = cache(async (slug: string) => {
  const current = await getPublishedCaseBySlug(slug);
  if (current) return { item: current, legacySlug: false };

  const config = requireSupabaseConfig();
  const historyResponse = await fetch(
    `${config.url}/rest/v1/portfolio_case_slug_history?select=case_id,old_slug&old_slug=eq.${encodeURIComponent(slug)}&limit=1`,
    {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
      cache: "force-cache",
      next: { tags: [CASES_CACHE_TAG] },
    },
  );
  if (!historyResponse.ok) throw new Error("Não foi possível resolver o histórico do case.");
  const history = (await historyResponse.json()) as Array<{ case_id: string; old_slug: string }>;
  const caseId = history[0]?.case_id;
  if (!caseId) return { item: null, legacySlug: false };

  const matches = await fetchCases(
    `select=*,portfolio_case_media(*)&status=eq.published&deleted_at=is.null&id=eq.${encodeURIComponent(caseId)}&limit=1`,
  );
  return { item: matches[0] ?? null, legacySlug: Boolean(matches[0]) };
});
