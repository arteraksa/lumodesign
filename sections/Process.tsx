import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { processItems } from "@/lib/content/site";

export function Process() {
  return (
    <Section id="processo" labelledBy="process-title">
      <ScrollReveal>
        <SectionHeading id="process-title" label="Diferenciais" title="Agilidade que transforma ideias em realidade" />
      </ScrollReveal>
      <div className="process-grid">
        {processItems.map((item, index) => (
          <ScrollReveal className="process-item" delay={index * 0.03} key={item.title}>
            <span className="process-item__dot" aria-hidden="true" />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </ScrollReveal>
        ))}
        <ScrollReveal className="process-item process-item--metric">
          <strong>+200</strong><span>negócios acelerados</span>
        </ScrollReveal>
      </div>
    </Section>
  );
}
