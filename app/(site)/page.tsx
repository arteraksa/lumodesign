import { Hero } from "@/sections/Hero";
import { Services } from "@/sections/Services";
import { Cases } from "@/sections/Cases";
import { Process } from "@/sections/Process";
import { Faq } from "@/sections/Faq";
import { Contact } from "@/sections/Contact";
import { LandingBackground } from "@/components/effects/LandingBackground";
import { getFeaturedCases } from "@/lib/queries/cases";

export default async function HomePage() {
  const cases = await getFeaturedCases();
  return (
    <main id="conteudo" className="home-page">
      <LandingBackground />
      <Hero />
      <Services />
      <Cases cases={cases} />
      <Process />
      <Faq />
      <Contact />
    </main>
  );
}
