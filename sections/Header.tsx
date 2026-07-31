import { siteConfig } from "@/lib/content/site";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Logo } from "@/components/ui/Logo";
import { MobileNav } from "@/components/navigation/MobileNav";

export function Header() {
  return (
    <header className="site-header">
      <Container className="site-header__container">
        <GlassSurface className="site-header__surface">
          <Link href="/" className="site-header__logo"><Logo /></Link>
          <nav className="site-header__nav" aria-label="Navegação principal">
            <Link href="/" className="button button--tertiary">Home</Link>
            <Link href="/#servicos" className="button button--tertiary">Serviços</Link>
            <Link href="/cases" className="button button--tertiary">Cases</Link>
            <Link href="/#faq" className="button button--tertiary">FAQ</Link>
          </nav>
          <a className="button button--secondary site-header__cta" href={siteConfig.whatsapp} target="_blank" rel="noreferrer">
            Entre em contato
          </a>
          <MobileNav />
        </GlassSurface>
      </Container>
    </header>
  );
}
