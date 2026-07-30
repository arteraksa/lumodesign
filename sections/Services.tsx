import Image from "next/image";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MagicBentoCard } from "@/components/ui/MagicBentoCard";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/lib/content/site";

export function Services() {
  return (
    <Section id="servicos" labelledBy="services-title">
      <ScrollReveal>
        <SectionHeading
          id="services-title"
          label="Serviços"
          title="Impulsionando marcas com design e estratégia digital"
          description="Navegar no cenário digital é um desafio. Por isso, oferecemos um ecossistema completo de soluções de design e marketing, pensado para construir marcas fortes e gerar crescimento real."
        />
      </ScrollReveal>
      <div className="services-bento-scroll">
        <div className="services-grid">
          {services.map((service, index) => (
            <MagicBentoCard className={`service-card service-card--${index + 1}`} delay={index * 0.035} clickEffect={false} key={service.title}>
              <Image src={service.image} alt="" fill sizes="(max-width: 809px) 100vw, 40vw" />
              <div className="service-card__shade" />
              <div className="service-card__hover-fill" />
              <div className="service-card__content">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </MagicBentoCard>
          ))}
        </div>
      </div>
    </Section>
  );
}
