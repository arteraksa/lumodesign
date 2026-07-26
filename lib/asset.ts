const normalizedBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export function assetPath(path: string) {
  if (!path.startsWith("/")) return path;
  if (!normalizedBasePath) return path;
  return `${normalizedBasePath}${path}`;
}
