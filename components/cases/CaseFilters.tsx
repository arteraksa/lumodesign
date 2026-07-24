"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { PortfolioCase } from "@/lib/supabase/database.types";

export function CaseFilters({ cases, categories }: { cases: PortfolioCase[]; categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState("Todas");
  const visibleCases = useMemo(() => activeCategory === "Todas" ? cases : cases.filter((item) => item.categories.includes(activeCategory)), [activeCategory, cases]);

  return (
    <>
      <nav className="case-category-filters" aria-label="Filtrar cases por categoria">
        {["Todas", ...categories].map((category) => (
          <button key={category} type="button" className={activeCategory === category ? "active" : ""} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>
        ))}
      </nav>
      <div className="cases-grid cases-grid--listing" aria-live="polite">
        {visibleCases.map((item) => (
          <a className="case-card" href={`/cases/${item.slug}`} key={item.id}>
            {item.cover_url ? <Image src={item.cover_url} alt={`Capa do case ${item.title}`} fill sizes="(max-width: 809px) 100vw, 33vw" /> : null}
            <span className="case-card__meta"><strong>{item.title}</strong><small>{item.categories.join(" · ")}</small></span>
          </a>
        ))}
      </div>
      {!visibleCases.length ? <p className="cases-filter-empty">Ainda não há cases publicados nesta categoria.</p> : null}
    </>
  );
}
