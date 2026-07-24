import { useMemo } from "react";
import type { PortfolioCaseMedia, PreviewSize } from "@/types/portfolio";
import { sanitizeHtml } from "@/lib/validation/html";

type CaseRendererCase = {
  title: string;
  slug: string;
  categories: string[];
  content_html: string;
  cover_url: string;
  external_url: string;
};

type AdjacentCase = {
  title: string;
  slug: string;
  cover_url?: string;
} | null;

type CaseRendererProps = {
  case: CaseRendererCase;
  media: PortfolioCaseMedia[];
  previousCase: AdjacentCase;
  nextCase: AdjacentCase;
  viewport: PreviewSize;
  previewMode?: boolean;
};

export function CaseRenderer({ case: item, media, previousCase, nextCase, viewport, previewMode = false }: CaseRendererProps) {
  const normalizedContent = useMemo(() => splitLeadBlock(item.content_html), [item.content_html]);
  const gallery = useMemo(() => normalizeGallery(media, item.cover_url), [media, item.cover_url]);
  const categories = item.categories.length ? item.categories.join(" / ") : "Portfolio";
  const headline = normalizedContent.leadText || item.title;

  return (
    <article className={`case-renderer case-renderer--${viewport} ${previewMode ? "case-renderer--preview" : ""}`}>
      <section className="case-renderer__hero" aria-label={`Case ${item.title}`}>
        <aside className="case-renderer__sidebar">
          <a className="case-renderer__back" href="/cases">
            <span aria-hidden="true">‹</span>
            <strong>{item.title}</strong>
          </a>
          <div className="case-renderer__meta">
            <span className="case-renderer__badge">{categories}</span>
            {item.external_url && (
              <a className="case-renderer__website" href={item.external_url} target="_blank" rel="noreferrer">
                Acessar website
              </a>
            )}
          </div>
          <div className="case-renderer__copy">
            <h1>{headline}</h1>
            <div className="case-renderer__content" dangerouslySetInnerHTML={{ __html: normalizedContent.restHtml }} />
          </div>
        </aside>

        <div className="case-renderer__gallery" aria-label="Galeria do case">
          {gallery.map((entry, index) => (
            <CaseMedia key={entry.id} entry={entry} eager={index < 2} />
          ))}
        </div>
      </section>

      {(previousCase || nextCase) && (
        <nav className="case-renderer__navigation" aria-label="Navegacao entre cases">
          <span className="case-renderer__navigation-label">Recomendacao</span>
          <div className="case-renderer__navigation-grid">
            <CaseNavigationLink direction="Anterior" item={previousCase} />
            <CaseNavigationLink direction="Proximo" item={nextCase} />
          </div>
        </nav>
      )}
    </article>
  );
}

function CaseMedia({ entry, eager }: { entry: PortfolioCaseMedia; eager: boolean }) {
  if (entry.media_type === "video") {
    return (
      <video className="case-renderer__media" controls playsInline preload="metadata">
        <source src={entry.source_url} />
      </video>
    );
  }

  const ratio = entry.width && entry.height ? `${entry.width} / ${entry.height}` : undefined;
  return (
    <img
      className="case-renderer__media"
      src={entry.source_url}
      alt={entry.alt_text || ""}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      style={ratio ? { aspectRatio: ratio } : undefined}
    />
  );
}

function CaseNavigationLink({ direction, item }: { direction: "Anterior" | "Proximo"; item: AdjacentCase }) {
  if (!item) return <span className="case-renderer__nav-card case-renderer__nav-card--empty" aria-hidden="true" />;

  return (
    <a className="case-renderer__nav-card" href={`/cases/${item.slug}`}>
      {item.cover_url && <img src={item.cover_url} alt="" loading="lazy" decoding="async" />}
      <span>{direction}</span>
      <strong>{item.title}</strong>
    </a>
  );
}

function normalizeGallery(media: PortfolioCaseMedia[], coverUrl: string): PortfolioCaseMedia[] {
  const gallery = [...media]
    .filter((entry) => entry.source_url && entry.source_url !== coverUrl)
    .sort((a, b) => a.sort_order - b.sort_order);

  return gallery;
}

function splitLeadBlock(html: string) {
  const sanitized = sanitizeHtml(html);
  if (!sanitized.trim()) return { leadText: "", restHtml: "" };

  if (typeof window === "undefined" || typeof window.DOMParser === "undefined") {
    return splitLeadBlockFallback(sanitized);
  }

  const doc = new window.DOMParser().parseFromString(`<main>${sanitized}</main>`, "text/html");
  const root = doc.body.firstElementChild;
  const firstBlock = root?.firstElementChild;
  if (!root || !firstBlock) return { leadText: "", restHtml: sanitized };

  const leadText = firstBlock.textContent?.replace(/\s+/g, " ").trim() || "";
  firstBlock.remove();
  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType === window.Node.TEXT_NODE && node.textContent?.trim()) node.remove();
  });
  return { leadText, restHtml: root.innerHTML };
}

function splitLeadBlockFallback(html: string) {
  const match = html.match(/^<([a-z1-6]+)[^>]*>(.*?)<\/\1>/i);
  if (!match) return { leadText: "", restHtml: html };

  const leadText = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return { leadText, restHtml: html.slice(match[0].length).replace(/(^|<\/[a-z1-6]>)[^<]+(?=<)/gi, "$1") };
}
