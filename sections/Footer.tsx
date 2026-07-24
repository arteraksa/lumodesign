import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/content/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__inner">
        <Logo compact />
        <p>© {new Date().getFullYear()} Raksa Design. Todos os direitos reservados.</p>
        <nav aria-label="Mídias sociais">
          <a href={siteConfig.whatsapp}>WA</a><a href={siteConfig.social.instagram}>IG</a><a href={`mailto:${siteConfig.email}`}>EM</a>
        </nav>
      </Container>
    </footer>
  );
}
