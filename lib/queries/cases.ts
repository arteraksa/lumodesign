import "server-only";

import { cache } from "react";
import { requireSupabaseConfig } from "@/lib/supabase/config";
import type { PortfolioCase } from "@/lib/supabase/database.types";

export const CASES_CACHE_TAG = "portfolio-cases";

const legacyFramerPrefix = "https://arteraksa.github.io/raksadesign/framerusercontent.com/";
const framerOrigin = "https://framerusercontent.com/";

function normalizeLegacyMediaUrl(url: string) {
  return url.startsWith(legacyFramerPrefix) ? `${framerOrigin}${url.slice(legacyFramerPrefix.length)}` : url;
}

function coverUrl(item: PortfolioCase, baseUrl: string) {
  if (item.cover_url) return normalizeLegacyMediaUrl(item.cover_url);
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
      // GitHub Pages needs a static export, so public case data is resolved
      // at build time instead of on every request.
      cache: "force-cache",
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
      source_url: normalizeLegacyMediaUrl(media.source_url),
    })),
  }));
}

export const getPublishedCases = cache(async () =>
  fetchCases(
    "select=*&status=eq.published&order=portfolio_order.asc.nullslast,published_at.desc.nullslast",
  ),
);

export const getFeaturedCases = cache(async () => {
  return fetchCases(
    "select=*&status=eq.published&featured_on_home=eq.true&order=home_order.asc.nullslast,published_at.desc.nullslast&limit=9",
  );
});

export const getPublishedCaseBySlug = cache(async (slug: string) => {
  const cases = await fetchCases(
    `select=*,portfolio_case_media(*)&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`,
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
    },
  );
  if (!historyResponse.ok) throw new Error("Não foi possível resolver o histórico do case.");
  const history = (await historyResponse.json()) as Array<{ case_id: string; old_slug: string }>;
  const caseId = history[0]?.case_id;
  if (!caseId) return { item: null, legacySlug: false };

  const matches = await fetchCases(
    `select=*,portfolio_case_media(*)&status=eq.published&id=eq.${encodeURIComponent(caseId)}&limit=1`,
  );
  return { item: matches[0] ?? null, legacySlug: Boolean(matches[0]) };
});
