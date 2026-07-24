export const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const maxUploadBytes = 25 * 1024 * 1024;

const extensionsByMime: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
};

function hasBytes(bytes: Uint8Array, offset: number, expected: readonly number[]) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

export function detectImageMime(bytes: Uint8Array) {
  if (hasBytes(bytes, 0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (hasBytes(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (ascii(bytes, 4, 4) === "ftyp" && ["avif", "avis", "mif1"].includes(ascii(bytes, 8, 4))) {
    return "image/avif";
  }
  return null;
}

export async function assertImageFile(file: File) {
  if (file.size === 0) {
    throw new Error(`Arquivo "${file.name}" está vazio.`);
  }
  if (file.size > maxUploadBytes) {
    throw new Error(`Arquivo "${file.name}" excede o limite de 25 MB.`);
  }
  if (!allowedImageTypes.has(file.type)) {
    throw new Error(`Arquivo "${file.name}" recusado. Envie JPEG, PNG, WebP ou AVIF.`);
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!extensionsByMime[file.type]?.includes(extension)) {
    throw new Error(`A extensão de "${file.name}" não corresponde ao tipo informado.`);
  }

  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (detectImageMime(header) !== file.type) {
    throw new Error(`O conteúdo de "${file.name}" não corresponde a uma imagem ${file.type}.`);
  }
}

export function safeFilename(name: string) {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
