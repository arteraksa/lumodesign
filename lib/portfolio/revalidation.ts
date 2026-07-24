export function portfolioPathsForSlugs(...slugs: Array<string | null | undefined>) {
  return ["/", "/cases", ...new Set(slugs.filter(Boolean).map((slug) => `/cases/${slug}`))];
}

