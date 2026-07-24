"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { requireSupabaseConfig } from "./config";

let browserClient: SupabaseClient<Database, "public", "public", Database["public"]> | null = null;

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const { url, key } = requireSupabaseConfig();
  browserClient = createBrowserClient<Database>(url, key) as unknown as SupabaseClient<Database, "public", "public", Database["public"]>;
  return browserClient;
}
