import Image from "next/image";
import { useId, type CSSProperties } from "react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MagicBentoCard } from "@/components/ui/MagicBentoCard";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/lib/content/site";

const HOVER_FILL_STRIPES = Array.from({ length: 18 });
const FIXED_LINE_X = [10, 20, 30, 40, 50, 60, 70, 80, 90];
const LEFT_LINE_X = [10, 20, 30, 40, 50];
const RIGHT_LINE_X = [50, 60, 70, 80, 90];

function ServiceHoverLines({
  className,
  positions,
}: {
  className: string;
  positions: number[];
}) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `${uid}-${className}`;

  return (
    <svg
      aria-hidden="true"
      className={`service-card__lines-layer ${className}`}
      viewBox="0 0 100 1000"
      preserveAspectRatio="none"
    >
      <defs>
        {positions.map((x, index) => (
          <linearGradient
            id={`${gradientId}-${index}`}
            key={x}
            x1={x}
            x2={x}
            y1="0"
            y2="1000"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fff" stopOpacity="0" />
            <stop offset="0.51" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {positions.map((x, index) => (
        <path
          d={`M${x} 0V1000`}
          key={x}
          stroke={`url(#${gradientId}-${index})`}
          strokeOpacity="0.1"
          strokeWidth="0.0625"
        />
      ))}
    </svg>
  );
}

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
            <MagicBentoCard className={`service-card service-card--${index + 1}`} delay={index * 0.035} clickEffect={false} key={service.title} tabIndex={0}>
              <Image src={service.image} alt="" fill sizes="(max-width: 809px) 100vw, (max-width: 1279px) 50vw, 40vw" />
              <div className="service-card__shade" />
              <div className="service-card__lines" aria-hidden="true">
                <ServiceHoverLines
                  className="service-card__lines-layer--fixed"
                  positions={FIXED_LINE_X}
                />
                <ServiceHoverLines
                  className="service-card__lines-layer--left"
                  positions={LEFT_LINE_X}
                />
                <ServiceHoverLines
                  className="service-card__lines-layer--right"
                  positions={RIGHT_LINE_X}
                />
              </div>
              <div className="service-card__hover-fill" aria-hidden="true">
                {HOVER_FILL_STRIPES.map((_, stripeIndex) => (
                  <span
                    className="service-card__hover-fill-stripe"
                    key={stripeIndex}
                    style={{ "--service-fill-stripe-index": stripeIndex } as CSSProperties}
                  />
                ))}
              </div>
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
