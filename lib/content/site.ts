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
    title: "UI/UX Design",
    description:
      "Criação de interfaces focadas em experiência e conversão. Design funcional, responsivo e otimizado por IA.",
    image: assetPath("/images/services/ui-ux.jpg"),
  },
  {
    title: "Social Media Design",
    description:
      "Conteúdo visual estratégico para engajamento, adaptado para cada plataforma.",
    image: assetPath("/images/services/social-media.png"),
  },
  {
    title: "Redesign Estratégico",
    description:
      "Otimização e revitalização de materiais e interfaces existentes. Elevamos o padrão com visão crítica e tecnologia.",
    image: assetPath("/images/services/redesign.png"),
  },
  {
    title: "Materiais gráficos",
    description:
      "Design visual impactante para flyers, banners e mais. Soluções criativas com foco em eficiência e propósito.",
    image: assetPath("/images/services/materiais-graficos.png"),
  },
  {
    title: "Editoração",
    description:
      "Formatação de conteúdos extensos, e-books e manuais para uma leitura clara e profissional.",
    image: assetPath("/images/services/editoracao.png"),
  },
  {
    title: "Identidade visual",
    description:
      "Construção do coração da sua marca. Criamos sistemas visuais que comunicam valor, essência e conexão duradoura.",
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
