import { useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Archive, Eye, Globe, RotateCcw, Save, Undo2 } from "lucide-react";
import type { EditableCaseFields, SaveState } from "@/types/portfolio";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import { validateCaseForSave } from "@/lib/validation/case";
import { portfolioUrlPreview, validateSlug } from "@/lib/validation/slug";
import { publishCase, updatePublishedCase, type PublishStep } from "@/features/publishing/publishingApi";
import { VersionConflictError } from "./api";
import { editableCaseSnapshot, type usePortfolioCases } from "./usePortfolioCases";
import { RichTextEditor } from "@/features/editor/RichTextEditor";
import { CoverPanel } from "@/features/media/CoverPanel";
import { GalleryManager } from "@/features/media/GalleryManager";
import { PreviewPanel } from "@/features/preview/PreviewPanel";
import { OrganizationPanel } from "./OrganizationPanel";
import { createUuid } from "@shared/uuid";

type PortfolioState = ReturnType<typeof usePortfolioCases>;

export function CaseEditor({ client, portfolio }: { client: SupabaseClient; portfolio: PortfolioState }) {
  const { selected, draft, setDraft, media, setMedia, saveDraft, conflict, setConflict, reloadRemote, unpublish, archive, restoreArchived, openCase } = portfolio;
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState("geral");
  const [allowSlugEdit, setAllowSlugEdit] = useState(false);
  const [localSnapshot, setLocalSnapshot] = useState("");
  const [publishingStep, setPublishingStep] = useState<PublishStep | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; key: string; title: string; description: string; tone: "success" | "error" | "info" }>>([]);
  const [criticalError, setCriticalError] = useState<{ title: string; body: string; detail: string; retry?: () => void; canClose: boolean } | null>(null);
  const [activeAction, setActiveAction] = useState<null | "save" | "publish" | "update" | "unpublish" | "archive" | "restore" | "reconcile">(null);
  const actionInFlightRef = useRef<Promise<unknown> | null>(null);
  const lastAutosavedSnapshotRef = useRef("");

  useEffect(() => {
    setSaveState("idle");
    setMessage(null);
    setAllowSlugEdit(false);
    setLocalSnapshot("");
    setPublishingStep(null);
    setCriticalError(null);
    actionInFlightRef.current = null;
  }, [selected?.id]);

  useEffect(() => {
    lastAutosavedSnapshotRef.current = selected ? editableCaseSnapshot(selected) : "";
  }, [selected]);

  const changed = useMemo(() => {
    return portfolio.hasUnsavedChanges || portfolio.hasDraftMedia;
  }, [portfolio.hasDraftMedia, portfolio.hasUnsavedChanges]);
  const hasUnsavedDraftCover = Boolean(
    draft?.cover_storage_bucket === "portfolio-drafts"
    && draft.cover_storage_path
    && draft.cover_storage_path !== selected?.cover_storage_path,
  );

  useDebouncedEffect(() => {
    if (!selected || !draft || !changed || selected.status !== "draft") return;
    // Draft media already persisted on the selected row is a normal state and
    // must not disable later text autosaves. A newly uploaded cover pauses
    // autosave only until the explicit save persists its Storage reference.
    if (activeAction || portfolio.operation || hasUnsavedDraftCover) return;
    const snapshot = editableCaseSnapshot(draft);
    if (snapshot === editableCaseSnapshot(selected) || snapshot === lastAutosavedSnapshotRef.current) return;
    void performSave("auto");
  }, [draft, selected?.id, selected?.status, changed, activeAction, portfolio.operation, hasUnsavedDraftCover], 2000);

  async function performSave(mode: "auto" | "manual" = "manual") {
    if (!draft) return;
    const errors = validateCaseForSave(draft);
    if (errors.length) {
      setSaveState("error");
      setMessage(errors.join(" "));
      return;
    }
    if (actionInFlightRef.current) {
      await actionInFlightRef.current;
      return;
    }
    const snapshot = editableCaseSnapshot(draft);
    const run = (async () => {
    try {
      setActiveAction("save");
      setSaveState("saving");
      setMessage(mode === "auto" ? "Autosave em andamento..." : "Salvando rascunho...");
      await saveDraft(undefined, mode === "auto" ? "autosave" : "manual");
      lastAutosavedSnapshotRef.current = snapshot;
      setSaveState("saved");
      setMessage(mode === "auto" ? "Autosave concluido." : "Rascunho salvo.");
      if (mode === "manual") pushToast("save", "Rascunho salvo", "As alteracoes foram salvas no banco.", "success");
    } catch (err) {
      setSaveState(err instanceof VersionConflictError ? "conflict" : "error");
      const description = readableError(err, "Erro ao salvar.");
      setMessage(description);
      pushToast("save-error", "Erro ao salvar", description, "error");
      if (mode === "auto") setLocalSnapshot(JSON.stringify(draft, null, 2));
    } finally {
      setActiveAction(null);
      actionInFlightRef.current = null;
    }
    })();
    actionInFlightRef.current = run;
    await run;
  }

  async function handlePublish(action: "publish" | "update" = "publish") {
    if (!selected || !draft) return;
    if (actionInFlightRef.current) return;
    const run = (async () => {
    try {
      setCriticalError(null);
      setActiveAction(action);
      setSaveState("saving");
      setMessage(action === "update" ? "Atualizando publicacao..." : "Publicando case...");
      const saved = await portfolio.runOperation(
        action === "update" ? "Atualizando publicacao" : "Publicando case",
        () => action === "update"
          ? updatePublishedCase(client, selected, draft, media, { onStep: setPublishingStep })
          : publishCase(client, selected, draft, media, { onStep: setPublishingStep }),
      );
      await openCase(saved.id);
      setSaveState(action === "update" ? "published" : "saved");
      setMessage(action === "update" ? "Publicacao atualizada com sucesso." : "Case publicado com sucesso.");
      pushToast(action, action === "update" ? "Publicacao atualizada" : "Case publicado", "O estado real foi confirmado no banco.", "success");
    } catch (err) {
      setSaveState(err instanceof VersionConflictError ? "conflict" : "error");
      const description = readableError(err, action === "update" ? "Erro ao atualizar publicacao." : "Falha ao publicar.");
      setMessage(description);
      pushToast(`${action}-error`, action === "update" ? "Erro ao atualizar publicacao" : "Falha na publicacao", description, "error");
      const reconciled = await reconcileAfterUncertainWrite(description);
      if (err instanceof VersionConflictError) {
        setCriticalError({
          title: "Conflito de versao",
          body: reconciled || "Este case foi alterado em outra sessao. Recarregamos a versao mais recente quando possivel.",
          detail: description,
          retry: () => void handlePublish(action),
          canClose: true,
        });
      } else if (portfolio.hasDraftMedia) {
        setCriticalError({
          title: "Publicacao incompleta",
          body: reconciled || "Arquivos podem ter sido enviados, mas nao foi possivel confirmar o registro publico.",
          detail: description,
          retry: () => void handlePublish(action),
          canClose: true,
        });
      }
    } finally {
      setPublishingStep(null);
      setActiveAction(null);
      actionInFlightRef.current = null;
    }
    })();
    actionInFlightRef.current = run;
    await run;
  }

  async function handleStatusAction(action: "unpublish" | "archive" | "restore") {
    if (actionInFlightRef.current) return;
    const run = (async () => {
    try {
      setCriticalError(null);
      setActiveAction(action);
      setSaveState("saving");
      setMessage(action === "restore" ? "Restaurando como rascunho..." : action === "archive" ? "Arquivando case..." : "Despublicando case...");
      if (action === "restore") await restoreArchived();
      if (action === "archive") await archive();
      if (action === "unpublish") await unpublish();
      setSaveState("saved");
      setMessage(action === "restore" ? "Case restaurado como rascunho." : action === "archive" ? "Case arquivado." : "Case despublicado.");
      pushToast(action, action === "restore" ? "Case restaurado" : action === "archive" ? "Case arquivado" : "Case despublicado", "A operacao foi concluida.", "success");
    } catch (err) {
      setSaveState(err instanceof VersionConflictError ? "conflict" : "error");
      const description = readableError(err, "Falha na operacao.");
      setMessage(description);
      pushToast(`${action}-error`, "Erro na operacao", description, "error");
      await reconcileAfterUncertainWrite(description);
    } finally {
      setActiveAction(null);
      actionInFlightRef.current = null;
    }
    })();
    actionInFlightRef.current = run;
    await run;
  }

  async function reconcileAfterUncertainWrite(errorDetail: string) {
    if (!selected) return "";
    setActiveAction("reconcile");
    try {
      const result = await reloadRemote();
      const status = result?.caseRow.status;
      if (status === "published") {
        const message = "A publicacao foi confirmada no banco e a interface foi atualizada.";
        pushToast("reconcile-published", "Publicacao confirmada", message, "success");
        return message;
      }
      if (status === "draft") return "Nao foi possivel confirmar a publicacao. O case continua como rascunho.";
      if (status === "archived") return "O banco informa que o case esta arquivado.";
      return "Recarregamos o estado mais recente do banco.";
    } catch {
      return `Nao foi possivel confirmar o estado real. Detalhe: ${errorDetail}`;
    }
  }

  function pushToast(key: string, title: string, description: string, tone: "success" | "error" | "info" = "info") {
    const id = createUuid();
    setToasts((items) => {
      const withoutSameKey = items.filter((item) => item.key !== key);
      return [...withoutSameKey, { id, key, title, description, tone }].slice(-4);
    });
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 7000);
  }

  if (!selected || !draft) {
    return (
      <main className="editor-empty">
        {portfolio.loading ? (
          <div className="editor-skeleton" aria-label="Carregando editor">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            <h2>Selecione um case</h2>
            <p>Use a lista para abrir um case migrado ou criar um novo draft.</p>
          </>
        )}
      </main>
    );
  }

  const canEditSlug = selected.status !== "published" || allowSlugEdit;

  return (
    <main className="editor-panel" data-testid="case-editor" data-case-status={draft.status} data-case-slug={draft.slug}>
      <header className="editor-topbar">
        <div>
          <h2>{draft.title || "Sem titulo"}</h2>
          <span className={`status-pill ${draft.status}`}>{draft.status}</span>
          <span className={`save-state ${saveState}`}>{labelSaveState(saveState, changed, draft.status)}</span>
        </div>
        <div className="topbar-actions">
          <button onClick={() => setTab("preview")}><Eye size={16} /> Preview</button>
          {draft.status === "draft" && <button data-testid="save-draft" onClick={() => void performSave()} disabled={!portfolio.hasUnsavedChanges || Boolean(activeAction)}><Save size={16} /> Salvar rascunho</button>}
          {draft.status === "draft" && (
            <button data-testid="publish-case" className="primary" onClick={() => void handlePublish("publish")} disabled={Boolean(activeAction)}><Globe size={16} /> {activeAction === "publish" ? "Publicando..." : "Publicar"}</button>
          )}
          {draft.status === "published" && (
            <>
              <button data-testid="update-publication" className="primary" onClick={() => void handlePublish("update")} disabled={!changed || Boolean(activeAction)}><Globe size={16} /> {activeAction === "update" ? "Atualizando..." : "Atualizar publicacao"}</button>
              <button data-testid="unpublish-case" onClick={() => void handleStatusAction("unpublish")} disabled={Boolean(activeAction)}><Undo2 size={16} /> Despublicar</button>
            </>
          )}
          {draft.status === "archived" && (
            <button
              className="primary"
              data-testid="restore-case"
              onClick={() => window.confirm("Restaurar este case como rascunho?") && void handleStatusAction("restore")}
              disabled={Boolean(activeAction)}
            ><RotateCcw size={16} /> {activeAction === "restore" ? "Restaurando..." : "Restaurar como rascunho"}</button>
          )}
          {draft.status !== "archived" && <button data-testid="archive-case" className="danger" onClick={() => window.confirm("Arquivar este case?") && void handleStatusAction("archive")} disabled={Boolean(activeAction)}><Archive size={16} /> {activeAction === "archive" ? "Arquivando..." : "Arquivar"}</button>}
        </div>
      </header>

      {message && <section data-testid="operation-notice" className={`operation-notice ${saveState === "error" || saveState === "conflict" ? "error" : "info"}`} role={saveState === "error" || saveState === "conflict" ? "alert" : "status"}>{message}</section>}
      {publishingStep && <PublicationSteps current={publishingStep} />}

      {conflict && (
        <section className="conflict-box">
          <strong>Conflito de versao</strong>
          <p>A versao remota mudou. Recarregue, descarte o local ou copie seu conteudo antes de continuar.</p>
          <textarea readOnly value={localSnapshot || JSON.stringify(draft, null, 2)} />
          <div>
            <button onClick={() => navigator.clipboard?.writeText(localSnapshot || JSON.stringify(draft, null, 2))}>Copiar local</button>
            <button onClick={() => void reloadRemote()}>Recarregar remota</button>
            <button onClick={() => setConflict(null)}>Continuar comparando</button>
          </div>
        </section>
      )}

      <nav className="section-tabs" aria-label="Secoes do editor">
        {["geral", "conteudo", "capa", "galeria", "organizacao", "seo", "historico", "preview"].map((key) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{key}</button>
        ))}
      </nav>

      {tab === "geral" && (
        <section className="form-section">
          <TextField label="Titulo" testId="case-title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
          <label>
            Slug
            <div className="inline-field">
              <input data-testid="case-slug" value={draft.slug} disabled={!canEditSlug} onChange={(event) => setDraft({ ...draft, slug: event.target.value.normalize("NFC") })} />
              {selected.status === "published" && <button onClick={() => setAllowSlugEdit(true)}>Alterar slug</button>}
            </div>
            <small>{portfolioUrlPreview(draft.slug)}</small>
            {validateSlug(draft.slug).map((error) => <small className="field-error" key={error}>{error}</small>)}
          </label>
          <label>
            Status
            <select value={draft.status} disabled aria-describedby="status-help" onChange={(event) => setDraft({ ...draft, status: event.target.value as EditableCaseFields["status"] })}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
            <small id="status-help">Status muda por Publicar, Atualizar publicacao, Despublicar, Arquivar ou Restaurar.</small>
          </label>
          <TextField label="Resumo" testId="case-excerpt" value={draft.excerpt} onChange={(excerpt) => setDraft({ ...draft, excerpt })} textarea />
          <TextField label="Website" testId="case-website" value={draft.external_url} onChange={(external_url) => setDraft({ ...draft, external_url })} />
          <CategoryEditor values={draft.categories} onChange={(categories) => setDraft({ ...draft, categories })} />
        </section>
      )}

      {tab === "conteudo" && <RichTextEditor value={draft.content_json} html={draft.content_html} onChange={(content_json, content_html) => setDraft({ ...draft, content_json, content_html })} />}
      {tab === "capa" && <CoverPanel client={client} item={selected} draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} onOperationChange={portfolio.setOperation} />}
      {tab === "galeria" && <GalleryManager client={client} caseId={selected.id} media={media} setMedia={setMedia} onOperationChange={portfolio.setOperation} />}
      {tab === "organizacao" && <OrganizationPanel draft={draft} setDraft={setDraft} cases={portfolio.cases} />}
      {tab === "seo" && (
        <section className="form-section">
          <TextField label="SEO title" testId="case-seo-title" value={draft.seo_title} onChange={(seo_title) => setDraft({ ...draft, seo_title })} />
          <TextField label="SEO description" testId="case-seo-description" value={draft.seo_description} onChange={(seo_description) => setDraft({ ...draft, seo_description })} textarea />
        </section>
      )}
      {tab === "historico" && <HistoryPanel item={selected} />}
      {tab === "preview" && <PreviewPanel item={draft} media={media} cases={portfolio.cases} />}
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))} />
      {criticalError && <CriticalErrorModal error={criticalError} onClose={() => criticalError.canClose && setCriticalError(null)} />}
    </main>
  );
}

function PublicationSteps({ current }: { current: PublishStep }) {
  const steps: PublishStep[] = ["Validando conteudo", "Salvando alteracoes", "Enviando arquivos", "Promovendo midias", "Atualizando registros", "Confirmando publicacao", "Concluido"];
  return (
    <section className="publication-steps" role="status" aria-live="polite" aria-label="Etapas da publicacao">
      {steps.map((step) => <span key={step} className={step === current ? "active" : ""}>{step}</span>)}
    </section>
  );
}

function ToastRegion({
  toasts,
  onDismiss,
}: {
  toasts: Array<{ id: string; title: string; description: string; tone: "success" | "error" | "info" }>;
  onDismiss: (id: string) => void;
}) {
  return (
    <aside className="toast-region" aria-live="polite" aria-label="Mensagens do sistema">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"} tabIndex={0}>
          <strong>{toast.title}</strong>
          <p>{toast.description}</p>
          <button type="button" onClick={() => onDismiss(toast.id)}>Fechar</button>
        </div>
      ))}
    </aside>
  );
}

function CriticalErrorModal({
  error,
  onClose,
}: {
  error: { title: string; body: string; detail: string; retry?: () => void; canClose: boolean };
  onClose: () => void;
}) {
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && error.canClose) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => document.querySelector<HTMLElement>(".critical-modal button")?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="critical-modal-backdrop" role="presentation">
      <section className="critical-modal" role="dialog" aria-modal="true" aria-labelledby="critical-error-title">
        <h3 id="critical-error-title">{error.title}</h3>
        <p>{error.body}</p>
        <p>O que foi salvo: uploads ja concluidos podem permanecer no Storage. O que nao foi salvo: a confirmacao final do registro publico pode ter falhado.</p>
        <div className="critical-modal-actions">
          {error.retry && <button className="primary" type="button" onClick={error.retry}>Tentar novamente</button>}
          <button type="button" onClick={() => navigator.clipboard?.writeText(error.detail)}>Copiar detalhes tecnicos</button>
          {error.canClose && <button type="button" onClick={onClose}>Fechar</button>}
        </div>
      </section>
    </div>
  );
}

function TextField({ label, value, onChange, textarea = false, testId }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; testId?: string }) {
  return (
    <label>
      {label}
      {textarea ? (
        <textarea data-testid={testId} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input data-testid={testId} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function CategoryEditor({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  const options = ["Branding", "Desenvolvimento", "Editorial", "UI/UX Design"];
  return (
    <fieldset className="checkbox-group">
      <legend>Categorias</legend>
      {options.map((option) => (
        <label key={option}>
          <input
            data-testid={`case-category-${option.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            type="checkbox"
            checked={values.includes(option)}
            onChange={(event) => onChange(event.target.checked ? [...values, option] : values.filter((item) => item !== option))}
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}

function HistoryPanel({ item }: { item: { [key: string]: unknown } }) {
  const rows = ["id", "legacy_id", "legacy_slug", "created_at", "updated_at", "created_by", "updated_by", "version", "published_at"];
  return (
    <section className="readonly-grid">
      {rows.map((key) => (
        <label key={key}>
          {key}
          <input readOnly value={String(item[key] ?? "")} />
        </label>
      ))}
    </section>
  );
}

function labelSaveState(state: SaveState, changed: boolean, status: EditableCaseFields["status"]) {
  if (state === "saving") return "Salvando";
  if (state === "published") return "Publicacao atualizada";
  if (state === "saved" && !changed) return "Salvo";
  if (state === "error") return "Erro ao salvar";
  if (state === "conflict") return "Conflito de versao";
  if (changed && status === "draft") return "Alteracoes nao salvas";
  if (changed) return "Alteracoes nao publicadas";
  return "Salvo";
}

function readableError(err: unknown, fallback: string) {
  const raw = err instanceof Error ? err.message : fallback;
  const message = raw.toLowerCase();
  if (err instanceof VersionConflictError || message.includes("versao") || message.includes("version")) return "Este case foi alterado em outra sessao.";
  if (message.includes("duplicate") || message.includes("unique") || message.includes("slug")) return "Este slug ja esta sendo usado por outro case.";
  if (message.includes("jwt") || message.includes("expired")) return "Sua sessao expirou. Entre novamente.";
  if (message.includes("unauthorized") || message.includes("permission") || message.includes("rls")) return "Sua sessao nao tem permissao para realizar esta acao.";
  if (message.includes("storage") || message.includes("bucket") || message.includes("object")) return "Nao foi possivel enviar esta imagem. Tente novamente.";
  if (message.includes("fetch") || message.includes("network") || message.includes("failed to")) return "Nao foi possivel conectar ao servidor. Verifique sua conexao e tente novamente.";
  return raw || fallback;
}
