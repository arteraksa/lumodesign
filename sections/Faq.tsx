import { BlurText } from "@/components/motion/BlurText";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { FaqAccordion } from "@/components/interactive/FaqAccordion";
import { Section } from "@/components/ui/Section";
import { faqItems } from "@/lib/content/site";

export function Faq() {
  return (
    <Section id="faq" className="faq-section" labelledBy="faq-title">
      <ScrollReveal>
        <BlurText
          text="Respostas inteligentes para o seu design"
          animateBy="words"
          delay={58}
          direction="top"
          as="h2"
          id="faq-title"
        />
      </ScrollReveal>
      <FaqAccordion items={faqItems} />
    </Section>
  );
}
