"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="state-page"><p className="section-label">Erro</p><h1>Não foi possível carregar esta página.</h1><button className="button button--primary" onClick={reset}>Tentar novamente</button></main>;
}
