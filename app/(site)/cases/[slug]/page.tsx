import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ModularContent } from "@/components/content/ModularContent";
import type { PortfolioCase, PortfolioCaseMedia } from "@/lib/supabase/database.types";
import { getPublishedCaseResolution, getPublishedCases } from "@/lib/queries/cases";
import { siteConfig } from "@/lib/content/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";

export async function generateStaticParams() {
  return [
    { slug: "impresul" },
    { slug: "magnus" },
    { slug: "tri-rs" }
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getPublishedCaseResolution(slug);
  if (!item) return { title: "Case não encontrado" };
  return {
    title: item.seo_title || item.title,
    description: item.seo_description || item.excerpt || siteConfig.description,
    alternates: { canonical: `/cases/${item.slug}` },
    openGraph: item.cover_url ? { images: [{ url: item.cover_url }] } : undefined,
  };
}

function mediaUrl(media: PortfolioCaseMedia) {
  if (media.source_url) return media.source_url;
  if (!media.storage_bucket || !media.storage_path) return "";
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${media.storage_bucket}/${media.storage_path}`;
}

function CaseDirection({ item, direction }: { item?: PortfolioCase; direction: "previous" | "next" }) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "Anterior" : "Próximo";

  if (!item) return <div className="case-study__direction case-study__direction--empty" aria-label={`${label} indisponível`} />;

  return (
    <Link className="case-study__direction" href={`/cases/${item.slug}`}>
      <div className="case-study__direction-cover">
        {item.cover_url ? <Image src={item.cover_url} alt="" fill sizes="(max-width: 809px) 44vw, 11vw" /> : null}
      </div>
      <span className="case-study__direction-title">{item.title}</span>
      <span className="case-study__direction-action">{label}</span>
    </Link>
  );
}

export default async function CaseDetailPage({ params }: Props) {
  const { slug } = await params;
  const [{ item, legacySlug }, publishedCases] = await Promise.all([getPublishedCaseResolution(slug), getPublishedCases()]);
  if (!item) notFound();
  if (legacySlug) permanentRedirect(`/cases/${item.slug}`);
  const gallery = [...(item.portfolio_case_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const currentIndex = publishedCases.findIndex((entry) => entry.id === item.id);
  const previousCase = currentIndex > 0 ? publishedCases[currentIndex - 1] : undefined;
  const nextCase = currentIndex >= 0 && currentIndex < publishedCases.length - 1 ? publishedCases[currentIndex + 1] : undefined;

  return (
    <main id="conteudo" className="case-study-page">
      <aside className="case-study__sidebar" aria-label={`Informações sobre ${item.title}`}>
        <section className="case-study__details">
          <div className="case-study__title-row">
            <Link className="case-study__back" href="/cases" aria-label="Voltar para a página de cases"><ChevronLeft aria-hidden="true" size={16} /></Link>
            <h1>{item.title}</h1>
          </div>
          {item.categories.length ? <div className="case-study__badges" aria-label="Categorias do projeto">{item.categories.map((category) => <span className="badge" key={category}>{category}</span>)}</div> : null}
          <div className="case-study__divider" />
          <div className="case-study__description-scroll">
            <ModularContent value={item.content_json} className="case-study__description" />
          </div>
        </section>
        <nav className="case-study__directions" aria-label="Navegação entre cases">
          <CaseDirection item={previousCase} direction="previous" />
          <CaseDirection item={nextCase} direction="next" />
        </nav>
      </aside>
      <section className="case-study__gallery" aria-label={`Imagens do case ${item.title}`}>
        {gallery.length ? gallery.map((media) => {
          const src = mediaUrl(media);
          return src && media.media_type === "image" ? <figure key={media.id} className="case-study__image"><Image src={src} alt={media.alt_text || `Imagem do projeto ${item.title}`} width={media.width ?? 1600} height={media.height ?? 1000} priority={media.sort_order === 0} sizes="(max-width: 809px) 100vw, 68vw" />{media.caption ? <figcaption>{media.caption}</figcaption> : null}</figure> : null;
        }) : <div className="case-study__empty-gallery"><p>As imagens deste projeto serão adicionadas em breve.</p></div>}
      </section>
    </main>
  );
}
