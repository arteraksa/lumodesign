import { ImageOff } from "lucide-react";
import Image from "next/image";
import type { PortfolioCase } from "@/lib/supabase/database.types";

export function CaseTableIdentity({ item, coverPreviewUrl }: { item: PortfolioCase; coverPreviewUrl: string }) {
  return <a className="admin-case-identity" href={`/admin/cases/${item.id}/edit`}>{coverPreviewUrl ? <Image className="admin-case-cover" src={coverPreviewUrl} alt="" aria-hidden="true" width={88} height={56} unoptimized /> : <span className="admin-case-cover admin-case-cover--empty" aria-hidden="true"><ImageOff size={16} /></span>}<span><strong>{item.title}</strong><small>/{item.slug}</small></span></a>;
}
