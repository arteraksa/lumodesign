"use client";

import { useMemo } from "react";
import { LogoLoop } from "./LogoLoop";
import { assetPath } from "@/lib/asset";

const clientLogoAssets = {
  atitus: assetPath("/images/hero-logos/atitus.svg"),
  blenduca: assetPath("/images/hero-logos/blenduca.svg"),
  candy: assetPath("/images/hero-logos/candy.png"),
  capri: assetPath("/images/hero-logos/capri.png"),
  clickimpresso: assetPath("/images/hero-logos/clickimpresso.svg"),
  impresul: assetPath("/images/hero-logos/impresul.svg"),
  jaq: assetPath("/images/hero-logos/jaq.svg"),
  leylaw: assetPath("/images/hero-logos/leylaw.svg"),
  polvilho: assetPath("/images/hero-logos/polvilho.png"),
  trirs: assetPath("/images/hero-logos/trirs.svg"),
  ufrgs: assetPath("/images/hero-logos/ufrgs.svg"),
  vallor: assetPath("/images/hero-logos/vallor.png"),
  VALOR: assetPath("/images/hero-logos/valor.png"),
  valor: assetPath("/images/hero-logos/valor.png"),
} as const;

const compactClientLogos = new Set(["valor", "vallor", "jaq", "blenduca", "atitus"]);
const logoScaleClasses: Record<string, string> = {
  atitus: "logoloop__logo--medium logoloop__logo--atitus",
  blenduca: "logoloop__logo--medium",
  candy: "logoloop__logo--candy",
  clickimpresso: "logoloop__logo--clickimpresso",
  polvilho: "logoloop__logo--polvilho",
  impresul: "logoloop__logo--impresul",
  jaq: "logoloop__logo--jaq",
  ufrgs: "logoloop__logo--ufrgs",
  valor: "logoloop__logo--medium",
  vallor: "logoloop__logo--medium",
};

export function ClientLogoLoop({ names }: { names: readonly string[] }) {
  const logos = useMemo(
    () => names.map((name) => ({
      node: clientLogoAssets[name as keyof typeof clientLogoAssets] ? (
        // LogoLoop needs a raw image node because it clones and continuously translates its children.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={clientLogoAssets[name as keyof typeof clientLogoAssets]}
          alt={name}
          className={[
            compactClientLogos.has(name) ? undefined : "logoloop__logo--large",
            logoScaleClasses[name],
          ].filter(Boolean).join(" ") || undefined}
          loading="eager"
        />
      ) : <span>{name}</span>,
      title: name,
    })),
    [names],
  );

  return (
    <LogoLoop
      ariaLabel="Algumas marcas que confiam na LUMO"
      fadeOut
      fadeOutColor="#05020d"
      gap={101}
      logoHeight={20}
      logos={logos}
      speed={44}
    />
  );
}
