import { requireSupabaseConfig } from "@/lib/supabase/config";
import type { PortfolioCase, StorageBucket } from "@/lib/supabase/database.types";
import type { requireAdmin } from "@/lib/auth/permissions";

export function getCaseCoverPreviewUrl(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], item: PortfolioCase) {
  if (item.cover_url) return Promise.resolve(item.cover_url);
  if (!item.cover_storage_bucket || !item.cover_storage_path) return Promise.resolve("");
  const { url } = requireSupabaseConfig();
  if (item.cover_storage_bucket === "portfolio-media" || item.cover_storage_bucket === "case-images") {
    return Promise.resolve(`${url}/storage/v1/object/public/${item.cover_storage_bucket}/${item.cover_storage_path}`);
  }
  return supabase.storage.from(item.cover_storage_bucket as StorageBucket).createSignedUrl(item.cover_storage_path, 60 * 10)
    .then(({ data }) => data?.signedUrl ?? "");
}
