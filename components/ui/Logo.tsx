import Image from "next/image";
import { assetPath } from "@/lib/asset";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`wordmark${compact ? " wordmark--compact" : ""}`}>
      <Image className="wordmark__image" src={assetPath("/brand/lumo-logo-official.svg")} alt="Lumo Design" width={231} height={85} priority unoptimized />
    </span>
  );
}
