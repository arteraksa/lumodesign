import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { CASES_CACHE_TAG } from "@/lib/queries/cases";
import { portfolioPathsForSlugs } from "@/lib/portfolio/revalidation";

const payloadSchema = z.object({
  tag: z.literal(CASES_CACHE_TAG).default(CASES_CACHE_TAG),
  slugs: z.array(z.string().min(1).max(140)).max(4).default([]),
});

export async function POST(request: Request) {
  const expected = process.env.REVALIDATION_SECRET;
  const provided = request.headers.get("x-revalidation-secret");
  if (!expected || provided !== expected) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const payload = payloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!payload.success) return Response.json({ error: "Payload inválido" }, { status: 400 });
  revalidateTag(payload.data.tag, "max");
  portfolioPathsForSlugs(...payload.data.slugs).forEach((path) => revalidatePath(path));
  return Response.json({ revalidated: true, tag: payload.data.tag });
}
