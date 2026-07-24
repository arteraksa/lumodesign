import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaseListFilters, EditableCaseFields, PortfolioCase, PortfolioCaseMedia } from "@/types/portfolio";
import { archiveCase, createCase, getCase, listCases, listMedia, restoreArchivedCase, unpublishCase, updateCase, VersionConflictError } from "./api";
import { createUuid } from "@shared/uuid";

export type SaveSource = "autosave" | "manual";
export type SaveOperationStatus = "success" | "error" | "superseded";

type SaveOperation = {
  operationId: string;
  caseId: string;
  source: SaveSource;
  startedAt: string;
  finishedAt: string | null;
  status: SaveOperationStatus | null;
};

function reportSaveOperation(operation: SaveOperation) {
  if (typeof window === "undefined") return;
  const diagnosticWindow = window as Window & { __portfolioSaveOperations?: SaveOperation[] };
  diagnosticWindow.__portfolioSaveOperations ??= [];
  diagnosticWindow.__portfolioSaveOperations.push(operation);
  window.dispatchEvent(new CustomEvent("portfolio:save-operation", { detail: operation }));
}

export function toEditableCase(item: PortfolioCase): EditableCaseFields {
  return {
    title: item.title,
    slug: item.slug,
    status: item.status,
    categories: item.categories || [],
    excerpt: item.excerpt,
    content_json: item.content_json,
    content_html: item.content_html,
    cover_url: item.cover_url,
    cover_storage_bucket: item.cover_storage_bucket,
    cover_storage_path: item.cover_storage_path,
    external_url: item.external_url,
    featured_on_home: item.featured_on_home,
    home_order: item.home_order,
    portfolio_order: item.portfolio_order,
    seo_title: item.seo_title,
    seo_description: item.seo_description,
  };
}

export function editableCaseSnapshot(item: EditableCaseFields | PortfolioCase | null) {
  if (!item) return "";
  const editable = "legacy_id" in item ? toEditableCase(item) : item;
  return JSON.stringify({
    title: editable.title,
    slug: editable.slug,
    status: editable.status,
    categories: [...(editable.categories || [])],
    excerpt: editable.excerpt,
    content_json: editable.content_json,
    content_html: editable.content_html,
    cover_url: editable.cover_url,
    cover_storage_bucket: editable.cover_storage_bucket,
    cover_storage_path: editable.cover_storage_path,
    external_url: editable.external_url,
    featured_on_home: editable.featured_on_home,
    home_order: editable.home_order,
    portfolio_order: editable.portfolio_order,
    seo_title: editable.seo_title,
    seo_description: editable.seo_description,
  });
}

function sameEditableCase(item: PortfolioCase | null, draft: EditableCaseFields | null) {
  if (!item && !draft) return true;
  return Boolean(item && draft && editableCaseSnapshot(item) === editableCaseSnapshot(draft));
}

export function usePortfolioCases(client: SupabaseClient | null) {
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [selected, setSelected] = useState<PortfolioCase | null>(null);
  const [draft, setDraft] = useState<EditableCaseFields | null>(null);
  const [media, setMedia] = useState<PortfolioCaseMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<VersionConflictError | null>(null);
  const [filters, setFilters] = useState<CaseListFilters>({ search: "", status: "active", category: "all", sort: "portfolio_order" });
  const selectedRef = useRef<PortfolioCase | null>(null);
  const draftRef = useRef<EditableCaseFields | null>(null);
  const saveInFlightRef = useRef<Promise<PortfolioCase | null> | null>(null);
  const saveInFlightSnapshotRef = useRef("");
  const pendingSaveRef = useRef(false);
  const pendingSaveSourceRef = useRef<SaveSource>("autosave");
  const saveSeqRef = useRef(0);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const runOperation = useCallback(async <T,>(label: string, task: () => Promise<T>): Promise<T> => {
    setOperation(label);
    try {
      return await task();
    } finally {
      setOperation(null);
    }
  }, []);

  const refreshCases = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      setCases(await runOperation("Carregando lista de cases", () => listCases(client)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao listar cases.");
    } finally {
      setLoading(false);
    }
  }, [client, runOperation]);

  const openCase = useCallback(async (id: string) => {
    if (!client) return;
    const requestId = ++saveSeqRef.current;
    setLoading(true);
    setError(null);
    setConflict(null);
    try {
      const [caseRow, mediaRows] = await runOperation("Carregando case", () => Promise.all([getCase(client, id), listMedia(client, id)]));
      if (requestId !== saveSeqRef.current) return null;
      setSelected(caseRow);
      setDraft(toEditableCase(caseRow));
      setMedia(mediaRows);
      setCases((items) => items.map((item) => (item.id === caseRow.id ? caseRow : item)));
      return { caseRow, mediaRows };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir case.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, runOperation]);

  const saveDraft = useCallback(async (patch?: Partial<EditableCaseFields>, source: SaveSource = "manual") => {
    if (!client) return null;

    if (saveInFlightRef.current) {
      const currentDraft = draftRef.current;
      if (currentDraft && editableCaseSnapshot(currentDraft) !== saveInFlightSnapshotRef.current) {
        pendingSaveRef.current = true;
        pendingSaveSourceRef.current = source;
      }
      return saveInFlightRef.current;
    }

    const runSave = async (): Promise<PortfolioCase | null> => {
      const current = selectedRef.current;
      const currentDraft = draftRef.current;
      if (!current || !currentDraft) return null;

      const payload = patch ? { ...currentDraft, ...patch } : currentDraft;
      const payloadSnapshot = editableCaseSnapshot(payload);
      if (payloadSnapshot === editableCaseSnapshot(current)) return current;
      saveInFlightSnapshotRef.current = payloadSnapshot;
      const operation: SaveOperation = {
        operationId: createUuid(),
        caseId: current.id,
        source,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        status: null,
      };
      reportSaveOperation(operation);
      let status: SaveOperationStatus = "error";

      try {
        const requestId = ++saveSeqRef.current;
        const saved = await runOperation("Salvando no banco", () => updateCase(client, current.id, current.version, payload));
        if (selectedRef.current?.id !== current.id || requestId < saveSeqRef.current - 1) {
          status = "superseded";
          return saved;
        }

        setSelected(saved);
        setCases((items) => items.map((item) => (item.id === saved.id ? saved : item)));
        setConflict(null);

        const latestDraft = draftRef.current;
        if (editableCaseSnapshot(latestDraft) === payloadSnapshot) {
          setDraft(toEditableCase(saved));
        } else {
          pendingSaveRef.current = true;
          pendingSaveSourceRef.current = source;
        }
        status = "success";
        return saved;
      } catch (err) {
        if (err instanceof VersionConflictError) {
          setConflict(err);
        }
        throw err;
      } finally {
        reportSaveOperation({ ...operation, finishedAt: new Date().toISOString(), status });
      }
    };

    saveInFlightRef.current = runSave();
    try {
      const result = await saveInFlightRef.current;
      return result;
    } finally {
      saveInFlightRef.current = null;
      saveInFlightSnapshotRef.current = "";
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        const pendingSource = pendingSaveSourceRef.current;
        pendingSaveSourceRef.current = "autosave";
        const latest = selectedRef.current;
        const latestDraft = draftRef.current;
        if (latest && latestDraft && editableCaseSnapshot(latest) !== editableCaseSnapshot(latestDraft)) {
          void saveDraft(undefined, pendingSource);
        }
      }
    }
  }, [client, runOperation]);

  const createNewCase = useCallback(async () => {
    if (!client) return;
    const row = await runOperation("Criando case", () => createCase(client, "Novo case"));
    setCases((items) => [row, ...items]);
    return row;
  }, [client, runOperation]);

  const reloadRemote = useCallback(async () => {
    if (selected) return openCase(selected.id);
    return null;
  }, [openCase, selected]);

  const unpublish = useCallback(async () => {
    if (!client || !selected) return;
    const row = await runOperation("Despublicando case", () => unpublishCase(client, selected));
    await openCase(row.id);
    return row;
  }, [client, openCase, runOperation, selected]);

  const archive = useCallback(async () => {
    if (!client || !selected) return;
    const row = await runOperation("Arquivando case", () => archiveCase(client, selected));
    await openCase(row.id);
    return row;
  }, [client, openCase, runOperation, selected]);

  const restoreArchived = useCallback(async () => {
    if (!client || !selected) return;
    const row = await runOperation("Restaurando como rascunho", () => restoreArchivedCase(client, selected));
    await openCase(row.id);
    return row;
  }, [client, openCase, runOperation, selected]);

  const filteredCases = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const sorted = [...cases].filter((item) => {
      if (filters.status === "active" && item.status === "archived") return false;
      if (filters.status !== "all" && filters.status !== "active" && item.status !== filters.status) return false;
      if (filters.category !== "all" && !item.categories.includes(filters.category as never)) return false;
      if (!search) return true;
      return [item.title, item.slug, item.status, item.categories.join(" ")].join(" ").toLowerCase().includes(search);
    });
    return sorted.sort((a, b) => {
      if (filters.sort === "title" || filters.sort === "status") return String(a[filters.sort]).localeCompare(String(b[filters.sort]));
      if (filters.sort === "updated_at") return String(b.updated_at).localeCompare(String(a.updated_at));
      return Number(a[filters.sort]) - Number(b[filters.sort]);
    });
  }, [cases, filters]);

  const categories = useMemo(() => Array.from(new Set(cases.flatMap((item) => item.categories))).sort(), [cases]);
  const hasUnsavedChanges = useMemo(() => !sameEditableCase(selected, draft), [draft, selected]);
  const hasDraftMedia = useMemo(
    () => draft?.cover_storage_bucket === "portfolio-drafts" || media.some((item) => item.storage_bucket === "portfolio-drafts"),
    [draft?.cover_storage_bucket, media],
  );

  return {
    cases,
    filteredCases,
    categories,
    selected,
    draft,
    setDraft,
    media,
    setMedia,
    loading,
    operation,
    setOperation,
    error,
    conflict,
    setConflict,
    filters,
    setFilters,
    refreshCases,
    openCase,
    saveDraft,
    createNewCase,
    reloadRemote,
    unpublish,
    archive,
    restoreArchived,
    hasUnsavedChanges,
    hasDraftMedia,
    runOperation,
  };
}
