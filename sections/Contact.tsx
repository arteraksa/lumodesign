import { Mail, MessageCircle, Share2 } from "lucide-react";
import { BlurText } from "@/components/motion/BlurText";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Section } from "@/components/ui/Section";
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
        <a href={`mailto:${siteConfig.email}`} className="contact-card"><Mail /><span>Por E-Mail</span><small>{siteConfig.email}</small></a>
        <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="contact-card"><MessageCircle /><span>No WhatsApp</span><small>{siteConfig.phoneLabel}</small></a>
        <div className="contact-card"><Share2 /><span>Nas mídias</span><small><a href={siteConfig.social.instagram}>Instagram</a> · <a href={siteConfig.social.linkedin}>LinkedIn</a></small></div>
      </div>
    </Section>
  );
}
