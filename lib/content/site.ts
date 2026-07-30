import { assetPath } from "@/lib/asset";

export const siteConfig = {
  name: "LUMO",
  description:
    "Design inteligente, estratégia digital e tecnologia para marcas que querem crescer.",
  email: "contato@raksadesign.com",
  phoneLabel: "(51) 98115.9150",
  whatsapp: "https://wa.me/5551981159150",
  social: {
    instagram: "https://www.instagram.com/raksadesign/",
    facebook: "https://www.facebook.com/raksadesign",
    linkedin: "https://www.linkedin.com/company/raksadesign",
  },
} as const;

export const services = [
  {
    title: "Product Design",
    description:
      "Do problema à interface final. Tradução de requisitos complexos de negócio em jornadas de usuário intuitivas. Criação de produtos digitais escaláveis, unindo estética e funcionalidade.",
    image: assetPath("/images/services/ui-ux.jpg"),
  },
  {
    title: "UX Research & Discovery",
    description:
      "Decisões baseadas em dados e pessoas. Entendimento profundo das necessidades do usuário através de pesquisas, entrevistas e testes de usabilidade para mitigar riscos antes do código.",
    image: assetPath("/images/services/social-media.png"),
  },
  {
    title: "UX Audit & Redesign",
    description:
      "Evolução de interfaces existentes. Avaliação heurística e análise crítica de produtos para identificar atritos, reduzir a carga cognitiva e modernizar a experiência do usuário.",
    image: assetPath("/images/services/redesign.png"),
  },
  {
    title: "Design Systems & Ops",
    description:
      "Escalabilidade e consistência visual. Construção e manutenção de bibliotecas de componentes e UI Guidelines, acelerando a prototipação e garantindo um handoff impecável para a engenharia.",
    image: assetPath("/images/services/materiais-graficos.png"),
  },
  {
    title: "Prototipação e Interação",
    description:
      "Validação visual e fluxos dinâmicos. Criação de protótipos de alta fidelidade e microinterações para tangibilizar ideias, facilitar o alinhamento com stakeholders e testar hipóteses rapidamente.",
    image: assetPath("/images/services/editoracao.png"),
  },
  {
    title: "Growth Design & IA",
    description:
      "Design focado em conversão e resultados. Otimização de métricas de negócio (CRO) e integração de ferramentas de inteligência artificial para potencializar a eficiência e a experiência do produto.",
    image: assetPath("/images/services/identidade-visual.png"),
  },
] as const;

export const processItems = [
  {
    title: "Qualidade Premium",
    description: undefined,
  },
  {
    title: "AI Power",
    description: "Design acelerado e inovador com o poder da IA.",
  },
  {
    title: "Foco em Resultados",
    description: "Design que não só encanta, mas que impulsiona suas vendas e engajamento",
  },
  {
    title: "Inovação Constante",
    description: "Sempre à frente, explorando as últimas tendências e tecnologias de design",
  },
  {
    title: "Desburocratização",
    description: undefined,
  },
  {
    title: "Criatividade Otimizada",
    description: "IA potencializa as ideias. Visão humana garante o impacto e o resultado.",
  },
  {
    title: "Custo-Benefício",
    description: "Otimize seu investimento com soluções de design inteligentes e acessíveis",
  },
] as const;

export const faqItems = [
  {
    question: "A LUMO é uma agência de design? Qual a diferença?",
    answer:
      "Não. A LUMO é um design service. Nosso processo é otimizado por Inteligência Artificial para ser ágil, transparente e desburocratizado. Focamos em entregas rápidas e soluções estratégicas, eliminando custos elevados e lentidão.",
  },
  {
    question: "Como a Inteligência Artificial é usada no processo de criação?",
    answer:
      "A IA é nosso braço estratégico e criativo, mas a decisão final é sempre humana. Usamos tecnologia para explorar mais caminhos, otimizar processos internos e aumentar a eficácia do design. É a união da capacidade analítica da IA com a visão da nossa equipe.",
  },
  {
    question: "Quais serviços de design a LUMO oferece?",
    answer:
      "Oferecemos um portfólio completo para marcas no digital e no físico: social media, landing pages, UI/UX, materiais gráficos, identidade visual, diagramação, editoração e redesign estratégico.",
  },
  {
    question: "Como funciona o processo de contratação na LUMO?",
    answer:
      "É simples: você apresenta sua necessidade, recebe uma proposta transparente e, após a aprovação, iniciamos a criação com agilidade e profissionalismo.",
  },
  {
    question: "A LUMO atende clientes de qualquer lugar?",
    answer:
      "Sim. Somos um design service 100% digital e atendemos clientes do Brasil e do mundo. Nossa origem é Porto Alegre, mas nossa atuação não tem fronteiras.",
  },
] as const;

export const clientLogos = [
  "atitus",
  "blenduca",
  "candy",
  "capri",
  "clickimpresso",
  "impresul",
  "jaq",
  "leylaw",
  "polvilho",
  "trirs",
  "ufrgs",
  "vallor",
  "valor",
] as const;
