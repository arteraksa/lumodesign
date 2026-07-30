import { Gem, Rocket, Scan } from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MagicBentoCard, MagicBentoGrid } from "@/components/ui/MagicBentoCard";
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
      <MagicBentoGrid className="process-grid" spotlightRadius={150} glowColor="132, 0, 255">
        {processItems.map((item, index) => (
          <MagicBentoCard className={`process-item process-item--${index + 1}`} clickEffect={false} key={item.title}>
            {index === 0 ? <Gem className="process-item__icon" aria-hidden="true" /> : null}
            {index === 4 ? <Scan className="process-item__icon" aria-hidden="true" /> : null}
            <h3>{item.title}</h3>
            {item.description ? <p>{item.description}</p> : null}
          </MagicBentoCard>
        ))}
        <MagicBentoCard className="process-item process-item--metric" clickEffect={false}>
          <Rocket className="process-item__icon" aria-hidden="true" />
          <p>+200 negócios acelerados</p>
        </MagicBentoCard>
      </MagicBentoGrid>
    </Section>
  );
}
