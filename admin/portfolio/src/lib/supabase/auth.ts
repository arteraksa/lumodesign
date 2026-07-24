import type { SupabaseClient, Session } from "@supabase/supabase-js";

export type AuthState =
  | { status: "loading" }
  | { status: "anonymous"; reason?: "session-expired" }
  | { status: "forbidden"; session: Session }
  | { status: "authorized"; session: Session };

export async function resolveAuthState(client: SupabaseClient, reason?: "session-expired"): Promise<AuthState> {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) return { status: "anonymous", reason };

  const result = await client.rpc("can_manage_portfolio");
  if (result.error || result.data !== true) {
    return { status: "forbidden", session: data.session };
  }

  return { status: "authorized", session: data.session };
}
