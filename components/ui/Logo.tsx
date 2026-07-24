export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`wordmark${compact ? " wordmark--compact" : ""}`} aria-label="RAKSA">
      <span>RA</span><span aria-hidden="true">KS</span><span>A</span>
    </span>
  );
}
