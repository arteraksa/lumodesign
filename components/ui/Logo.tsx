export function Logo({ compact = false }: { compact?: boolean }) {
  return <span className={`wordmark${compact ? " wordmark--compact" : ""}`}>LUMO</span>;
}
