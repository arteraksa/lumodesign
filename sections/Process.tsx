import { Gem, Rocket, Scan } from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { processItems } from "@/lib/content/site";

export function Process() {
  return (
    <Section id="processo" className="differentials-section" labelledBy="process-title">
      <ScrollReveal>
        <SectionHeading
          id="process-title"
          label="Diferenciais"
          title="Agilidade que transforma ideias em realidade"
          description="Utilizamos IA para refinar conceitos e automatizar tarefas repetitivas, resultando em projetos de design de alta qualidade entregues com uma agilidade que surpreende."
        />
      </ScrollReveal>
      <div className="process-grid">
        {processItems.map((item, index) => (
          <ScrollReveal className={`process-item process-item--${index + 1}`} delay={index * 0.03} key={item.title}>
            {index === 0 ? <Gem className="process-item__icon" aria-hidden="true" /> : null}
            {index === 4 ? <Scan className="process-item__icon" aria-hidden="true" /> : null}
            <h3>{item.title}</h3>
            {item.description ? <p>{item.description}</p> : null}
          </ScrollReveal>
        ))}
        <ScrollReveal className="process-item process-item--metric" delay={processItems.length * 0.03}>
          <Rocket className="process-item__icon" aria-hidden="true" />
          <p>+200 negócios acelerados</p>
        </ScrollReveal>
      </div>
    </Section>
  );
}
