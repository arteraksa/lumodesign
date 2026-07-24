import { useState } from "react";
import type { EditableCaseFields, PortfolioCase, PortfolioCaseMedia, PreviewSize } from "@/types/portfolio";
import { CaseRenderer } from "./CaseRenderer";

const SIZES: Record<PreviewSize, number> = {
  desktop: 1440,
  tablet: 810,
  mobile: 390,
};

export function PreviewPanel({ item, media, cases }: { item: EditableCaseFields; media: PortfolioCaseMedia[]; cases: PortfolioCase[] }) {
  const [size, setSize] = useState<PreviewSize>("desktop");
  const sortedCases = [...cases].sort((a, b) => a.portfolio_order - b.portfolio_order || a.title.localeCompare(b.title));
  const selectedIndex = sortedCases.findIndex((entry) => entry.slug === item.slug);
  const previous = selectedIndex > 0 ? sortedCases[selectedIndex - 1] : null;
  const next = selectedIndex >= 0 && selectedIndex < sortedCases.length - 1 ? sortedCases[selectedIndex + 1] : null;

  return (
    <section className="preview-section">
      <div className="preview-controls">
        {Object.keys(SIZES).map((key) => (
          <button key={key} className={size === key ? "active" : ""} onClick={() => setSize(key as PreviewSize)}>{SIZES[key as PreviewSize]}px</button>
        ))}
      </div>
      <div className="preview-frame" style={{ maxWidth: SIZES[size] }}>
        <CaseRenderer
          case={item}
          media={media}
          previousCase={previous}
          nextCase={next}
          viewport={size}
          previewMode
        />
      </div>
    </section>
  );
}
