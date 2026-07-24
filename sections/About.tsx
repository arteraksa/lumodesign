import { BlurText } from "@/components/motion/BlurText";
import { Parallax } from "@/components/motion/Parallax";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Section } from "@/components/ui/Section";

export function About() {
  return (
    <Section id="sobre" className="about-section" labelledBy="about-title">
      <Parallax amount={20}>
        <ScrollReveal className="about-copy">
          <p className="section-label">Sobre</p>
          <BlurText
            text="Criatividade humana, amplificada por tecnologia."
            animateBy="words"
            delay={58}
            direction="top"
            as="h2"
            id="about-title"
          />
          <BlurText
            text="Utilizamos IA para refinar conceitos e automatizar tarefas repetitivas. A visão humana continua no centro das decisões, garantindo projetos de alta qualidade entregues com uma agilidade que surpreende."
            animateBy="words"
            delay={28}
            startDelay={420}
            direction="top"
          />
        </ScrollReveal>
      </Parallax>
    </Section>
  );
}
