"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export function SaveFeedback({ notice }: { notice: "saved" | "published" }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timeout);
  }, []);
  if (!visible) return null;
  const published = notice === "published";
  return (
    <aside className="admin-success-toast" role="status" aria-live="polite">
      <CheckCircle2 size={20} />
      <div><strong>{published ? "Case publicado com sucesso" : "Rascunho salvo com sucesso"}</strong><span>{published ? "Ele já está disponível na página de cases." : "Suas alterações foram guardadas."}</span></div>
      <button type="button" aria-label="Fechar confirmação" onClick={() => setVisible(false)}>×</button>
    </aside>
  );
}
