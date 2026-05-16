const CASES_URL = "./data/cases.json";
const STORAGE_KEY = "raksa-admin-cases-v1";
const ADMINS_TABLE = "admin_users";
const CASES_TABLE = "cases";
const TAGS = ["UI/UX Design", "Desenvolvimento", "Branding", "Editorial"];

const app = document.querySelector("#app");
const supabaseConfig = window.RAKSA_SUPABASE || {};
let supabase = null;
if (supabaseConfig.url && supabaseConfig.anonKey) {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
}
const state = {
  cases: [],
  initialCases: [],
  session: null,
  search: "",
  tag: "Todos",
  notice: null,
  modal: null,
  draggingImageIndex: null,
};

const logo = `
  <span class="logo" aria-label="RAKSA">
    <svg viewBox="0 0 132 64" fill="none" role="img">
      <path d="M16.0849 63.2085C15.6854 61.6031 15.413 60.6179 15.413 55.5456V45.7297C15.413 39.9276 13.9419 37.7928 10.5822 37.7928H8.03965V63.2085H0.648193V0.791242H11.7808C19.4265 0.791242 22.7136 5.5168 22.7136 15.1503V20.0583C22.7136 26.4806 21.17 30.6772 17.8828 32.7205C21.5695 34.7641 22.7863 39.4897 22.7863 46.0033V55.6368C22.7863 58.6656 22.8589 60.8916 23.5854 63.2085H16.0668H16.0849ZM8.02149 9.71322V28.8891H10.9091C13.6695 28.8891 15.3403 27.2836 15.3403 22.2843V16.1356C15.3403 11.6837 14.1962 9.71322 11.581 9.71322H8.02149Z" fill="currentColor"/>
      <path d="M44.0525 63.2085L42.7811 51.8783H33.7189L32.4477 63.2085H25.6738L33.1922 0.791242H43.998L51.5165 63.2085H44.0525ZM34.6634 43.4124H41.7824L38.2229 11.8479L34.6634 43.4124Z" fill="currentColor"/>
      <path d="M64.5927 38.3402L62.3046 44.051V63.2268H54.9312V0.791242H62.3046V27.9951L71.9661 0.791242H79.3393L69.0785 28.6154L79.3393 63.2086H71.7482L64.5745 38.3219L64.5927 38.3402Z" fill="#7E43FF"/>
      <path d="M92.288 0.0797046C99.4617 0.0797046 103.148 5.79049 103.148 15.7707V17.7412H96.1746V15.1504C96.1746 10.6985 94.8306 9.00169 92.4878 9.00169C90.1452 9.00169 88.8012 10.6985 88.8012 15.1504C88.8012 27.9951 103.221 30.4035 103.221 48.2293C103.221 66.0551 99.4617 63.9203 92.2154 63.9203C84.9693 63.9203 81.2101 58.2095 81.2101 48.2293V44.3976H88.1838V48.8496C88.1838 53.3014 89.6549 54.9071 92.0157 54.9071C94.3766 54.9071 95.8478 53.3014 95.8478 48.8496C95.8478 36.0049 81.428 33.5965 81.428 15.7707C81.428 -2.05501 85.1146 0.0797046 92.288 0.0797046Z" fill="currentColor"/>
      <path d="M123.888 63.2085L122.616 51.8783H113.554L112.283 63.2085H105.509L113.028 0.791242H123.833L131.352 63.2085H123.888ZM114.499 43.4124H121.618L118.058 11.8479L114.499 43.4124Z" fill="currentColor"/>
    </svg>
  </span>`;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStoredCases() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveCases() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cases));
}

function isLoggedIn() {
  return Boolean(state.session);
}

function setNotice(type, text) {
  state.notice = { type, text };
}

function clearNotice() {
  state.notice = null;
}

async function loadCases() {
  const response = await fetch(CASES_URL);
  const initialCases = await response.json();
  state.initialCases = initialCases;

  if (!supabase) {
    state.cases = getStoredCases() || initialCases;
    return;
  }

  const { data, error } = await supabase
    .from(CASES_TABLE)
    .select("id, slug, title, tags, description, cover, images, updated_at")
    .order("title", { ascending: true });

  if (error) {
    state.cases = getStoredCases() || initialCases;
    setNotice("error", `Supabase indisponível: ${error.message}`);
    return;
  }

  state.cases = data.length ? data.map(fromSupabaseCase) : initialCases;
}

async function loadSession() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  if (state.session && !(await isAdminUser())) {
    await supabase.auth.signOut();
    state.session = null;
  }
}

async function isAdminUser() {
  if (!supabase || !state.session?.user?.id) return false;

  const { data, error } = await supabase
    .from(ADMINS_TABLE)
    .select("user_id")
    .eq("user_id", state.session.user.id)
    .limit(1);

  return !error && data.length === 1;
}

function fromSupabaseCase(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tags: row.tags || [],
    description: row.description || "",
    cover: row.cover || "",
    images: row.images || [],
    updatedAt: row.updated_at,
  };
}

function toSupabaseCase(item) {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    tags: item.tags,
    description: item.description,
    cover: item.cover,
    images: item.images,
    updated_at: item.updatedAt || new Date().toISOString(),
  };
}

async function persistCase(item) {
  if (!supabase || !isLoggedIn()) {
    saveCases();
    return { error: null };
  }

  return supabase
    .from(CASES_TABLE)
    .upsert(toSupabaseCase(item), { onConflict: "id" });
}

async function deleteRemoteCase(slug) {
  if (!supabase || !isLoggedIn()) {
    saveCases();
    return { error: null };
  }

  return supabase.from(CASES_TABLE).delete().eq("slug", slug);
}

async function seedCasesIfEmpty() {
  if (!supabase || !isLoggedIn() || state.cases.length !== state.initialCases.length) return;

  const { count, error } = await supabase
    .from(CASES_TABLE)
    .select("id", { count: "exact", head: true });

  if (error || count) return;

  const { error: upsertError } = await supabase
    .from(CASES_TABLE)
    .upsert(state.initialCases.map(toSupabaseCase), { onConflict: "id" });

  if (!upsertError) {
    await loadCases();
    setNotice("success", "Cases iniciais sincronizados com Supabase.");
  }
}

function render() {
  if (!isLoggedIn()) {
    renderLogin();
    return;
  }

  const hash = window.location.hash.replace(/^#\/?/, "");
  const [section, slug] = hash.split("/");

  if (section === "cases" && slug) renderEditor(decodeURIComponent(slug));
  else renderDashboard();
}

function renderLogin(error = "") {
  app.innerHTML = `
    <section class="login-screen">
      <form class="login-card" data-login-form>
        ${logo}
        <div class="login-copy">
          <span class="eyebrow">Admin</span>
          <h1>Entrar na plataforma</h1>
          <p>Acesse com e-mail e senha para gerenciar os cases da RAKSA.</p>
        </div>
        <div class="form-stack">
          <label class="field">
            <span>E-mail</span>
            <input class="input" name="email" type="text" inputmode="email" autocomplete="email" required>
          </label>
          <label class="field">
            <span>Senha</span>
            <input class="input" name="password" type="password" autocomplete="current-password" required>
          </label>
          <div class="notice notice-error ${error || !supabase ? "is-visible" : ""}">
            ${escapeHtml(error || (!supabase ? "Configure a anon key do Supabase em /admin/supabase-config.js." : ""))}
          </div>
          <button class="button button-primary" type="submit" ${supabase ? "" : "disabled"}>Entrar</button>
        </div>
      </form>
    </section>`;
}

function renderShell(content) {
  app.innerHTML = `
    <section class="admin-shell">
      <header class="topbar">
        <a href="#/" aria-label="RAKSA Admin">${logo}</a>
        <div class="topbar-actions">
          <a class="button button-secondary" href="/raksadesign/" target="_blank" rel="noopener">Ver site</a>
          <button class="button button-ghost" type="button" data-logout>Sair</button>
        </div>
      </header>
      ${content}
      ${state.modal || ""}
    </section>`;
}

function filteredCases() {
  const query = state.search.trim().toLowerCase();
  return state.cases.filter((item) => {
    const matchesQuery = !query || item.title.toLowerCase().includes(query) || item.slug.toLowerCase().includes(query);
    const matchesTag = state.tag === "Todos" || item.tags.includes(state.tag);
    return matchesQuery && matchesTag;
  });
}

function renderDashboard() {
  const items = filteredCases();
  const tagCount = TAGS.map((tag) => state.cases.filter((item) => item.tags.includes(tag)).length);
  renderShell(`
    <main class="page">
      <section class="page-header">
        <div class="page-title">
          <span class="eyebrow">Cases</span>
          <h1>Gerenciamento de portfólio</h1>
          <p class="section-subtitle">${state.cases.length} cases cadastrados</p>
        </div>
        <button class="button button-primary" type="button" data-create-case>Criar post</button>
      </section>

      <div class="notice ${state.notice?.type === "error" ? "notice-error" : "notice-success"} ${state.notice ? "is-visible" : ""}">
        ${escapeHtml(state.notice?.text || "")}
      </div>

      <section class="metrics" aria-label="Resumo por tag">
        ${TAGS.map((tag, index) => `
          <div class="metric">
            <strong>${tagCount[index]}</strong>
            <span>${escapeHtml(tag)}</span>
          </div>
        `).join("")}
      </section>

      <section class="toolbar">
        <input class="input" type="search" placeholder="Buscar case" value="${escapeHtml(state.search)}" data-search>
        <div class="tag-filter" aria-label="Filtros">
          ${["Todos", ...TAGS].map((tag) => `
            <button class="tag-pill ${state.tag === tag ? "is-active" : ""}" type="button" data-filter="${escapeHtml(tag)}">${escapeHtml(tag)}</button>
          `).join("")}
        </div>
      </section>

      <section class="case-grid">
        ${items.length ? items.map(renderCaseCard).join("") : `<div class="empty-state">Nenhum case encontrado.</div>`}
      </section>
    </main>`);
}

function renderCaseCard(item) {
  return `
    <article class="case-card">
      ${item.cover ? `<img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)}">` : `<div class="case-placeholder">${escapeHtml(item.title)}</div>`}
      <div class="case-overlay">
        <div>
          <div class="case-card-title">${escapeHtml(item.title)}</div>
          <div class="meta">${item.tags.map(escapeHtml).join(" · ")}</div>
        </div>
        <div class="case-card-actions">
          <a class="button button-primary" href="#/cases/${encodeURIComponent(item.slug)}">Alterar case</a>
          <button class="button button-danger" type="button" data-delete-case="${escapeHtml(item.slug)}">Excluir case</button>
        </div>
      </div>
    </article>`;
}

function renderEditor(slug) {
  const item = state.cases.find((entry) => entry.slug === slug);
  if (!item) {
    window.location.hash = "#/";
    return;
  }

  renderShell(`
    <main class="page">
      <section class="page-header">
        <div class="page-title">
          <span class="eyebrow">Editar case</span>
          <h1>${escapeHtml(item.title || "Novo case")}</h1>
          <p class="section-subtitle">/${escapeHtml(item.slug)}</p>
        </div>
        <div class="editor-actions">
          <a class="button button-secondary" href="#/">Voltar</a>
          <a class="button button-secondary" href="/cases/${encodeURIComponent(item.slug)}" target="_blank" rel="noopener">Ver case</a>
          <button class="button button-primary" type="button" data-save-case="${escapeHtml(item.slug)}">Salvar alterações</button>
        </div>
      </section>

      <div class="notice ${state.notice?.type === "error" ? "notice-error" : "notice-success"} ${state.notice ? "is-visible" : ""}">
        ${escapeHtml(state.notice?.text || "")}
      </div>

      <section class="editor-layout">
        <form class="panel form-stack" data-editor-form>
          <label class="field">
            <span>Nome</span>
            <input class="input" name="title" value="${escapeHtml(item.title)}" required>
          </label>
          <label class="field">
            <span>Slug</span>
            <input class="input" name="slug" value="${escapeHtml(item.slug)}" required>
          </label>
          <div class="field">
            <span class="field-label">Tags</span>
            <div class="tag-filter">
              ${TAGS.map((tag) => `
                <label class="tag-check">
                  <input type="checkbox" name="tags" value="${escapeHtml(tag)}" ${item.tags.includes(tag) ? "checked" : ""}>
                  ${escapeHtml(tag)}
                </label>
              `).join("")}
            </div>
          </div>
          <label class="field">
            <span>Descritivo</span>
            <textarea class="textarea" name="description">${escapeHtml(item.description)}</textarea>
          </label>
          <label class="field">
            <span>Capa</span>
            <input class="input" name="cover" value="${escapeHtml(item.cover)}">
          </label>
          <div class="cover-preview">
            ${item.cover ? `<img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)}">` : `<div class="case-placeholder">Sem capa</div>`}
          </div>
        </form>

        <section class="panel">
          <div class="page-title">
            <h2>Imagens do case</h2>
            <p class="section-subtitle">${item.images.length} imagens</p>
          </div>
          <div class="image-list" data-image-list="${escapeHtml(item.slug)}">
            ${item.images.map((url, index) => renderImageRow(item, url, index)).join("")}
          </div>
          <div class="add-image">
            <label class="field">
              <span>Adicionar imagem</span>
              <input class="input" data-new-image-input placeholder="Cole a URL da imagem">
            </label>
            <button class="button button-secondary" type="button" data-add-image="${escapeHtml(item.slug)}">Adicionar</button>
          </div>
        </section>
      </section>
    </main>`);
}

function renderImageRow(item, url, index) {
  return `
    <div class="image-row" draggable="true" data-image-index="${index}" data-image-slug="${escapeHtml(item.slug)}">
      <div class="image-thumb">${url ? `<img src="${escapeHtml(url)}" alt="">` : ""}</div>
      <div class="image-url">${escapeHtml(url)}</div>
      <div class="image-actions">
        <button class="icon-button" type="button" data-move-image="${index}" data-direction="-1" aria-label="Mover para cima">Acima</button>
        <button class="icon-button" type="button" data-move-image="${index}" data-direction="1" aria-label="Mover para baixo">Abaixo</button>
        <button class="icon-button" type="button" data-remove-image="${index}" aria-label="Remover imagem">Remover</button>
      </div>
    </div>`;
}

function getCase(slug) {
  return state.cases.find((item) => item.slug === slug);
}

async function createCase() {
  const title = "Novo case";
  const slug = `novo-case-${Date.now()}`;
  const item = {
    id: slug,
    slug,
    title,
    tags: [],
    description: "",
    cover: "",
    images: [],
    updatedAt: new Date().toISOString(),
  };
  const { error } = await persistCase(item);
  if (error) {
    setNotice("error", error.message);
    renderDashboard();
    return;
  }
  state.cases.unshift(item);
  window.location.hash = `#/cases/${encodeURIComponent(slug)}`;
}

async function saveCurrentCase(slug) {
  const item = getCase(slug);
  const form = document.querySelector("[data-editor-form]");
  if (!item || !form) return;

  const data = new FormData(form);
  const newTitle = String(data.get("title") || "").trim();
  const newSlug = slugify(String(data.get("slug") || newTitle));
  if (!newTitle || !newSlug) {
    setNotice("error", "Preencha nome e slug.");
    renderEditor(slug);
    return;
  }

  const duplicate = state.cases.find((entry) => entry.slug === newSlug && entry.slug !== slug);
  if (duplicate) {
    setNotice("error", "Já existe um case com esse slug.");
    renderEditor(slug);
    return;
  }

  const previousSlug = item.slug;
  item.title = newTitle;
  item.slug = newSlug;
  item.id = newSlug;
  item.tags = data.getAll("tags").map(String);
  item.description = String(data.get("description") || "").trim();
  item.cover = String(data.get("cover") || "").trim();
  item.updatedAt = new Date().toISOString();
  const { error } = await persistCase(item);
  if (error) {
    setNotice("error", error.message);
    renderEditor(slug);
    return;
  }
  if (previousSlug !== newSlug) await deleteRemoteCase(previousSlug);
  setNotice("success", "Case salvo.");
  window.location.hash = `#/cases/${encodeURIComponent(newSlug)}`;
  renderEditor(newSlug);
}

async function moveImage(slug, index, direction) {
  const item = getCase(slug);
  if (!item) return;
  const target = index + direction;
  if (target < 0 || target >= item.images.length) return;
  const [image] = item.images.splice(index, 1);
  item.images.splice(target, 0, image);
  item.updatedAt = new Date().toISOString();
  await persistCase(item);
  renderEditor(slug);
}

async function removeImage(slug, index) {
  const item = getCase(slug);
  if (!item) return;
  item.images.splice(index, 1);
  if (item.cover && !item.images.includes(item.cover)) item.cover = item.images[0] || "";
  item.updatedAt = new Date().toISOString();
  await persistCase(item);
  renderEditor(slug);
}

async function addImage(slug) {
  const item = getCase(slug);
  const input = document.querySelector("[data-new-image-input]");
  if (!item || !input) return;
  const value = input.value.trim();
  if (!value) return;
  item.images.push(value);
  if (!item.cover) item.cover = value;
  item.updatedAt = new Date().toISOString();
  await persistCase(item);
  renderEditor(slug);
}

async function reorderByDrag(slug, from, to) {
  const item = getCase(slug);
  if (!item || from === to || from < 0 || to < 0) return;
  const [image] = item.images.splice(from, 1);
  item.images.splice(to, 0, image);
  item.updatedAt = new Date().toISOString();
  await persistCase(item);
  renderEditor(slug);
}

function openDeleteModal(slug) {
  const item = getCase(slug);
  if (!item) return;
  state.modal = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal">
        <div class="page-title">
          <h2>Excluir case</h2>
          <p class="section-subtitle">${escapeHtml(item.title)}</p>
        </div>
        <div class="modal-actions">
          <button class="button button-secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button-danger" type="button" data-confirm-delete="${escapeHtml(slug)}">Excluir</button>
        </div>
      </div>
    </div>`;
  renderDashboard();
}

async function deleteCase(slug) {
  const { error } = await deleteRemoteCase(slug);
  if (error) {
    state.modal = null;
    setNotice("error", error.message);
    renderDashboard();
    return;
  }
  state.cases = state.cases.filter((item) => item.slug !== slug);
  state.modal = null;
  renderDashboard();
}

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-login-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "").trim();
  if (!email || !password) {
    renderLogin("Preencha e-mail e senha.");
    return;
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    renderLogin(error.message);
    return;
  }

  state.session = authData.session;
  if (!(await isAdminUser())) {
    await supabase.auth.signOut();
    state.session = null;
    renderLogin("Usuário autenticado, mas sem permissão de admin.");
    return;
  }

  await seedCasesIfEmpty();
  renderDashboard();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-search]")) {
    state.search = event.target.value;
    renderDashboard();
  }
});

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.matches("[data-logout]")) {
    if (supabase) await supabase.auth.signOut();
    state.session = null;
    window.location.hash = "#/";
    render();
  }

  if (target.matches("[data-create-case]")) await createCase();

  if (target.matches("[data-filter]")) {
    state.tag = target.dataset.filter;
    renderDashboard();
  }

  if (target.matches("[data-save-case]")) await saveCurrentCase(target.dataset.saveCase);
  if (target.matches("[data-add-image]")) await addImage(target.dataset.addImage);

  if (target.matches("[data-move-image]")) {
    const slug = document.querySelector("[data-image-list]")?.dataset.imageList;
    await moveImage(slug, Number(target.dataset.moveImage), Number(target.dataset.direction));
  }

  if (target.matches("[data-remove-image]")) {
    const slug = document.querySelector("[data-image-list]")?.dataset.imageList;
    await removeImage(slug, Number(target.dataset.removeImage));
  }

  if (target.matches("[data-delete-case]")) openDeleteModal(target.dataset.deleteCase);
  if (target.matches("[data-close-modal]")) {
    state.modal = null;
    renderDashboard();
  }
  if (target.matches("[data-confirm-delete]")) await deleteCase(target.dataset.confirmDelete);
});

document.addEventListener("dragstart", (event) => {
  const row = event.target.closest("[data-image-index]");
  if (!row) return;
  state.draggingImageIndex = Number(row.dataset.imageIndex);
  row.classList.add("is-dragging");
});

document.addEventListener("dragover", (event) => {
  if (event.target.closest("[data-image-index]")) event.preventDefault();
});

document.addEventListener("drop", (event) => {
  const row = event.target.closest("[data-image-index]");
  if (!row) return;
  event.preventDefault();
  reorderByDrag(row.dataset.imageSlug, state.draggingImageIndex, Number(row.dataset.imageIndex));
  state.draggingImageIndex = null;
});

document.addEventListener("dragend", () => {
  state.draggingImageIndex = null;
  document.querySelectorAll(".is-dragging").forEach((node) => node.classList.remove("is-dragging"));
});

window.addEventListener("hashchange", render);

await loadCases();
await loadSession();
render();
