import { ADMIN_SECTIONS, PAGE_BASE, logo } from "./constants.js?v=5";
import { escapeHtml } from "./utils.js?v=3";

export function createShellModule({ app, state, getSupabase }) {
  function renderLogin(error = "") {
    const supabase = getSupabase();
    app.innerHTML = `
      <section class="login-screen">
        <form class="login-card ${state.authLoading ? "is-loading" : ""}" data-login-form aria-busy="${state.authLoading ? "true" : "false"}">
          ${logo}
          <div class="login-copy">
            <span class="eyebrow">Admin</span>
            <h1>Entrar na plataforma</h1>
            <p>Acesse com e-mail e senha para gerenciar os cases da RAKSA.</p>
          </div>
          <div class="form-stack">
            <label class="field">
              <span>E-mail</span>
              <input class="input" name="email" type="email" inputmode="email" autocomplete="email" ${state.authLoading ? "disabled" : ""} required>
            </label>
            <label class="field">
              <span>Senha</span>
              <input class="input" name="password" type="password" autocomplete="current-password" ${state.authLoading ? "disabled" : ""} required>
            </label>
            <div class="notice notice-error ${error || !supabase ? "is-visible" : ""}">
              ${escapeHtml(error || (!supabase ? "Configure a anon key do Supabase em /admin/supabase-config.js." : ""))}
            </div>
            <button class="button button-primary ${state.authLoading ? "is-loading" : ""}" type="submit" ${supabase && !state.authLoading ? "" : "disabled"}>
              ${state.authLoading ? `<span class="spinner" aria-hidden="true"></span><span>Entrando...</span>` : "Entrar"}
            </button>
          </div>
        </form>
      </section>`;
  }

  function currentSection() {
    return window.location.hash.replace(/^#\/?/, "").split("/")[0] || "home";
  }

  function renderAdminNav() {
    const active = currentSection();
    return `
      <nav class="admin-nav" aria-label="Areas do admin">
        ${ADMIN_SECTIONS.map(([id, label]) => `
          <a class="nav-link ${active === id ? "is-active" : ""}" href="#/${id}">
            ${escapeHtml(label)}
          </a>
        `).join("")}
      </nav>`;
  }

  function renderShell(content) {
    app.innerHTML = `
      <section class="admin-shell">
        <header class="topbar">
          <a href="${PAGE_BASE}/" aria-label="Abrir home da RAKSA">${logo}</a>
          ${renderAdminNav()}
          <div class="topbar-actions">
            <a class="button button-secondary" href="${PAGE_BASE}/" target="_blank" rel="noopener">Ver site</a>
            <button class="button button-ghost" type="button" data-logout>Sair</button>
          </div>
        </header>
        ${content}
        ${state.modal || ""}
      </section>`;
  }

  function renderComingSoon(section) {
    const labels = Object.fromEntries(ADMIN_SECTIONS);
    renderShell(`
      <main class="page">
        <section class="page-header">
          <div class="page-title">
            <span class="eyebrow">${escapeHtml(labels[section] || "Admin")}</span>
            <h1>Módulo em preparação</h1>
            <p class="section-subtitle">A navegação e o banco já estão reservados para esta área.</p>
          </div>
        </section>
        <section class="panel roadmap-panel">
          <h2>Proximo passo</h2>
          <p class="section-subtitle">Aqui entram tabelas, formulários, permissões e relatórios do CRM sem misturar com o CMS de cases.</p>
        </section>
      </main>`);
  }

  return { currentSection, renderAdminNav, renderComingSoon, renderLogin, renderShell };
}
