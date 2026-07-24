import type { EditableCaseFields, PortfolioCase } from "@/types/portfolio";

export function OrganizationPanel({
  draft,
  setDraft,
  cases,
}: {
  draft: EditableCaseFields;
  setDraft: (draft: EditableCaseFields) => void;
  cases: PortfolioCase[];
}) {
  const homeCases = cases.filter((item) => item.featured_on_home && item.status !== "archived").sort((a, b) => a.home_order - b.home_order);
  const portfolioCases = cases.filter((item) => item.status !== "archived").sort((a, b) => a.portfolio_order - b.portfolio_order);
  return (
    <section className="organization-grid">
      <div className="form-section">
        <label>
          <input type="checkbox" checked={draft.featured_on_home} onChange={(event) => setDraft({ ...draft, featured_on_home: event.target.checked })} />
          Destaque na home
        </label>
        <label>
          Ordem home
          <input type="number" value={draft.home_order} onChange={(event) => setDraft({ ...draft, home_order: Number(event.target.value) })} />
        </label>
        <label>
          Ordem portfolio
          <input type="number" value={draft.portfolio_order} onChange={(event) => setDraft({ ...draft, portfolio_order: Number(event.target.value) })} />
        </label>
      </div>
      <OrderPreview title="Home" items={homeCases} field="home_order" />
      <OrderPreview title="Portfolio" items={portfolioCases} field="portfolio_order" />
    </section>
  );
}

function OrderPreview({ title, items, field }: { title: string; items: PortfolioCase[]; field: "home_order" | "portfolio_order" }) {
  return (
    <div className="order-preview">
      <h3>{title}</h3>
      {items.slice(0, 20).map((item) => (
        <div key={item.id}>
          <span>{item[field]}</span>
          <strong>{item.title}</strong>
        </div>
      ))}
    </div>
  );
}
