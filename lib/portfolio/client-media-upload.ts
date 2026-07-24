"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { requireSupabaseConfig } from "@/lib/supabase/config";
import { assertImageFile, safeFilename } from "@/lib/portfolio/media-validation";

export type ProjectImageUpload = {
  path: string;
  bucket: "portfolio-drafts";
};

function uploadError(file: File, status: number) {
  if (status === 413) return new Error(`A imagem “${file.name}” é maior do que o tamanho permitido.`);
  if (status === 401 || status === 403) return new Error("Sua sessão expirou. Entre novamente antes de enviar imagens.");
  return new Error(`Não foi possível enviar “${file.name}”. Verifique a conexão e tente novamente.`);
}

/** Uploads directly to Storage so large galleries never pass through a Server Action body. */
export async function uploadProjectImage(
  file: File,
  draftId: string,
  onProgress: (progress: number) => void,
): Promise<ProjectImageUpload> {
  await assertImageFile(file);
  const supabase = createSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sua sessão expirou. Entre novamente antes de enviar imagens.");

  const filename = safeFilename(file.name) || "imagem";
  const path = `${draftId}/${crypto.randomUUID()}-${filename}`;
  const { url, key } = requireSupabaseConfig();
  const objectPath = path.split("/").map(encodeURIComponent).join("/");

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${url}/storage/v1/object/portfolio-drafts/${objectPath}`);
    request.setRequestHeader("apikey", key);
    request.setRequestHeader("Authorization", `Bearer ${token}`);
    request.setRequestHeader("Content-Type", file.type);
    request.setRequestHeader("x-upsert", "false");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(uploadError(file, request.status));
    });
    request.addEventListener("error", () => reject(uploadError(file, request.status)));
    request.addEventListener("abort", () => reject(new Error(`O envio de “${file.name}” foi cancelado.`)));
    request.send(file);
  });

  return { path, bucket: "portfolio-drafts" };
}

export async function removeUploadedProjectImage(path: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from("portfolio-drafts").remove([path]);
  if (error) throw new Error("Não foi possível remover esta imagem. Tente novamente.");
}
