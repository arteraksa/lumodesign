"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { publicLoginError } from "@/lib/auth/public-errors";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      if (signInError) throw signInError;
      const { data: allowed, error: permissionError } = await supabase.rpc("can_manage_portfolio");
      if (permissionError || !allowed) {
        await supabase.auth.signOut();
        throw new Error("Esta conta não possui acesso ao CMS.");
      }
      router.replace("/admin/cases");
      router.refresh();
    } catch (cause) {
      setError(publicLoginError(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login" data-testid="admin-login-form" onSubmit={submit}>
      <div><p className="section-label">CMS</p><h1>Entrar no portfólio</h1><p>Use sua conta administrativa do Supabase.</p></div>
      <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
      <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
      {error ? <p className="admin-error" role="alert" data-testid="admin-login-error">{error}</p> : null}
      <button className="button button--primary" data-testid="admin-login-submit" type="submit" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
      <Link href="/">Voltar ao site</Link>
    </form>
  );
}
