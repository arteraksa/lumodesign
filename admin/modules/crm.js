import {
  BUDGET_STATUSES,
  CLIENT_STATUSES,
  CLIENT_TYPES,
  CRM_STATE_KEYS,
  ORDER_STATUSES,
  PROJECT_STATUSES,
} from "./constants.js?v=2";
import {
  dateInputValue,
  entityName,
  escapeHtml,
  formatCurrency,
  formatDate,
  formatHours,
  labelFromOptions,
  nonNegativeNumberFromForm,
  optionalDateFromForm,
  optionalEmailFromForm,
  optionalFormValue,
  optionalUrlFromForm,
  positiveIntegerFromForm,
  requiredDateFromForm,
  requiredTextFromForm,
  scopeText,
  selectOptions,
  validateDateOrder,
  valueAttr,
} from "./utils.js?v=2";

export function createCrmModule({ state, getSupabase, isLoggedIn, setNotice, clearNotice, render, renderShell, loadAdminData }) {
  function supabase() {
    return getSupabase();
  }

  function crmItems(table) {
    return state[CRM_STATE_KEYS[table]] || [];
  }

  function crmEditRecord(table) {
    if (state.crmEdit?.table !== table) return null;
    return crmItems(table).find((item) => item.id === state.crmEdit.id) || null;
  }

  function isSubmitting(table) {
    return state.crmSubmitting === table;
  }

  function crmFormAttrs(table) {
    return `aria-busy="${isSubmitting(table) ? "true" : "false"}"`;
  }

  function renderCrmFormActions(table, record, createLabel, updateLabel) {
    const submitting = isSubmitting(table);
    const label = record ? updateLabel : createLabel;
    return `
      <div class="form-actions">
        <button class="button button-primary ${submitting ? "is-loading" : ""}" type="submit" ${submitting ? "disabled" : ""}>
          ${submitting ? `<span class="spinner" aria-hidden="true"></span><span>Salvando...</span>` : escapeHtml(label)}
        </button>
        ${record ? `<button class="button button-secondary" type="button" data-cancel-crm-edit ${submitting ? "disabled" : ""}>Cancelar edicao</button>` : ""}
      </div>`;
  }

  async function saveCrmRecord(table, payload, editing) {
    const client = supabase();
    if (editing) {
      return client
        .from(table)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editing.id);
    }

    return client.from(table).insert(payload);
  }

  function routeKey() {
    return window.location.hash.replace(/^#\/?/, "").split("/")[0] || "home";
  }

  function renderTablePage(table) {
    if (table === "clients") return renderClients();
    if (table === "projects") return renderProjects();
    if (table === "budgets") return renderBudgets();
    if (table === "service_orders") return renderServiceOrders();
    if (table === "time_entries") return renderTimeEntries();
    render();
  }

  function blockSubmitWithNotice(table, message) {
    setNotice("error", message);
    renderTablePage(table);
  }

  function validateCrmPayload(table, errors) {
    if (errors.length) {
      blockSubmitWithNotice(table, errors[0]);
      return false;
    }
    return true;
  }

  async function submitCrmRecord(table, payload, editing, successMessage) {
    if (isSubmitting(table)) return;
    if (!supabase() || !isLoggedIn()) {
      blockSubmitWithNotice(table, "Supabase indisponivel. Tente novamente em instantes.");
      return;
    }

    const noticeRoute = routeKey();
    state.crmSubmitting = table;
    renderTablePage(table);

    let error = null;
    try {
      const result = await saveCrmRecord(table, payload, editing);
      error = result.error;
    } catch (caught) {
      error = caught;
    }

    await afterCrmMutation(error, successMessage, noticeRoute);
  }

  function renderCrmNotice() {
    return `
      <div class="notice ${state.notice?.type === "error" ? "notice-error" : "notice-success"} ${state.notice ? "is-visible" : ""}">
        ${escapeHtml(state.notice?.text || "")}
      </div>
      ${!supabase() ? `<div class="notice notice-error is-visible">Configure o Supabase para usar o CRM.</div>` : ""}`;
  }

  function renderClients() {
    const editingClient = crmEditRecord("clients");

    renderShell(`
      <main class="page">
        <section class="page-header">
          <div class="page-title">
            <span class="eyebrow">Clientes</span>
            <h1>Cadastro de clientes</h1>
            <p class="section-subtitle">${state.clients.length} registros no CRM</p>
          </div>
        </section>

        ${renderCrmNotice()}

        <section class="data-layout">
          <form class="panel form-stack" data-client-form ${crmFormAttrs("clients")}>
            <div class="page-title">
              <h2>${editingClient ? "Editar cliente" : "Novo cliente"}</h2>
              <p class="section-subtitle">${editingClient ? "Atualize os dados comerciais e de contato." : "Base para projetos, orcamentos e horas."}</p>
            </div>
            <label class="field">
              <span>Nome</span>
              <input class="input" name="name" value="${valueAttr(editingClient?.name)}" required>
            </label>
            <div class="form-grid">
              <label class="field">
                <span>Tipo</span>
                <select class="select" name="type">${selectOptions(CLIENT_TYPES, editingClient?.type || "company")}</select>
              </label>
              <label class="field">
                <span>Status</span>
                <select class="select" name="status">${selectOptions(CLIENT_STATUSES, editingClient?.status || "active")}</select>
              </label>
            </div>
            <div class="form-grid">
              <label class="field">
                <span>E-mail</span>
                <input class="input" name="email" type="email" value="${valueAttr(editingClient?.email)}">
              </label>
              <label class="field">
                <span>Telefone</span>
                <input class="input" name="phone" value="${valueAttr(editingClient?.phone)}">
              </label>
            </div>
            <div class="form-grid">
              <label class="field">
                <span>Documento</span>
                <input class="input" name="document" value="${valueAttr(editingClient?.document)}">
              </label>
              <label class="field">
                <span>Website</span>
                <input class="input" name="website" type="url" value="${valueAttr(editingClient?.website)}">
              </label>
            </div>
            <label class="field">
              <span>Notas</span>
              <textarea class="textarea textarea-small" name="notes">${escapeHtml(editingClient?.notes || "")}</textarea>
            </label>
            ${renderCrmFormActions("clients", editingClient, "Cadastrar cliente", "Salvar cliente")}
          </form>

          <section class="panel data-panel">
            <div class="page-title">
              <h2>Clientes</h2>
              <p class="section-subtitle">Lista operacional para relacionamento e vendas.</p>
            </div>
            ${renderClientTable()}
          </section>
        </section>
      </main>`);
  }

  function renderClientTable() {
    if (!state.clients.length) return `<div class="empty-state">Nenhum cliente cadastrado.</div>`;

    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contato</th>
              <th>Status</th>
              <th>Atualizado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.clients.map((client) => `
              <tr>
                <td>
                  <strong>${escapeHtml(client.name)}</strong>
                  <span>${escapeHtml(labelFromOptions(CLIENT_TYPES, client.type))}</span>
                </td>
                <td>
                  <strong>${escapeHtml(client.email || client.phone || "-")}</strong>
                  <span>${escapeHtml(client.website || client.document || "")}</span>
                </td>
                <td><span class="status-pill">${escapeHtml(labelFromOptions(CLIENT_STATUSES, client.status))}</span></td>
                <td>${formatDate(client.updated_at || client.created_at)}</td>
                <td>
                  <div class="row-actions">
                    <button class="icon-button" type="button" data-edit-crm="clients:${escapeHtml(client.id)}">Editar</button>
                    <button class="icon-button" type="button" data-delete-crm="clients:${escapeHtml(client.id)}">Excluir</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function renderProjects() {
    const editingProject = crmEditRecord("projects");
    const totalBudget = state.projects.reduce((sum, project) => sum + Number(project.budget_total || 0), 0);
    const statusCards = PROJECT_STATUSES.map(([id, label]) => [label, state.projects.filter((project) => project.status === id).length]);
    const clientOptions = state.clients.map((client) => [client.id, client.name]);
    const caseOptions = state.cases.map((item) => [item.id, item.title]);

    renderShell(`
      <main class="page">
        <section class="page-header">
          <div class="page-title">
            <span class="eyebrow">Projetos</span>
            <h1>Gestao de projetos</h1>
            <p class="section-subtitle">${state.projects.length} projetos cadastrados</p>
          </div>
        </section>

        ${renderCrmNotice()}

        <section class="metrics" aria-label="Resumo de projetos">
          <div class="metric">
            <strong>${formatCurrency(totalBudget)}</strong>
            <span>Valor previsto</span>
          </div>
          ${statusCards.map(([label, count]) => `
            <div class="metric">
              <strong>${count}</strong>
              <span>${escapeHtml(label)}</span>
            </div>
          `).join("")}
        </section>

        <section class="data-layout">
          <form class="panel form-stack" data-project-form ${crmFormAttrs("projects")}>
            <div class="page-title">
              <h2>${editingProject ? "Editar projeto" : "Novo projeto"}</h2>
              <p class="section-subtitle">${editingProject ? "Atualize status, prazo e previsao financeira." : "Vincule cliente, case e previsao financeira."}</p>
            </div>
            <label class="field">
              <span>Nome</span>
              <input class="input" name="name" value="${valueAttr(editingProject?.name)}" required>
            </label>
            <div class="form-grid">
              <label class="field">
                <span>Cliente</span>
                <select class="select" name="client_id">${selectOptions(clientOptions, editingProject?.client_id || "", "Sem cliente")}</select>
              </label>
              <label class="field">
                <span>Status</span>
                <select class="select" name="status">${selectOptions(PROJECT_STATUSES, editingProject?.status || "lead")}</select>
              </label>
            </div>
            <label class="field">
              <span>Case relacionado</span>
              <select class="select" name="case_id">${selectOptions(caseOptions, editingProject?.case_id || "", "Sem case")}</select>
            </label>
            <div class="form-grid">
              <label class="field">
                <span>Inicio</span>
                <input class="input" name="starts_at" type="date" value="${valueAttr(dateInputValue(editingProject?.starts_at))}">
              </label>
              <label class="field">
                <span>Prazo</span>
                <input class="input" name="due_at" type="date" value="${valueAttr(dateInputValue(editingProject?.due_at))}">
              </label>
            </div>
            <label class="field">
              <span>Valor previsto</span>
              <input class="input" name="budget_total" type="number" min="0" step="0.01" placeholder="0.00" value="${valueAttr(editingProject?.budget_total ?? "")}">
            </label>
            <label class="field">
              <span>Descricao</span>
              <textarea class="textarea textarea-small" name="description">${escapeHtml(editingProject?.description || "")}</textarea>
            </label>
            ${renderCrmFormActions("projects", editingProject, "Criar projeto", "Salvar projeto")}
          </form>

          <section class="panel data-panel">
            <div class="page-title">
              <h2>Projetos</h2>
              <p class="section-subtitle">Funil operacional de trabalho.</p>
            </div>
            ${renderProjectTable()}
          </section>
        </section>
      </main>`);
  }

  function renderProjectTable() {
    if (!state.projects.length) return `<div class="empty-state">Nenhum projeto cadastrado.</div>`;

    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Projeto</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Prazo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.projects.map((project) => `
              <tr>
                <td>
                  <strong>${escapeHtml(project.name)}</strong>
                  <span>${escapeHtml(project.description || "")}</span>
                </td>
                <td>${escapeHtml(entityName(state.clients, project.client_id))}</td>
                <td><span class="status-pill">${escapeHtml(labelFromOptions(PROJECT_STATUSES, project.status))}</span></td>
                <td>${formatCurrency(project.budget_total)}</td>
                <td>${formatDate(project.due_at)}</td>
                <td>
                  <div class="row-actions">
                    <button class="icon-button" type="button" data-edit-crm="projects:${escapeHtml(project.id)}">Editar</button>
                    <button class="icon-button" type="button" data-delete-crm="projects:${escapeHtml(project.id)}">Excluir</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function renderBudgets() {
    const editingBudget = crmEditRecord("budgets");
    const editingPayload = budgetPayload(editingBudget);
    const editingItemsText = budgetItemsText(editingBudget);
    const subtotal = Number(editingBudget?.subtotal || 0);
    const discount = Number(editingBudget?.discount || 0);
    const tax = Number(editingBudget?.tax || 0);
    const clientOptions = state.clients.map((client) => [client.id, client.name]);
    const projectOptions = state.projects.map((project) => [project.id, project.name]);

    renderShell(`
      <main class="page">
        <section class="page-header">
          <div class="page-title">
            <span class="eyebrow">Orcamentos</span>
            <h1>Propostas comerciais</h1>
            <p class="section-subtitle">${state.budgets.length} orcamentos cadastrados</p>
          </div>
        </section>

        ${renderCrmNotice()}

        ${renderBudgetMetrics()}

        <section class="budget-layout">
          <form class="panel form-stack budget-form" data-budget-form ${crmFormAttrs("budgets")}>
            <div class="page-title">
              <h2>${editingBudget ? "Editar proposta" : "Nova proposta"}</h2>
              <p class="section-subtitle">${editingBudget ? "Atualize briefing, valores e condicoes." : "Monte a ficha comercial e tecnica antes de virar OS."}</p>
            </div>

            <section class="budget-section">
              <div class="budget-section-heading">
                <strong>Ficha comercial</strong>
                <span>Cliente, responsaveis e etapa da proposta.</span>
              </div>
              <label class="field">
                <span>Titulo</span>
                <input class="input" name="title" value="${valueAttr(editingBudget?.title)}" required>
              </label>
              <div class="form-grid">
                <label class="field">
                  <span>Cliente</span>
                  <select class="select" name="client_id">${selectOptions(clientOptions, editingBudget?.client_id || "", "Sem cliente")}</select>
                </label>
                <label class="field">
                  <span>Projeto</span>
                  <select class="select" name="project_id">${selectOptions(projectOptions, editingBudget?.project_id || "", "Sem projeto")}</select>
                </label>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>Status</span>
                  <select class="select" name="status">${selectOptions(BUDGET_STATUSES, editingBudget?.status || "draft")}</select>
                </label>
                <label class="field">
                  <span>Validade</span>
                  <input class="input" name="valid_until" type="date" value="${valueAttr(dateInputValue(editingBudget?.valid_until))}">
                </label>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>Contato</span>
                  <input class="input" name="contact" value="${valueAttr(editingPayload.contact)}" placeholder="Nome, e-mail ou WhatsApp">
                </label>
                <label class="field">
                  <span>Vendedor</span>
                  <input class="input" name="sales_owner" value="${valueAttr(editingPayload.salesOwner)}" placeholder="Responsavel comercial">
                </label>
              </div>
              <label class="field">
                <span>Agencia / origem</span>
                <input class="input" name="agency" value="${valueAttr(editingPayload.agency)}" placeholder="Opcional">
              </label>
            </section>

            <section class="budget-section">
              <div class="budget-section-heading">
                <strong>Servico e escopo</strong>
                <span>Resumo para proposta, producao e carta comercial.</span>
              </div>
              <label class="field">
                <span>Resumo da proposta</span>
                <textarea class="textarea textarea-small" name="summary" placeholder="Ex: Landing page institucional com CMS e integracao de metricas.">${escapeHtml(editingPayload.summary || "")}</textarea>
              </label>
              <div class="form-grid">
                <label class="field">
                  <span>Tipo de servico</span>
                  <input class="input" name="service_type" value="${valueAttr(editingPayload.serviceType)}" placeholder="Website, branding, editorial...">
                </label>
                <label class="field">
                  <span>Quantidade</span>
                  <input class="input" name="quantity" type="number" min="1" step="1" value="${valueAttr(editingPayload.quantity ?? "")}" placeholder="1">
                </label>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>Formato / dimensoes</span>
                  <input class="input" name="format" value="${valueAttr(editingPayload.format)}" placeholder="Ex: 1440px, A4, 20x30cm">
                </label>
                <label class="field">
                  <span>Material / tecnologia</span>
                  <input class="input" name="material" value="${valueAttr(editingPayload.material)}" placeholder="Ex: Webflow, React, couche...">
                </label>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>Cores / paginas</span>
                  <input class="input" name="color_profile" value="${valueAttr(editingPayload.colorProfile)}" placeholder="Ex: 4x4, digital, 12 paginas">
                </label>
                <label class="field">
                  <span>Acabamentos</span>
                  <input class="input" name="finishing" value="${valueAttr(editingPayload.finishing)}" placeholder="Corte, dobra, animacoes, SEO...">
                </label>
              </div>
              <label class="field">
                <span>Itens da proposta</span>
                <textarea class="textarea textarea-small" name="items_text" placeholder="Um item por linha">${escapeHtml(editingItemsText)}</textarea>
              </label>
            </section>

            <section class="budget-section">
              <div class="budget-section-heading">
                <strong>Valores</strong>
                <span>Calculo simples, mantendo detalhamento tecnico no escopo.</span>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>Subtotal</span>
                  <input class="input" name="subtotal" type="number" min="0" step="0.01" placeholder="0.00" value="${valueAttr(editingBudget?.subtotal ?? "")}" data-budget-money>
                </label>
                <label class="field">
                  <span>Desconto</span>
                  <input class="input" name="discount" type="number" min="0" step="0.01" placeholder="0.00" value="${valueAttr(editingBudget?.discount ?? "")}" data-budget-money>
                </label>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>Impostos</span>
                  <input class="input" name="tax" type="number" min="0" step="0.01" placeholder="0.00" value="${valueAttr(editingBudget?.tax ?? "")}" data-budget-money>
                </label>
                <div class="budget-total-preview" aria-live="polite">
                  <span>Total estimado</span>
                  <strong data-budget-total-preview-value>${formatCurrency(subtotal - discount + tax)}</strong>
                </div>
              </div>
            </section>

            <section class="budget-section">
              <div class="budget-section-heading">
                <strong>Condicoes e producao</strong>
                <span>Informacoes que alimentam OS e acompanhamento.</span>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>Pagamento</span>
                  <input class="input" name="payment_terms" value="${valueAttr(editingPayload.paymentTerms)}" placeholder="Ex: 50% inicio / 50% entrega">
                </label>
                <label class="field">
                  <span>Entrega</span>
                  <input class="input" name="delivery_terms" value="${valueAttr(editingPayload.deliveryTerms)}" placeholder="Ex: 20 dias uteis">
                </label>
              </div>
              <label class="field">
                <span>Observacoes tecnicas</span>
                <textarea class="textarea textarea-small" name="production_notes" placeholder="Dependencias, arquivos do cliente, restricoes e criterios de aceite.">${escapeHtml(editingPayload.productionNotes || "")}</textarea>
              </label>
              <label class="field">
                <span>Notas internas</span>
                <textarea class="textarea textarea-small" name="internal_notes" placeholder="Nao aparece na proposta.">${escapeHtml(editingPayload.internalNotes || "")}</textarea>
              </label>
            </section>

            ${renderCrmFormActions("budgets", editingBudget, "Criar orcamento", "Salvar orcamento")}
          </form>

          <section class="panel data-panel budget-board">
            <div class="page-title">
              <h2>Pipeline comercial</h2>
              <p class="section-subtitle">Propostas agrupadas por status, com validade e escopo visiveis.</p>
            </div>
            ${renderBudgetPipeline()}
          </section>
        </section>
      </main>`);
  }

  function renderBudgetMetrics() {
    const activeBudgetTotal = state.budgets
      .filter((budget) => !["approved", "rejected"].includes(budget.status))
      .reduce((sum, budget) => sum + Number(budget.total || 0), 0);
    const totalApproved = state.budgets
      .filter((budget) => budget.status === "approved")
      .reduce((sum, budget) => sum + Number(budget.total || 0), 0);
    const overdueCount = state.budgets.filter((budget) => isBudgetOverdue(budget)).length;
    const averageTicket = state.budgets.length
      ? state.budgets.reduce((sum, budget) => sum + Number(budget.total || 0), 0) / state.budgets.length
      : 0;

    return `
      <section class="metrics budget-metrics" aria-label="Resumo de orcamentos">
        <div class="metric">
          <strong>${formatCurrency(activeBudgetTotal)}</strong>
          <span>Em negociacao</span>
        </div>
        <div class="metric">
          <strong>${formatCurrency(totalApproved)}</strong>
          <span>Aprovado</span>
        </div>
        <div class="metric">
          <strong>${overdueCount}</strong>
          <span>Validade vencida</span>
        </div>
        <div class="metric">
          <strong>${formatCurrency(averageTicket)}</strong>
          <span>Ticket medio</span>
        </div>
      </section>`;
  }

  function renderBudgetPipeline() {
    if (!state.budgets.length) return `<div class="empty-state">Nenhum orcamento cadastrado.</div>`;

    return `
      <div class="budget-pipeline">
        ${BUDGET_STATUSES.map(([status, label]) => {
          const items = state.budgets.filter((budget) => budget.status === status);
          return `
            <section class="budget-column">
              <div class="budget-column-heading">
                <span>${escapeHtml(label)}</span>
                <strong>${items.length}</strong>
              </div>
              <div class="budget-card-list">
                ${items.length ? items.map(renderBudgetCard).join("") : `<div class="budget-empty-column">Sem propostas</div>`}
              </div>
            </section>`;
        }).join("")}
      </div>`;
  }

  function renderBudgetCard(budget) {
    const payload = budgetPayload(budget);
    const summary = payload.summary || firstBudgetItemLine(budget) || "Sem resumo cadastrado.";
    const specs = [
      payload.serviceType,
      payload.quantity ? `${payload.quantity} un.` : "",
      payload.format,
      payload.material,
      payload.colorProfile,
    ].filter(Boolean);

    return `
      <article class="budget-card ${isBudgetOverdue(budget) ? "is-overdue" : ""}">
        <div class="budget-card-top">
          <span class="status-pill budget-status-${escapeHtml(budget.status || "draft")}">${escapeHtml(labelFromOptions(BUDGET_STATUSES, budget.status))}</span>
          <strong>${formatCurrency(budget.total, budget.currency || "BRL")}</strong>
        </div>
        <div class="budget-card-copy">
          <h3>${escapeHtml(budget.title)}</h3>
          <p>${escapeHtml(summary)}</p>
        </div>
        ${specs.length ? `<div class="budget-specs">${specs.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
        <dl class="budget-meta">
          <div>
            <dt>Cliente</dt>
            <dd>${escapeHtml(entityName(state.clients, budget.client_id))}</dd>
          </div>
          <div>
            <dt>Projeto</dt>
            <dd>${escapeHtml(entityName(state.projects, budget.project_id))}</dd>
          </div>
          <div>
            <dt>Validade</dt>
            <dd>${escapeHtml(budgetValidityText(budget))}</dd>
          </div>
          ${payload.contact ? `
            <div>
              <dt>Contato</dt>
              <dd>${escapeHtml(payload.contact)}</dd>
            </div>` : ""}
        </dl>
        <div class="row-actions">
          <button class="icon-button" type="button" data-edit-crm="budgets:${escapeHtml(budget.id)}">Editar</button>
          <button class="icon-button" type="button" data-delete-crm="budgets:${escapeHtml(budget.id)}">Excluir</button>
        </div>
      </article>`;
  }

  function budgetPayload(record) {
    if (!record?.payload || typeof record.payload !== "object" || Array.isArray(record.payload)) return {};
    return record.payload;
  }

  function budgetItemsText(record) {
    const payload = budgetPayload(record);
    if (typeof payload.itemsText === "string") return payload.itemsText;
    if (!Array.isArray(payload.items)) return "";
    return payload.items
      .map((item) => typeof item === "string" ? item : item?.text)
      .filter(Boolean)
      .join("\n");
  }

  function firstBudgetItemLine(record) {
    return budgetItemsText(record).split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
  }

  function budgetItemsFromText(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, index) => ({ position: index + 1, text }));
  }

  function budgetValidityText(budget) {
    if (!budget.valid_until) return "Sem validade";
    return `${isBudgetOverdue(budget) ? "Venceu em" : "Ate"} ${formatDate(budget.valid_until)}`;
  }

  function isBudgetOverdue(budget) {
    if (!budget?.valid_until || ["approved", "rejected"].includes(budget.status)) return false;
    const endOfDay = Date.parse(`${String(budget.valid_until).slice(0, 10)}T23:59:59Z`);
    return Number.isFinite(endOfDay) && endOfDay < Date.now();
  }

  function textFromForm(data, key) {
    return String(data.get(key) || "").trim();
  }

  function optionalQuantityFromForm(data, errors) {
    const rawValue = String(data.get("quantity") || "").trim();
    if (!rawValue) return null;
    if (!/^\d+$/.test(rawValue)) {
      errors.push("Quantidade deve ser um numero inteiro.");
      return null;
    }
    const value = Number(rawValue);
    if (!Number.isSafeInteger(value) || value <= 0) {
      errors.push("Quantidade deve ser maior que zero.");
      return null;
    }
    return value;
  }

  function updateBudgetTotalPreview(form) {
    if (!form) return;
    const target = form.querySelector("[data-budget-total-preview-value]");
    if (!target) return;
    const subtotal = decimalInputValue(form.elements.subtotal?.value);
    const discount = decimalInputValue(form.elements.discount?.value);
    const tax = decimalInputValue(form.elements.tax?.value);
    target.textContent = formatCurrency(subtotal - discount + tax);
  }

  function decimalInputValue(value) {
    const number = Number(String(value || "").replace(",", "."));
    return Number.isFinite(number) ? number : 0;
  }

  function renderServiceOrders() {
    const editingOrder = crmEditRecord("service_orders");
    const clientOptions = state.clients.map((client) => [client.id, client.name]);
    const projectOptions = state.projects.map((project) => [project.id, project.name]);
    const budgetOptions = state.budgets.map((budget) => [budget.id, budget.title]);

    renderShell(`
      <main class="page">
        <section class="page-header">
          <div class="page-title">
            <span class="eyebrow">Ordens de servico</span>
            <h1>Escopo aprovado</h1>
            <p class="section-subtitle">${state.serviceOrders.length} OS cadastradas</p>
          </div>
        </section>

        ${renderCrmNotice()}

        <section class="data-layout">
          <form class="panel form-stack" data-order-form ${crmFormAttrs("service_orders")}>
            <div class="page-title">
              <h2>${editingOrder ? "Editar OS" : "Nova OS"}</h2>
              <p class="section-subtitle">${editingOrder ? "Atualize vinculos, status, prazo e escopo." : "Transforme proposta em trabalho executavel."}</p>
            </div>
            <label class="field">
              <span>Titulo</span>
              <input class="input" name="title" value="${valueAttr(editingOrder?.title)}" required>
            </label>
            <div class="form-grid">
              <label class="field">
                <span>Cliente</span>
                <select class="select" name="client_id">${selectOptions(clientOptions, editingOrder?.client_id || "", "Sem cliente")}</select>
              </label>
              <label class="field">
                <span>Projeto</span>
                <select class="select" name="project_id">${selectOptions(projectOptions, editingOrder?.project_id || "", "Sem projeto")}</select>
              </label>
            </div>
            <div class="form-grid">
              <label class="field">
                <span>Orcamento</span>
                <select class="select" name="budget_id">${selectOptions(budgetOptions, editingOrder?.budget_id || "", "Sem orcamento")}</select>
              </label>
              <label class="field">
                <span>Status</span>
                <select class="select" name="status">${selectOptions(ORDER_STATUSES, editingOrder?.status || "open")}</select>
              </label>
            </div>
            <div class="form-grid">
              <label class="field">
                <span>Inicio</span>
                <input class="input" name="starts_at" type="date" value="${valueAttr(dateInputValue(editingOrder?.starts_at))}">
              </label>
              <label class="field">
                <span>Prazo</span>
                <input class="input" name="due_at" type="date" value="${valueAttr(dateInputValue(editingOrder?.due_at))}">
              </label>
            </div>
            <label class="field">
              <span>Escopo</span>
              <textarea class="textarea textarea-small" name="scope">${escapeHtml(scopeText(editingOrder?.scope))}</textarea>
            </label>
            ${renderCrmFormActions("service_orders", editingOrder, "Criar OS", "Salvar OS")}
          </form>

          <section class="panel data-panel">
            <div class="page-title">
              <h2>Ordens de servico</h2>
              <p class="section-subtitle">Base para controle de horas e entregas.</p>
            </div>
            ${renderOrderTable()}
          </section>
        </section>
      </main>`);
  }

  function renderOrderTable() {
    if (!state.serviceOrders.length) return `<div class="empty-state">Nenhuma OS cadastrada.</div>`;

    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>OS</th>
              <th>Projeto</th>
              <th>Status</th>
              <th>Prazo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.serviceOrders.map((order) => `
              <tr>
                <td>
                  <strong>${escapeHtml(order.title)}</strong>
                  <span>${escapeHtml(entityName(state.clients, order.client_id))}</span>
                </td>
                <td>${escapeHtml(entityName(state.projects, order.project_id))}</td>
                <td><span class="status-pill">${escapeHtml(labelFromOptions(ORDER_STATUSES, order.status))}</span></td>
                <td>${formatDate(order.due_at)}</td>
                <td>
                  <div class="row-actions">
                    <button class="icon-button" type="button" data-edit-crm="service_orders:${escapeHtml(order.id)}">Editar</button>
                    <button class="icon-button" type="button" data-delete-crm="service_orders:${escapeHtml(order.id)}">Excluir</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function renderTimeEntries() {
    const editingEntry = crmEditRecord("time_entries");
    const projectOptions = state.projects.map((project) => [project.id, project.name]);
    const orderOptions = state.serviceOrders.map((order) => [order.id, order.title]);
    const totalMinutes = state.timeEntries.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);
    const billableMinutes = state.timeEntries.filter((entry) => entry.billable).reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);

    renderShell(`
      <main class="page">
        <section class="page-header">
          <div class="page-title">
            <span class="eyebrow">Horas</span>
            <h1>Controle de horas</h1>
            <p class="section-subtitle">${state.timeEntries.length} lancamentos recentes</p>
          </div>
        </section>

        ${renderCrmNotice()}

        <section class="metrics" aria-label="Resumo de horas">
          <div class="metric">
            <strong>${formatHours(totalMinutes)}</strong>
            <span>Total lancado</span>
          </div>
          <div class="metric">
            <strong>${formatHours(billableMinutes)}</strong>
            <span>Faturavel</span>
          </div>
        </section>

        <section class="data-layout">
          <form class="panel form-stack" data-time-form ${crmFormAttrs("time_entries")}>
            <div class="page-title">
              <h2>${editingEntry ? "Editar lancamento" : "Novo lancamento"}</h2>
              <p class="section-subtitle">${editingEntry ? "Atualize projeto, data, tempo e descricao." : "Registre tempo por projeto e OS."}</p>
            </div>
            <label class="field">
              <span>Projeto</span>
              <select class="select" name="project_id" required>${selectOptions(projectOptions, editingEntry?.project_id || "", "Selecione")}</select>
            </label>
            <label class="field">
              <span>OS</span>
              <select class="select" name="service_order_id">${selectOptions(orderOptions, editingEntry?.service_order_id || "", "Sem OS")}</select>
            </label>
            <div class="form-grid">
              <label class="field">
                <span>Data</span>
                <input class="input" name="work_date" type="date" value="${valueAttr(dateInputValue(editingEntry?.work_date) || new Date().toISOString().slice(0, 10))}" required>
              </label>
              <label class="field">
                <span>Minutos</span>
                <input class="input" name="minutes" type="number" min="1" step="15" value="${valueAttr(editingEntry?.minutes ?? 60)}" required>
              </label>
            </div>
            <label class="toggle-row">
              <input type="checkbox" name="billable" ${editingEntry?.billable === false ? "" : "checked"}>
              <span>Faturavel</span>
            </label>
            <label class="field">
              <span>Descricao</span>
              <textarea class="textarea textarea-small" name="description">${escapeHtml(editingEntry?.description || "")}</textarea>
            </label>
            ${renderCrmFormActions("time_entries", editingEntry, "Registrar horas", "Salvar lancamento")}
          </form>

          <section class="panel data-panel">
            <div class="page-title">
              <h2>Lancamentos</h2>
              <p class="section-subtitle">Ultimos 300 registros.</p>
            </div>
            ${renderTimeTable()}
          </section>
        </section>
      </main>`);
  }

  function renderTimeTable() {
    if (!state.timeEntries.length) return `<div class="empty-state">Nenhuma hora registrada.</div>`;

    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Projeto</th>
              <th>Tempo</th>
              <th>Descricao</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.timeEntries.map((entry) => `
              <tr>
                <td>${formatDate(entry.work_date)}</td>
                <td>${escapeHtml(entityName(state.projects, entry.project_id))}</td>
                <td>
                  <strong>${formatHours(entry.minutes)}</strong>
                  <span>${entry.billable ? "Faturavel" : "Interno"}</span>
                </td>
                <td>${escapeHtml(entry.description || "-")}</td>
                <td>
                  <div class="row-actions">
                    <button class="icon-button" type="button" data-edit-crm="time_entries:${escapeHtml(entry.id)}">Editar</button>
                    <button class="icon-button" type="button" data-delete-crm="time_entries:${escapeHtml(entry.id)}">Excluir</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
  }

  async function createClient(form) {
    if (isSubmitting("clients")) return;
    const editing = crmEditRecord("clients");
    const data = new FormData(form);
    const errors = [];
    const payload = {
      name: requiredTextFromForm(data, "name", "o nome do cliente", errors),
      type: String(data.get("type") || "company"),
      status: String(data.get("status") || "active"),
      document: optionalFormValue(data, "document"),
      email: optionalEmailFromForm(data, "email", "E-mail", errors),
      phone: optionalFormValue(data, "phone"),
      website: optionalUrlFromForm(data, "website", "Website", errors),
      notes: String(data.get("notes") || "").trim(),
    };
    if (!validateCrmPayload("clients", errors)) return;

    await submitCrmRecord("clients", payload, editing, editing ? "Cliente atualizado." : "Cliente cadastrado.");
  }

  async function createProject(form) {
    if (isSubmitting("projects")) return;
    const editing = crmEditRecord("projects");
    const data = new FormData(form);
    const errors = [];
    const startsAt = optionalDateFromForm(data, "starts_at", "Inicio", errors);
    const dueAt = optionalDateFromForm(data, "due_at", "Prazo", errors);
    validateDateOrder(startsAt, dueAt, "Inicio", "Prazo", errors);
    const payload = {
      name: requiredTextFromForm(data, "name", "o nome do projeto", errors),
      client_id: optionalFormValue(data, "client_id"),
      case_id: optionalFormValue(data, "case_id"),
      status: String(data.get("status") || "lead"),
      starts_at: startsAt,
      due_at: dueAt,
      budget_total: nonNegativeNumberFromForm(data, "budget_total", "Valor previsto", errors),
      description: String(data.get("description") || "").trim(),
    };
    if (!validateCrmPayload("projects", errors)) return;

    await submitCrmRecord("projects", payload, editing, editing ? "Projeto atualizado." : "Projeto criado.");
  }

  async function createBudget(form) {
    if (isSubmitting("budgets")) return;
    const editing = crmEditRecord("budgets");
    const data = new FormData(form);
    const errors = [];
    const subtotal = nonNegativeNumberFromForm(data, "subtotal", "Subtotal", errors);
    const discount = nonNegativeNumberFromForm(data, "discount", "Desconto", errors);
    const tax = nonNegativeNumberFromForm(data, "tax", "Impostos", errors);
    const total = subtotal - discount + tax;
    const itemsText = textFromForm(data, "items_text");
    if (total < 0) errors.push("Total do orcamento nao pode ficar negativo.");
    const payload = {
      title: requiredTextFromForm(data, "title", "o titulo do orcamento", errors),
      client_id: optionalFormValue(data, "client_id"),
      project_id: optionalFormValue(data, "project_id"),
      status: String(data.get("status") || "draft"),
      currency: "BRL",
      subtotal,
      discount,
      tax,
      total,
      valid_until: optionalDateFromForm(data, "valid_until", "Validade", errors),
      payload: {
        ...budgetPayload(editing),
        contact: optionalFormValue(data, "contact"),
        salesOwner: optionalFormValue(data, "sales_owner"),
        agency: optionalFormValue(data, "agency"),
        summary: textFromForm(data, "summary"),
        serviceType: optionalFormValue(data, "service_type"),
        quantity: optionalQuantityFromForm(data, errors),
        format: optionalFormValue(data, "format"),
        material: optionalFormValue(data, "material"),
        colorProfile: optionalFormValue(data, "color_profile"),
        finishing: optionalFormValue(data, "finishing"),
        itemsText,
        items: budgetItemsFromText(itemsText),
        paymentTerms: optionalFormValue(data, "payment_terms"),
        deliveryTerms: optionalFormValue(data, "delivery_terms"),
        productionNotes: textFromForm(data, "production_notes"),
        internalNotes: textFromForm(data, "internal_notes"),
        updatedFromAdminAt: new Date().toISOString(),
      },
    };
    if (!validateCrmPayload("budgets", errors)) return;

    await submitCrmRecord("budgets", payload, editing, editing ? "Orcamento atualizado." : "Orcamento criado.");
  }

  async function createServiceOrder(form) {
    if (isSubmitting("service_orders")) return;
    const editing = crmEditRecord("service_orders");
    const data = new FormData(form);
    const errors = [];
    const scopeValue = String(data.get("scope") || "").trim();
    const previousScopeText = scopeText(editing?.scope);
    const startsAt = optionalDateFromForm(data, "starts_at", "Inicio", errors);
    const dueAt = optionalDateFromForm(data, "due_at", "Prazo", errors);
    validateDateOrder(startsAt, dueAt, "Inicio", "Prazo", errors);
    const payload = {
      title: requiredTextFromForm(data, "title", "o titulo da OS", errors),
      client_id: optionalFormValue(data, "client_id"),
      project_id: optionalFormValue(data, "project_id"),
      budget_id: optionalFormValue(data, "budget_id"),
      status: String(data.get("status") || "open"),
      starts_at: startsAt,
      due_at: dueAt,
      scope: scopeValue ? (editing?.scope && scopeValue === previousScopeText ? editing.scope : { text: scopeValue }) : {},
    };
    if (!validateCrmPayload("service_orders", errors)) return;

    await submitCrmRecord("service_orders", payload, editing, editing ? "OS atualizada." : "OS criada.");
  }

  async function createTimeEntry(form) {
    if (isSubmitting("time_entries")) return;
    const editing = crmEditRecord("time_entries");
    const data = new FormData(form);
    const errors = [];
    const payload = {
      project_id: optionalFormValue(data, "project_id"),
      service_order_id: optionalFormValue(data, "service_order_id"),
      work_date: requiredDateFromForm(data, "work_date", "a data", errors),
      minutes: positiveIntegerFromForm(data, "minutes", "Minutos", errors),
      description: String(data.get("description") || "").trim(),
      billable: data.get("billable") === "on",
    };
    if (!editing) payload.user_id = state.session?.user?.id || null;
    if (!payload.project_id) errors.push("Selecione um projeto para registrar horas.");
    if (payload.project_id && !state.projects.some((project) => project.id === payload.project_id)) {
      errors.push("Projeto selecionado nao foi encontrado.");
    }
    if (!validateCrmPayload("time_entries", errors)) return;

    await submitCrmRecord("time_entries", payload, editing, editing ? "Lancamento atualizado." : "Horas registradas.");
  }

  async function deleteCrmRecord(table, id) {
    if (!supabase() || !isLoggedIn() || !table || !id) return;
    const allowedTables = new Set(["clients", "projects", "budgets", "service_orders", "time_entries"]);
    if (!allowedTables.has(table)) return;
    if (state.crmEdit?.table === table && state.crmEdit?.id === id) state.crmEdit = null;

    let error = null;
    try {
      const result = await supabase().from(table).delete().eq("id", id);
      error = result.error;
    } catch (caught) {
      error = caught;
    }
    await afterCrmMutation(error, "Registro excluido.", routeKey());
  }

  function openCrmEdit(table, id) {
    if (!CRM_STATE_KEYS[table] || !id) return;
    state.crmEdit = { table, id };
    clearNotice();
    render();
  }

  function cancelCrmEdit() {
    state.crmEdit = null;
    clearNotice();
    render();
  }

  async function afterCrmMutation(error, successMessage, noticeRoute = routeKey()) {
    state.crmSubmitting = null;
    if (error) {
      setNotice("error", error.message || "Nao foi possivel concluir a operacao.", { route: noticeRoute });
    } else {
      setNotice("success", successMessage, { route: noticeRoute });
      state.crmEdit = null;
      state.crmLoaded = false;
      try {
        await loadAdminData({ force: true });
      } catch (caught) {
        setNotice("error", caught.message || "Registro salvo, mas nao foi possivel recarregar o CRM.", { route: noticeRoute });
      }
    }
    render();
  }

  return {
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
    updateBudgetTotalPreview,
  };
}
