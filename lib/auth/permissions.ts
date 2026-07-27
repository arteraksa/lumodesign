import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function getAdminContext() {
  if (!getSupabaseConfig()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) return null;

  const { data: canManage, error } = await supabase.rpc("can_manage_portfolio");
  if (error || !canManage) return null;

  return { supabase, userId };
}

export async function requireAdmin() {
  const context = await getAdminContext();
  if (!context) redirect("/admin/login" as never);
  return context;
}
