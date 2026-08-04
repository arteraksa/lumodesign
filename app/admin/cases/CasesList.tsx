"use client";

import { Archive, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { PortfolioCase } from "@/lib/supabase/database.types";
import { archiveCaseAction, moveCaseToTrashAction } from "./actions";
import { ConfirmCaseAction } from "./ConfirmCaseAction";
import { CaseTableIdentity } from "./CaseTableIdentity";

type SortKey = "title" | "status" | "updated_at";
type SortDirection = "asc" | "desc";
type CaseWithCover = PortfolioCase & { coverPreviewUrl: string };

const sortLabels: Record<SortKey, string> = {
  title: "Case",
  status: "Status",
  updated_at: "Atualizado em",
};

const statusLabels: Record<PortfolioCase["status"], string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

function compareCases(left: CaseWithCover, right: CaseWithCover, field: SortKey) {
  if (field === "title") return collator.compare(left.title, right.title);
  if (field === "status") return collator.compare(statusLabels[left.status], statusLabels[right.status]);
  return new Date(left.updated_at).getTime() - new Date(right.updated_at).getTime();
}

export function CasesList({ cases }: { cases: CaseWithCover[] }) {
  const [sort, setSort] = useState<SortKey>("title");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const sortedCases = useMemo(() => [...cases].sort((left, right) => {
    const result = compareCases(left, right, sort);
    if (result) return direction === "asc" ? result : -result;
    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  }), [cases, direction, sort]);

  function changeSort(field: SortKey) {
    const nextDirection: SortDirection = field === sort ? (direction === "asc" ? "desc" : "asc") : (field === "updated_at" ? "desc" : "asc");
    setSort(field); setPage(1);
    setDirection(nextDirection);
    window.history.replaceState(null, "", `/admin/cases?sort=${field}&direction=${nextDirection}`);
  }

  return (
    <section className="admin-list" aria-label="Lista de cases">
      <table className="admin-list__table">
        <thead>
          <tr>
            {(Object.keys(sortLabels) as SortKey[]).map((field) => {
              const active = field === sort;
              const Icon = active && direction === "asc" ? ArrowUp : ArrowDown;
              const directionLabel = active ? (direction === "asc" ? "crescente" : "decrescente") : "";
              return <th scope="col" key={field}><button className={`admin-list__sort${active ? " is-active" : ""}`} type="button" onClick={() => changeSort(field)} aria-label={`Ordenar por ${sortLabels[field]}${directionLabel ? `, atualmente em ordem ${directionLabel}` : ""}`}><span>{sortLabels[field]}</span><Icon aria-hidden="true" size={13} /></button></th>;
            })}
            <th scope="col" aria-label="Ações" />
          </tr>
        </thead>
        <tbody>
          {sortedCases.slice((page - 1) * 10, page * 10).map((item) => (
            <tr data-testid="case-row" key={item.id}>
              <td><CaseTableIdentity item={item} coverPreviewUrl={item.coverPreviewUrl} /></td>
              <td><span className="admin-table-status"><i className={`status status--${item.status}`} />{statusLabels[item.status]}</span></td>
              <td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.updated_at))}</td>
              <td><div className="admin-case-actions" aria-label={`Ações para ${item.title}`}><ConfirmCaseAction id={item.id} action={archiveCaseAction} label={<><Archive size={14} /> Arquivar</>} title="Arquivar case?" description="O case sairá da lista ativa e poderá ser restaurado depois." /><ConfirmCaseAction id={item.id} action={moveCaseToTrashAction} label={<><Trash2 size={14} /> Excluir</>} title="Mover case para a lixeira?" description="Ele ficará disponível para restauração por 30 dias." className="button button--tertiary admin-row-action admin-row-action--danger" /></div></td>
            </tr>
          ))}
          {!cases.length ? <tr><td className="admin-empty" colSpan={4}>Nenhum case criado ainda.</td></tr> : null}
        </tbody>
      </table>
      {cases.length > 10 ? <nav className="admin-pagination" aria-label="Paginação de cases"><button className="button button--secondary admin-pagination__previous" type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={15} /> Anterior</button><div className="admin-pagination__pages">{Array.from({ length: Math.ceil(cases.length / 10) }, (_, index) => <button className={`button button--secondary${page === index + 1 ? " is-active" : ""}`} key={index} type="button" onClick={() => setPage(index + 1)}>{index + 1}</button>)}</div><button className="button button--secondary admin-pagination__next" type="button" disabled={page === Math.ceil(cases.length / 10)} onClick={() => setPage((current) => current + 1)}>Próximo <ChevronRight size={15} /></button></nav> : null}
    </section>
  );
}
