import Image from "next/image";
import type { PortfolioCase } from "@/lib/supabase/database.types";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function Cases({ cases }: { cases: PortfolioCase[] }) {
  return (
    <Section id="cases" className="cases-section" labelledBy="cases-title">
      <ScrollReveal>
        <SectionHeading
          id="cases-title"
          label="Portfólio"
          title="O futuro do design em nossos cases"
          description="Confira algumas de nossas criações"
        />
      </ScrollReveal>
      <div className="cases-grid">
        {cases.map((item, index) => (
          <ScrollReveal delay={index * 0.025} key={item.id}>
            <a className="case-card" href={`/cases/${item.slug}`} aria-label={`Ver case ${item.title}`}>
              {item.cover_url ? (
                <Image
                  src={item.cover_url}
                  alt={`Capa do case ${item.title}`}
                  fill
                  sizes="(max-width: 809px) 100vw, (max-width: 1279px) 50vw, 33vw"
                />
              ) : <div className="case-card__fallback" />}
              <span className="case-card__meta">
                <strong>{item.title}</strong>
                <span className="case-card__categories" aria-label={`Categorias: ${item.categories.join(", ")}`}>
                  {item.categories.map((category) => <span className="badge case-card__badge" key={category}>{category}</span>)}
                </span>
              </span>
            </a>
          </ScrollReveal>
        ))}
      </div>
      <div className="section-action"><ButtonLink href="/cases">Ver todos os cases</ButtonLink></div>
    </Section>
  );
}
