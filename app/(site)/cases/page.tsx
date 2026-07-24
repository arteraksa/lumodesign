import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CaseFilters } from "@/components/cases/CaseFilters";
import { getPublishedCases } from "@/lib/queries/cases";
import { getPortfolioCategories } from "@/lib/queries/portfolio-categories";

export const metadata: Metadata = {
  title: "Cases",
  description: "Conheça os projetos de design, branding e produto digital da RAKSA.",
};

export default async function CasesPage() {
  const [cases, categories] = await Promise.all([getPublishedCases(), getPortfolioCategories()]);
  return (
    <main id="conteudo" className="listing-page">
      <Container>
        <header className="listing-page__header">
          <p className="section-label">Portfólio</p>
          <h1>O futuro do design em nossos cases</h1>
          <p>Estratégia, identidade e produto digital construídos para gerar resultados.</p>
        </header>
        <CaseFilters cases={cases} categories={categories} />
      </Container>
    </main>
  );
}
