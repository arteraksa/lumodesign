import { Globe, Mail, MessageCircle } from "lucide-react";
import { BlurText } from "@/components/motion/BlurText";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MagicBentoCard, MagicBentoGrid } from "@/components/ui/MagicBentoCard";
import { Section } from "@/components/ui/Section";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { siteConfig } from "@/lib/content/site";

export function Contact() {
  return (
    <Section id="contato" className="contact-section" labelledBy="contact-title">
      <ScrollReveal>
        <h2 id="contact-title">
          <BlurText
            text="Seu design pode ser mais inteligente com a gente."
            animateBy="words"
            delay={58}
            direction="top"
            as="span"
            className="contact-title__line"
          />
          <BlurText
            text="Fale conosco:"
            animateBy="words"
            delay={58}
            startDelay={420}
            direction="top"
            as="span"
            className="contact-title__line"
          />
        </h2>
      </ScrollReveal>
      <MagicBentoGrid className="contact-grid" spotlightRadius={150} glowColor="132, 0, 255">
        <MagicBentoCard className="contact-card" clickEffect={false}>
          <a href={`mailto:${siteConfig.email}`} className="contact-card__link">
            <span className="contact-card__icon"><Mail aria-hidden="true" /></span>
            <span className="contact-card__title">Por E-Mail</span>
            <small>{siteConfig.email}</small>
          </a>
        </MagicBentoCard>
        <MagicBentoCard className="contact-card" clickEffect={false}>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="contact-card__link">
            <span className="contact-card__icon"><MessageCircle aria-hidden="true" /></span>
            <span className="contact-card__title">No WhatsApp</span>
            <small>{siteConfig.phoneLabel}</small>
          </a>
        </MagicBentoCard>
        <MagicBentoCard className="contact-card" clickEffect={false}>
          <div className="contact-card__content">
            <span className="contact-card__icon"><Globe aria-hidden="true" /></span>
            <span className="contact-card__title">Nas mídias</span>
            <div className="contact-socials" aria-label="Redes sociais">
              <a className="button button--secondary button--icon" href={siteConfig.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><SocialIcon name="instagram" /></a>
              <a className="button button--secondary button--icon" href={siteConfig.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><SocialIcon name="facebook" /></a>
              <a className="button button--secondary button--icon" href={siteConfig.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><SocialIcon name="linkedin" /></a>
            </div>
          </div>
        </MagicBentoCard>
      </MagicBentoGrid>
    </Section>
  );
}
