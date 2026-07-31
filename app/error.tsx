"use client";

import { SpecularButton } from "@/components/ui/SpecularButton";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="state-page"><p className="section-label">Erro</p><h1>Não foi possível carregar esta página.</h1><SpecularButton className="specular-button--primary" onClick={reset}>Tentar novamente</SpecularButton></main>;
}
