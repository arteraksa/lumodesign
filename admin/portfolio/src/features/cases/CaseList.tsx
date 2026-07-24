import { Loader2, LogOut, Plus, Search } from "lucide-react";
import type { CaseListFilters, PortfolioCase } from "@/types/portfolio";

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 100'%3E%3Crect width='160' height='100' fill='%23eef1f4'/%3E%3Cpath d='M24 74 57 41l22 22 16-16 41 41H24z' fill='%23c6ced8'/%3E%3Ccircle cx='118' cy='32' r='12' fill='%23d8dde4'/%3E%3C/svg%3E";

type Props = {
  cases: PortfolioCase[];
  allCases: PortfolioCase[];
  categories: string[];
  filters: CaseListFilters;
  selectedId: string;
  loading: boolean;
  creating: boolean;
  error: string | null;
  notice: { message: string; tone: "success" | "error" } | null;
  onFilter: (filters: CaseListFilters) => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onLogout: () => void;
};

export function CaseList({ cases, allCases, categories, filters, selectedId, loading, creating, error, notice, onFilter, onOpen, onCreate, onLogout }: Props) {
  return (
    <aside className="case-list-panel">
      <div className="case-list-header">
        <div>
          <h1>Portfolio CMS</h1>
          <span>{allCases.length || 0} cases</span>
        </div>
        <div className="case-list-actions">
          <button className="icon-button primary" onClick={onCreate} title="Novo case" aria-label="Novo case" data-testid="create-case" disabled={creating} aria-busy={creating}>
            {creating ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
          </button>
          <button className="icon-button" onClick={onLogout} title="Sair" aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <label className="search-box">
        <Search size={16} />
        <input
          value={filters.search}
          placeholder="Buscar titulo, slug, categoria"
          onChange={(event) => onFilter({ ...filters, search: event.target.value })}
        />
      </label>

      <div className="filter-grid">
        <label>
          Status
          <select data-testid="case-status-filter" value={filters.status} onChange={(event) => onFilter({ ...filters, status: event.target.value as CaseListFilters["status"] })}>
            <option value="active">Ativos</option>
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
            <option value="archived">Arquivados</option>
          </select>
        </label>
        <label>
          Categoria
          <select value={filters.category} onChange={(event) => onFilter({ ...filters, category: event.target.value })}>
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Ordem
          <select value={filters.sort} onChange={(event) => onFilter({ ...filters, sort: event.target.value as CaseListFilters["sort"] })}>
            <option value="portfolio_order">Portfolio</option>
            <option value="home_order">Home</option>
            <option value="updated_at">Atualizacao</option>
            <option value="title">Titulo</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>

      {loading && !cases.length && <ListSkeleton />}
      {error && <StateLine text={error} tone="error" />}
      {notice && <StateLine text={notice.message} tone={notice.tone} />}
      {!loading && !error && !allCases.length && <StateLine text="Nenhum case encontrado." />}
      {!loading && allCases.length > 0 && !cases.length && <StateLine text={filters.status === "archived" ? "Nenhum case arquivado." : "Nenhuma busca encontrada."} />}

      <div className="case-list">
        {cases.map((item) => (
          <button
            key={item.id}
            className={`case-row ${selectedId === item.id ? "active" : ""}`}
            data-testid="case-row"
            data-case-slug={item.slug}
            data-case-status={item.status}
            onClick={() => onOpen(item.id)}
          >
            <img src={item.cover_url || PLACEHOLDER_IMAGE} alt="" loading="lazy" />
            <span className="case-row-main">
              <strong>{item.title}</strong>
              <small>{item.slug}</small>
              <span className="pill-row">
                <em className={`status-pill ${item.status}`}>{item.status}</em>
                {item.featured_on_home && <em>home</em>}
              </span>
            </span>
            <span className="case-row-meta">
              <small>{item.categories.join(", ") || "sem categoria"}</small>
              <small>{new Date(item.updated_at).toLocaleDateString("pt-BR")}</small>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function StateLine({ text, tone = "muted" }: { text: string; tone?: "muted" | "error" | "success" }) {
  return <div className={`state-line ${tone}`}>{text}</div>;
}

function ListSkeleton() {
  return (
    <div className="case-list-skeleton" aria-label="Carregando cases">
      <StateLine text="Carregando cases..." />
      {Array.from({ length: 5 }, (_, index) => (
        <div className="case-row-skeleton" key={index}>
          <span />
          <div>
            <i />
            <i />
            <i />
          </div>
        </div>
      ))}
    </div>
  );
}
