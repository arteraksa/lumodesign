import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ModularContent } from "@/components/content/ModularContent";
import { getPublishedCaseResolution } from "@/lib/queries/cases";
import { siteConfig } from "@/lib/content/site";

type Props = { params: Promise<{ slug: string }> };

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

export default async function CaseDetailPage({ params }: Props) {
  const { slug } = await params;
  const { item, legacySlug } = await getPublishedCaseResolution(slug);
  if (!item) notFound();
  if (legacySlug) permanentRedirect(`/cases/${item.slug}`);
  const gallery = [...(item.portfolio_case_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <main id="conteudo" className="case-page">
      <Container>
        <header className="case-page__header">
          <p className="section-label">{item.categories.join(" · ") || "Case"}</p>
          <h1>{item.title}</h1>
          <p>{item.excerpt}</p>
          {item.client_name ? <dl><div><dt>Cliente</dt><dd>{item.client_name}</dd></div></dl> : null}
        </header>
        {item.cover_url ? <div className="case-page__cover"><Image src={item.cover_url} alt={`Capa do case ${item.title}`} fill priority sizes="100vw" /></div> : null}
        <ModularContent value={item.content_json} />
        {gallery.length ? <div className="case-gallery">{gallery.map((media) => {
          const src = media.source_url || (media.storage_bucket && media.storage_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${media.storage_bucket}/${media.storage_path}` : "");
          return src && media.media_type === "image" ? <figure key={media.id}><Image src={src} alt={media.alt_text || item.title} width={media.width ?? 1600} height={media.height ?? 1000} sizes="100vw" /><figcaption>{media.caption}</figcaption></figure> : null;
        })}</div> : null}
      </Container>
    </main>
  );
}
