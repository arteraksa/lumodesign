const legacyFramerPrefixes = [
  "https://arteraksa.github.io/raksadesign/framerusercontent.com/",
  "/raksadesign/framerusercontent.com/",
  "raksadesign/framerusercontent.com/",
];

/** Converts URLs from the old static export into usable public media URLs. */
export function normalizeMediaUrl(url: string) {
  const legacyPrefix = legacyFramerPrefixes.find((prefix) => url.startsWith(prefix));
  return legacyPrefix
    ? `https://framerusercontent.com/${url.slice(legacyPrefix.length)}`
    : url;
}
