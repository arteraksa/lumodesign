import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    RAKSA_SUPABASE?: {
      url?: string;
      anonKey?: string;
    };
  }
}

const FALLBACK_URL = "https://yzivkrotylwyglavtnho.supabase.co";
const FALLBACK_KEY = "sb_publishable_99D42sJ3fT78ll6EzmIDqg_RWXrgtNn";

export function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || window.RAKSA_SUPABASE?.url || FALLBACK_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || window.RAKSA_SUPABASE?.anonKey || FALLBACK_KEY,
  };
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const config = getSupabaseConfig();
  client = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}
