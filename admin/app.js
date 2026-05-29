import { createCrmModule } from "./modules/crm.js?v=2";
import { createMetricsModule } from "./modules/metrics.js?v=2";
import { createApiModule } from "./modules/api.js?v=2";
import { createShellModule } from "./modules/shell.js?v=2";
import { createCasesModule } from "./modules/cases.js?v=3";

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
  authLoading: false,
  creatingCase: false,
  crmSubmitting: null,
  draggingImageIndex: null,
  dragOverImageIndex: null,
  draggingHomeSlug: null,
  crmLoaded: false,
  crmLoading: false,
  crmEdit: null,
  clients: [],
  projects: [],
  budgets: [],
  serviceOrders: [],
  timeEntries: [],
  metricsEvents: [],
};

function isLoggedIn() {
  return Boolean(state.session);
}

let noticeTimer = null;
let noticeSequence = 0;

function currentRouteSection() {
  return window.location.hash.replace(/^#\/?/, "").split("/")[0] || "home";
}

function clearNoticeTimer() {
  if (!noticeTimer) return;
  window.clearTimeout(noticeTimer);
  noticeTimer = null;
}

function setNotice(type, text, { route = currentRouteSection(), timeout } = {}) {
  clearNoticeTimer();
  const id = ++noticeSequence;
  state.notice = { id, route, type, text };

  const dismissAfter = timeout ?? (type === "error" ? 7000 : 4200);
  if (dismissAfter > 0) {
    noticeTimer = window.setTimeout(() => {
      if (state.notice?.id !== id) return;
      clearNotice();
      render();
    }, dismissAfter);
  }
}

function clearNotice() {
  clearNoticeTimer();
  state.notice = null;
}

function clearStaleNotice() {
  if (state.notice && state.notice.route !== currentRouteSection()) clearNotice();
}

const {
  deleteRemoteCase,
  deleteUploadedFileIfUnused,
  fileExtension,
  isAdminUser,
  isManagedUpload,
  loadAdminData,
  loadCases,
  loadSession,
  persistCase,
  persistCases,
  seedCasesIfEmpty,
} = createApiModule({
  state,
  supabaseConfig,
  getSupabase: () => supabase,
  isLoggedIn,
});

const { renderComingSoon, renderLogin, renderShell } = createShellModule({
  app,
  state,
  getSupabase: () => supabase,
});

function render() {
  if (!isLoggedIn()) {
    renderLogin();
    return;
  }

  const hash = window.location.hash.replace(/^#\/?/, "");
  const [section, slug] = hash.split("/");
  if (!section) {
    window.location.replace("#/home");
    return;
  }

  clearStaleNotice();

  if (section === "cases" && slug) renderEditor(decodeURIComponent(slug).normalize("NFC"));
  else if (section === "home") renderHomeSettings();
  else if (section === "clients") renderClients();
  else if (section === "projects") renderProjects();
  else if (section === "budgets") renderBudgets();
  else if (section === "orders") renderServiceOrders();
  else if (section === "time") renderTimeEntries();
  else if (section === "metrics") renderMetricsPage();
  else renderDashboard();
}

const {
  createCase,
  deleteCase,
  moveHomeCase,
  openDeleteModal,
  removeCover,
  removeImage,
  renderDashboard,
  renderEditor,
  renderHomeSettings,
  reorderByDrag,
  reorderHomeByDrag,
  replaceCover,
  resetHomeSettingsDraft,
  saveCurrentCase,
  saveHomeSettings,
  toggleHomeCase,
  updateCmsCaseField,
  updateCmsCaseTag,
  updateDashboardFilter,
  updateDashboardSearch,
  updateHomeSearch,
  uploadCaseImages,
} = createCasesModule({
  state,
  supabase,
  render,
  renderShell,
  setNotice,
  isLoggedIn,
  persistCase,
  persistCases,
  deleteRemoteCase,
  deleteUploadedFileIfUnused,
  fileExtension,
  isManagedUpload,
});

const {
  cancelCrmEdit,
  createBudget,
  createClient,
  createProject,
  createServiceOrder,
  createTimeEntry,
  deleteCrmRecord,
  openCrmEdit,
  renderBudgets,
  renderClients,
  renderCrmNotice,
  renderProjects,
  renderServiceOrders,
  renderTimeEntries,
} = createCrmModule({
  state,
  getSupabase: () => supabase,
  isLoggedIn,
  setNotice,
  clearNotice,
  render,
  renderShell,
  loadAdminData,
});

const { renderMetricsPage } = createMetricsModule({ state, renderShell, renderCrmNotice });


document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-login-form]");
  const clientForm = event.target.closest("[data-client-form]");
  const projectForm = event.target.closest("[data-project-form]");
  const budgetForm = event.target.closest("[data-budget-form]");
  const orderForm = event.target.closest("[data-order-form]");
  const timeForm = event.target.closest("[data-time-form]");
  if (!form && !clientForm && !projectForm && !budgetForm && !orderForm && !timeForm) return;
  event.preventDefault();

  if (clientForm) return createClient(clientForm);
  if (projectForm) return createProject(projectForm);
  if (budgetForm) return createBudget(budgetForm);
  if (orderForm) return createServiceOrder(orderForm);
  if (timeForm) return createTimeEntry(timeForm);

  if (state.authLoading) return;
  if (!supabase) {
    renderLogin("Configure o Supabase antes de entrar.");
    return;
  }

  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "").trim();
  if (!email || !password) {
    renderLogin("Preencha e-mail e senha.");
    return;
  }

  state.authLoading = true;
  renderLogin();
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      state.authLoading = false;
      renderLogin(error.message);
      return;
    }

    state.session = authData.session;
    if (!(await isAdminUser())) {
      await supabase.auth.signOut();
      state.session = null;
      state.authLoading = false;
      renderLogin("Usuario autenticado, mas sem permissao de admin.");
      return;
    }

    await seedCasesIfEmpty();
    await loadAdminData({ force: true });
  } catch (error) {
    state.authLoading = false;
    renderLogin(error.message || "Nao foi possivel entrar agora.");
    return;
  }

  state.authLoading = false;
  if (window.location.hash !== "#/home") window.location.hash = "#/home";
  else renderHomeSettings();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-search]")) {
    updateDashboardSearch(event.target.value);
  }

  if (event.target.matches("[data-home-search]")) {
    updateHomeSearch(event.target.value);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches("[data-cms-field]")) {
    event.preventDefault();
    event.target.blur();
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
    updateDashboardFilter(target.dataset.filter);
  }

  if (target.matches("[data-save-case]")) await saveCurrentCase(target.dataset.saveCase);
  if (target.matches("[data-save-home-settings]")) await saveHomeSettings();
  if (target.matches("[data-reset-home-settings]")) resetHomeSettingsDraft();
  if (target.matches("[data-home-toggle]")) toggleHomeCase(target.dataset.homeToggle, target.dataset.homeFeatured === "true");
  if (target.matches("[data-home-move]")) moveHomeCase(target.dataset.homeMove, target.dataset.homeDirection);
  if (target.matches("[data-remove-cover]")) await removeCover(target.dataset.removeCover);

  if (target.matches("[data-remove-image]")) {
    const slug = document.querySelector("[data-image-list]")?.dataset.imageList;
    await removeImage(slug, Number(target.dataset.removeImage));
  }

  if (target.matches("[data-delete-case]")) openDeleteModal(target.dataset.deleteCase);
  if (target.matches("[data-edit-crm]")) {
    const [table, id] = target.dataset.editCrm.split(":");
    openCrmEdit(table, id);
  }
  if (target.matches("[data-cancel-crm-edit]")) {
    cancelCrmEdit();
  }
  if (target.matches("[data-delete-crm]")) {
    const [table, id] = target.dataset.deleteCrm.split(":");
    await deleteCrmRecord(table, id);
  }
  if (target.matches("[data-close-modal]")) {
    state.modal = null;
    renderDashboard();
  }
  if (target.matches("[data-confirm-delete]")) await deleteCase(target.dataset.confirmDelete);
});

document.addEventListener("change", async (event) => {
  const cmsField = event.target.closest("[data-cms-field]");
  if (cmsField) {
    await updateCmsCaseField(cmsField.dataset.cmsSlug, cmsField.dataset.cmsField, cmsField.value);
    return;
  }

  const cmsTag = event.target.closest("[data-cms-tag]");
  if (cmsTag) {
    await updateCmsCaseTag(cmsTag.dataset.cmsSlug, cmsTag.dataset.cmsTag, cmsTag.checked);
    return;
  }

  const coverInput = event.target.closest("[data-cover-file]");
  if (coverInput) {
    await replaceCover(coverInput.dataset.coverFile, coverInput.files?.[0]);
    coverInput.value = "";
    return;
  }

  const imagesInput = event.target.closest("[data-case-images-file]");
  if (imagesInput) {
    await uploadCaseImages(imagesInput.dataset.caseImagesFile, [...(imagesInput.files || [])]);
    imagesInput.value = "";
  }
});

document.addEventListener("dragstart", (event) => {
  const homeCard = event.target.closest("[data-home-selected-card]");
  if (homeCard) {
    state.draggingHomeSlug = homeCard.dataset.homeSelectedCard;
    homeCard.classList.add("is-dragging");
    return;
  }

  const row = event.target.closest("[data-image-index]");
  if (!row) return;
  state.draggingImageIndex = Number(row.dataset.imageIndex);
  row.classList.add("is-dragging");
});

document.addEventListener("dragover", (event) => {
  const uploadZone = event.target.closest("[data-upload-zone]");
  if (uploadZone && [...(event.dataTransfer?.types || [])].includes("Files")) {
    event.preventDefault();
    uploadZone.classList.add("is-drop-target");
    return;
  }

  const homeCard = event.target.closest("[data-home-selected-card]");
  if (homeCard && state.draggingHomeSlug) {
    event.preventDefault();
    document.querySelectorAll(".home-selected-card.is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
    homeCard.classList.add("is-drop-target");
    return;
  }

  const row = event.target.closest("[data-image-index]");
  if (!row) return;
  event.preventDefault();
  state.dragOverImageIndex = Number(row.dataset.imageIndex);
  document.querySelectorAll(".image-row.is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
  row.classList.add("is-drop-target");
});

document.addEventListener("drop", (event) => {
  const uploadZone = event.target.closest("[data-upload-zone]");
  if (uploadZone && event.dataTransfer?.files?.length) {
    event.preventDefault();
    uploadZone.classList.remove("is-drop-target");
    uploadCaseImages(uploadZone.dataset.uploadZone, [...event.dataTransfer.files]);
    return;
  }

  const homeCard = event.target.closest("[data-home-selected-card]");
  if (homeCard && state.draggingHomeSlug) {
    event.preventDefault();
    reorderHomeByDrag(state.draggingHomeSlug, homeCard.dataset.homeSelectedCard);
    state.draggingHomeSlug = null;
    return;
  }

  const row = event.target.closest("[data-image-index]");
  if (!row) return;
  event.preventDefault();
  reorderByDrag(row.dataset.imageSlug, state.draggingImageIndex, Number(row.dataset.imageIndex));
  state.draggingImageIndex = null;
  state.dragOverImageIndex = null;
});

document.addEventListener("dragend", () => {
  state.draggingImageIndex = null;
  state.dragOverImageIndex = null;
  state.draggingHomeSlug = null;
  document.querySelectorAll(".is-dragging, .is-drop-target").forEach((node) => node.classList.remove("is-dragging", "is-drop-target"));
});

document.addEventListener("dragleave", (event) => {
  const uploadZone = event.target.closest("[data-upload-zone]");
  if (uploadZone && !uploadZone.contains(event.relatedTarget)) uploadZone.classList.remove("is-drop-target");
});

window.addEventListener("hashchange", () => {
  clearNotice();
  render();
});

await loadCases();
await loadSession();
await loadAdminData();
render();
