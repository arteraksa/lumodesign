import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Upload } from "lucide-react";
import type { PortfolioCaseMedia } from "@/types/portfolio";
import { uploadDraftMedia } from "@/lib/storage/mediaStorage";
import { insertMedia, removeMedia, reorderMedia, updateMedia } from "@/features/cases/api";
import { createUuid } from "@shared/uuid";

export function GalleryManager({
  client,
  caseId,
  media,
  setMedia,
  onOperationChange,
}: {
  client: SupabaseClient;
  caseId: string;
  media: PortfolioCaseMedia[];
  setMedia: (media: PortfolioCaseMedia[]) => void;
  onOperationChange?: (label: string | null) => void;
}) {
  const [message, setMessage] = useState("");
  const [uploads, setUploads] = useState<Array<{ id: string; name: string; size: number; status: "queued" | "uploading" | "processing" | "done" | "error"; error?: string }>>([]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function upload(files: FileList) {
    const next = [...media];
    const items = Array.from(files);
    const uploadRows = items.map((file) => ({ id: createUuid(), name: file.name, size: file.size, status: "queued" as const }));
    setUploads(uploadRows);
    onOperationChange?.(`Enviando ${items.length} imagem${items.length === 1 ? "" : "s"} da galeria`);
    for (const [index, file] of items.entries()) {
      const uploadId = uploadRows[index]?.id;
      try {
        setUploads((rows) => rows.map((row) => row.id === uploadId ? { ...row, status: "uploading" } : row));
        setMessage(`Enviando ${file.name} (${index + 1}/${items.length})...`);
        const draft = await uploadDraftMedia(client, caseId, "gallery", file);
        setUploads((rows) => rows.map((row) => row.id === uploadId ? { ...row, status: "processing" } : row));
        const row = await insertMedia(client, {
          case_id: caseId,
          source_url: "",
          storage_bucket: draft.bucket,
          storage_path: draft.path,
          media_type: "image",
          sort_order: next.length,
        });
        next.push({ ...row, source_url: draft.signedUrl });
        setUploads((rows) => rows.map((entry) => entry.id === uploadId ? { ...entry, status: "done" } : entry));
      } catch (err) {
        const error = err instanceof Error ? err.message : "Falha no upload.";
        setUploads((rows) => rows.map((row) => row.id === uploadId ? { ...row, status: "error", error } : row));
        setMessage(error);
      }
    }
    setMedia(next);
    setMessage("Uploads finalizados. Use Publicar ou Atualizar publicacao para promover midias de draft.");
    onOperationChange?.(null);
  }

  async function persistOrder(items: PortfolioCaseMedia[]) {
    setMedia(items);
    onOperationChange?.("Salvando ordem da galeria");
    try {
      await reorderMedia(client, items);
      setMessage("Ordem salva.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao ordenar.");
    } finally {
      onOperationChange?.(null);
    }
  }

  return (
    <section className="gallery-section">
      <label className="file-drop">
        <Upload size={18} />
        Upload multiplo
        <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => event.target.files && void upload(event.target.files)} />
      </label>
      {uploads.length > 0 && (
        <div className="upload-list" aria-label="Progresso dos uploads">
          {uploads.map((item) => (
            <div key={item.id} className={`upload-row ${item.status}`}>
              <span>{item.name}</span>
              <small>{formatBytes(item.size)} - {uploadLabel(item.status)}</small>
              {item.status === "uploading" && <progress aria-label={`Enviando ${item.name}`} />}
              {item.status === "error" && <button type="button" onClick={() => setMessage(item.error || "Falha no upload.")}>Ver erro</button>}
            </div>
          ))}
        </div>
      )}
      {message && <div className={`state-line ${/falha|erro/i.test(message) ? "error" : ""}`} role={/falha|erro/i.test(message) ? "alert" : "status"}>{message}</div>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const oldIndex = media.findIndex((item) => item.id === event.active.id);
          const newIndex = media.findIndex((item) => item.id === event.over?.id);
          if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) void persistOrder(arrayMove(media, oldIndex, newIndex));
        }}
      >
        <SortableContext items={media.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="gallery-list">
            {media.map((item) => (
              <SortableMediaRow key={item.id} item={item} onUpdate={async (patch) => {
                onOperationChange?.("Atualizando midia");
                try {
                  const row = await updateMedia(client, item.id, patch);
                  setMedia(media.map((entry) => (entry.id === item.id ? row : entry)));
                  setMessage("Midia atualizada.");
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : "Falha ao atualizar midia.");
                } finally {
                  onOperationChange?.(null);
                }
              }} onRemove={async () => {
                if (!confirm("Remover midia da galeria?")) return;
                onOperationChange?.("Removendo midia");
                try {
                  await removeMedia(client, item.id);
                  setMedia(media.filter((entry) => entry.id !== item.id));
                  setMessage("Midia removida.");
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : "Falha ao remover midia.");
                } finally {
                  onOperationChange?.(null);
                }
              }} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function uploadLabel(status: "queued" | "uploading" | "processing" | "done" | "error") {
  if (status === "queued") return "aguardando";
  if (status === "uploading") return "enviando sem percentual real";
  if (status === "processing") return "processando";
  if (status === "done") return "concluido";
  return "erro";
}

function SortableMediaRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: PortfolioCaseMedia;
  onUpdate: (patch: Partial<PortfolioCaseMedia>) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  return (
    <div ref={setNodeRef} className="media-row" style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button className="drag-handle" {...attributes} {...listeners} aria-label="Reordenar midia"><GripVertical size={18} /></button>
      {item.source_url ? <img src={item.source_url} alt={item.alt_text || ""} loading="lazy" /> : <span className="media-preview-empty">Preview indisponivel</span>}
      <label>
        Alt text
        <input value={item.alt_text} onChange={(event) => void onUpdate({ alt_text: event.target.value })} />
      </label>
      <label>
        Caption
        <input value={item.caption} onChange={(event) => void onUpdate({ caption: event.target.value })} />
      </label>
      <small>{item.storage_bucket || "external"} / {item.sort_order}</small>
      <button className="icon-button danger" onClick={() => void onRemove()} aria-label="Remover midia"><Trash2 size={16} /></button>
    </div>
  );
}
