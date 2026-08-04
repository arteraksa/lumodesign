"use client";

import { useState } from "react";

export function ConfirmCaseAction({ id, action, label, title, description, className = "button button--tertiary admin-row-action" }: { id: string; action: (data: FormData) => void | Promise<void>; label: React.ReactNode; title: string; description: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return <><button className={className} type="button" onClick={() => setOpen(true)}>{label}</button>{open ? <div className="admin-modal-backdrop"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby={`confirm-${id}`}><h2 id={`confirm-${id}`}>{title}</h2><p>{description}</p><form action={action}><input type="hidden" name="id" value={id} /><div><button className="button button--secondary" type="button" onClick={() => setOpen(false)}>Cancelar</button><button className={className.includes("danger") ? "admin-danger-button" : "button button--primary"} type="submit">Confirmar</button></div></form></section></div> : null}</>;
}
