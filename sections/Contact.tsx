import { Globe, Mail, MessageCircle } from "lucide-react";
import { BlurText } from "@/components/motion/BlurText";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
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
      <div className="contact-grid">
        <a href={`mailto:${siteConfig.email}`} className="contact-card">
          <span className="contact-card__icon"><Mail aria-hidden="true" /></span>
          <span className="contact-card__title">Por E-Mail</span>
          <small>{siteConfig.email}</small>
        </a>
        <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="contact-card">
          <span className="contact-card__icon"><MessageCircle aria-hidden="true" /></span>
          <span className="contact-card__title">No WhatsApp</span>
          <small>{siteConfig.phoneLabel}</small>
        </a>
        <div className="contact-card">
          <span className="contact-card__icon"><Globe aria-hidden="true" /></span>
          <span className="contact-card__title">Nas mídias</span>
          <div className="contact-socials" aria-label="Redes sociais">
            <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><SocialIcon name="instagram" /></a>
            <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><SocialIcon name="facebook" /></a>
            <a href={siteConfig.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><SocialIcon name="linkedin" /></a>
          </div>
        </div>
      </div>
    </Section>
  );
}
