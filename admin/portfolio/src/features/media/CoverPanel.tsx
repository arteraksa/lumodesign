import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditableCaseFields, PortfolioCase } from "@/types/portfolio";
import { uploadDraftMedia } from "@/lib/storage/mediaStorage";

export function CoverPanel({
  client,
  item,
  draft,
  onChange,
  onOperationChange,
}: {
  client: SupabaseClient;
  item: PortfolioCase;
  draft: EditableCaseFields;
  onChange: (patch: Partial<EditableCaseFields>) => void;
  onOperationChange?: (label: string | null) => void;
}) {
  const [progress, setProgress] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState<{ name: string; size: number; status: "uploading" | "processing" | "done" | "error" } | null>(null);
  async function upload(file: File) {
    setProgress("Enviando capa...");
    setUploadingFile({ name: file.name, size: file.size, status: "uploading" });
    onOperationChange?.("Enviando capa");
    try {
      const result = await uploadDraftMedia(client, item.id, "cover", file);
      setUploadingFile({ name: file.name, size: file.size, status: "processing" });
      setPreviewUrl(result.signedUrl);
      onChange({ cover_storage_bucket: result.bucket, cover_storage_path: result.path, cover_url: "" });
      setUploadingFile({ name: file.name, size: file.size, status: "done" });
      setProgress("Capa enviada. Use Salvar rascunho, Publicar ou Atualizar publicacao para confirmar.");
    } catch (err) {
      setUploadingFile({ name: file.name, size: file.size, status: "error" });
      setProgress(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      onOperationChange?.(null);
    }
  }
  return (
    <section className="media-section">
      <div className="cover-preview">
        {previewUrl || draft.cover_url ? <img src={previewUrl || draft.cover_url} alt="" /> : <span>Sem capa</span>}
      </div>
      <div className="form-section">
        <label>
          URL da capa
          <input value={draft.cover_url} onChange={(event) => onChange({ cover_url: event.target.value, cover_storage_bucket: null, cover_storage_path: null })} />
        </label>
        <label>
          Bucket
          <input readOnly value={draft.cover_storage_bucket || ""} />
        </label>
        <label>
          Path
          <input readOnly value={draft.cover_storage_path || ""} />
        </label>
        <label className="file-drop">
          Upload nova capa
          <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])} />
        </label>
        {uploadingFile && (
          <div className={`upload-row ${uploadingFile.status}`}>
            <span>{uploadingFile.name}</span>
            <small>{Math.max(1, Math.round(uploadingFile.size / 1024))} KB - {uploadingFile.status === "uploading" ? "enviando sem percentual real" : uploadingFile.status === "processing" ? "processando" : uploadingFile.status === "done" ? "concluido" : "erro"}</small>
            {uploadingFile.status === "uploading" && <progress aria-label={`Enviando ${uploadingFile.name}`} />}
          </div>
        )}
        {item.status === "draft" && (
          <button onClick={() => onChange({ cover_url: "", cover_storage_bucket: null, cover_storage_path: null })}>Remover capa do draft</button>
        )}
        <small>Alt text de capa nao existe no modelo v2 atual; limitacao documentada no relatorio.</small>
        {progress && <div className={`state-line ${/falha|erro/i.test(progress) ? "error" : ""}`} role={/falha|erro/i.test(progress) ? "alert" : "status"}>{progress}</div>}
      </div>
    </section>
  );
}
