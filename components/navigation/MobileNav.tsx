"use client";

import { useEffect, useState } from "react";

const links = [
  ["Serviços", "/#servicos"],
  ["Cases", "/cases"],
  ["Processo", "/#processo"],
  ["FAQ", "/#faq"],
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <div className="mobile-nav">
      <button
        className="mobile-nav__trigger"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span /><span /><span />
      </button>
      {open ? (
        <nav id="mobile-menu" className="mobile-nav__panel" aria-label="Navegação mobile">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
