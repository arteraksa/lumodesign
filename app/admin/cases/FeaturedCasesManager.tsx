"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Check, GripVertical, ImageOff, Plus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { PortfolioCase } from "@/lib/supabase/database.types";
import { saveFeaturedCasesAction } from "./actions";

type CaseWithCover = PortfolioCase & { coverPreviewUrl: string };
type SaveModalState = "confirm" | "saving" | "success" | "error" | null;

function FeaturedCard({ item, position, onRemove }: { item: CaseWithCover; position: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <article className={`admin-featured-card${isDragging ? " is-dragging" : ""}`} ref={setNodeRef} style={style}>
      {item.coverPreviewUrl ? <Image src={item.coverPreviewUrl} alt={`Capa de ${item.title}`} fill sizes="(max-width: 809px) 100vw, (max-width: 1100px) 50vw, 33vw" unoptimized /> : <span className="admin-featured-card__empty"><ImageOff size={22} /> Sem capa</span>}
      <span className="admin-featured-card__position" aria-label={`${position + 1}º destaque`}>{position + 1}</span>
      <div className="admin-featured-card__controls">
        <button className="admin-featured-card__drag" type="button" aria-label={`Arrastar ${item.title} para reordenar`} {...attributes} {...listeners}><GripVertical size={17} /></button>
        <button className="admin-featured-card__remove" type="button" aria-label={`Remover ${item.title} dos destaques`} onClick={onRemove}><X size={16} /></button>
      </div>
    </article>
  );
}

export function FeaturedCasesManager({ cases }: { cases: CaseWithCover[] }) {
  const initialIds = useMemo(
    () => cases.filter((item) => item.featured_on_home).sort((a, b) => a.home_order - b.home_order).map((item) => item.id).slice(0, 9),
    [cases],
  );
  const [selectedIds, setSelectedIds] = useState(initialIds);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveModal, setSaveModal] = useState<SaveModalState>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const selectedCases = selectedIds.map((id) => cases.find((item) => item.id === id)).filter((item): item is CaseWithCover => Boolean(item));
  const availableCases = cases.filter((item) => !selectedIds.includes(item.id));
  const hasSelection = selectedIds.length > 0;

  function addCase(id: string) {
    if (selectedIds.length >= 9) return;
    setSelectedIds((current) => [...current, id]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelectedIds((current) => arrayMove(current, current.indexOf(String(active.id)), current.indexOf(String(over.id))));
  }

  function save() {
    if (!hasSelection) return;
    setSaveModal("saving");
    startTransition(async () => {
      const result = await saveFeaturedCasesAction(selectedIds);
      setSaveMessage(result.message);
      setSaveModal(result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    });
  }

  return (
    <section className="admin-featured" aria-labelledby="featured-cases-title">
      <div className="admin-featured__header">
        <div>
          <p className="admin-featured__eyebrow">Home</p>
          <h2 id="featured-cases-title">Cases em destaque</h2>
          <p>Selecione até 9 cases publicados e arraste as capas para definir a mesma ordem exibida na home.</p>
        </div>
        <div className="admin-featured__actions">
          <span className={hasSelection ? "is-complete" : ""}>{selectedIds.length}/9 selecionados</span>
          <button className="button button--secondary" type="button" onClick={() => setPickerOpen((open) => !open)} disabled={selectedIds.length >= 9 && !pickerOpen}><Plus size={16} /> Adicionar case</button>
          <button className="button button--primary" type="button" onClick={() => setSaveModal("confirm")} disabled={!hasSelection || isPending}>{isPending ? "Salvando…" : "Salvar cases"}<Check size={16} /></button>
        </div>
      </div>

      {pickerOpen ? <div className="admin-featured-picker" aria-label="Cases publicados disponíveis"><div className="admin-featured-picker__header"><strong>Escolha um case publicado</strong><button className="button button--tertiary" type="button" onClick={() => setPickerOpen(false)}>Fechar</button></div>{availableCases.length ? <div className="admin-featured-picker__grid">{availableCases.map((item) => <button className="admin-featured-picker__item" key={item.id} type="button" onClick={() => addCase(item.id)}><span>{item.coverPreviewUrl ? <Image src={item.coverPreviewUrl} alt="" fill sizes="180px" unoptimized /> : <ImageOff size={18} />}</span><strong>{item.title}</strong></button>)}</div> : <p>Nenhum outro case publicado está disponível.</p>}</div> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={selectedIds} strategy={rectSortingStrategy}>
          <div className="admin-featured__grid" aria-label="Prévia dos cases em destaque">
            {selectedCases.map((item, index) => <FeaturedCard item={item} position={index} key={item.id} onRemove={() => setSelectedIds((current) => current.filter((id) => id !== item.id))} />)}
          </div>
        </SortableContext>
      </DndContext>
      {!selectedCases.length ? <div className="admin-featured__empty">Adicione 9 cases publicados para montar a prévia da home.</div> : null}
      {saveModal === "confirm" ? <div className="admin-modal-backdrop"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-featured-cases-title"><h2 id="confirm-featured-cases-title">Salvar organização dos cases?</h2><p>A seleção e a ordem atuais serão exibidas na seção de cases da home.</p><div><button className="button button--secondary" type="button" onClick={() => setSaveModal(null)}>Cancelar</button><button className="button button--primary" type="button" onClick={save}>Confirmar <Check size={16} /></button></div></section></div> : null}
      {saveModal === "saving" ? <div className="admin-operation-backdrop"><section className="admin-operation-modal" role="dialog" aria-modal="true" aria-live="polite"><span className="admin-operation-spinner" aria-hidden="true" /><h2>Salvando organização</h2><p>Atualizando os destaques da home.</p></section></div> : null}
      {saveModal === "success" ? <div className="admin-operation-backdrop"><section className="admin-operation-modal" role="dialog" aria-modal="true" aria-labelledby="featured-save-success"><span className="admin-operation-success" aria-hidden="true"><Check /></span><h2 id="featured-save-success">Cases salvos</h2><p>{saveMessage}</p><button className="button button--primary" type="button" onClick={() => setSaveModal(null)}>Fechar</button></section></div> : null}
      {saveModal === "error" ? <div className="admin-operation-backdrop"><section className="admin-operation-modal" role="dialog" aria-modal="true" aria-labelledby="featured-save-error"><span className="admin-operation-error" aria-hidden="true"><AlertCircle /></span><h2 id="featured-save-error">Não foi possível salvar</h2><p>{saveMessage}</p><button className="button button--secondary" type="button" onClick={() => setSaveModal(null)}>Fechar</button></section></div> : null}
    </section>
  );
}
