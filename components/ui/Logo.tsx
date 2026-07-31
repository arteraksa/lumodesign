export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`wordmark${compact ? " wordmark--compact" : ""}`}>
      <img className="wordmark__image" src="/brand/lumo-logo-official.svg" alt="Lumo Design" />
    </span>
  );
}
