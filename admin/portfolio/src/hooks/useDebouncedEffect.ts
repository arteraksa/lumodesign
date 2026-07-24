import { useEffect } from "react";

export function useDebouncedEffect(effect: () => void, deps: unknown[], delay: number) {
  useEffect(() => {
    const timer = window.setTimeout(effect, delay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
