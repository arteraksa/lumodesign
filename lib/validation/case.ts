import { z } from "zod";

/** Legacy defaults used until the category registry is available. */
export const caseCategories = ["Branding", "Desenvolvimento", "Editorial", "UI/UX Design"] as const;

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\//i.test(value), "Informe uma URL HTTP(S) válida.");

const optionalDateTime = z.preprocess((value) => {
  if (!value) return null;
  const text = String(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) {
    return new Date(text).toISOString();
  }
  return text;
}, z.string().datetime().nullable().optional());

export const caseSchema = z.object({
  id: z.string().uuid().optional(),
  version: z.coerce.number().int().positive().optional(),
  title: z.string().trim().max(120, "O título pode ter no máximo 120 caracteres."),
  slug: z
    .string()
    .trim()
    .max(140, "O slug pode ter no máximo 140 caracteres.")
    .refine((value) => !value || /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value), "Use letras, números e hífens."),
  client_name: z.string().trim().max(120, "O nome do cliente pode ter no máximo 120 caracteres.").default(""),
  categories: z.array(z.string().trim().min(1, "Escolha uma categoria válida.").max(80, "O nome da categoria é muito longo.")).max(6, "Escolha no máximo 6 categorias.").default([]),
  excerpt: z.string().trim().max(320, "A descrição curta pode ter no máximo 320 caracteres.").default(""),
  content_html: z.string().max(200_000, "O conteúdo está muito longo. Reduza o texto antes de salvar.").default(""),
  cover_url: optionalUrl.default(""),
  external_url: optionalUrl.default(""),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured_on_home: z.boolean().default(false),
  home_order: z.coerce.number().int().min(0).max(9999).default(999),
  portfolio_order: z.coerce.number().int().min(0).max(9999).default(999),
  seo_title: z.string().trim().max(70, "O título usado nos buscadores pode ter no máximo 70 caracteres.").default(""),
  seo_description: z.string().trim().max(170, "A descrição usada nos buscadores pode ter no máximo 170 caracteres.").default(""),
  published_at: optionalDateTime,
}).superRefine((value, context) => {
  if (value.status !== "published") return;
  if (value.title.length < 2) {
    context.addIssue({ code: "custom", path: ["title"], message: "Informe um título com pelo menos 2 caracteres para publicar." });
  }
  if (value.slug.length < 2) {
    context.addIssue({ code: "custom", path: ["slug"], message: "Informe um slug com pelo menos 2 caracteres para publicar." });
  }
  if (value.categories.length === 0) {
    context.addIssue({ code: "custom", path: ["categories"], message: "Selecione ao menos uma categoria para publicar." });
  }
  if (!value.content_html.trim()) {
    context.addIssue({ code: "custom", path: ["content_html"], message: "Preencha o conteúdo antes de publicar." });
  }
});

export type CaseInput = z.infer<typeof caseSchema>;

export const caseClientSchema = z.object({
  title: z.string().trim().max(120, "O título pode ter no máximo 120 caracteres."),
  slug: z.string().trim().max(140, "O slug pode ter no máximo 140 caracteres.").refine((value) => !value || /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value), "Use letras, números e hífens."),
  client_name: z.string().max(120, "O nome do cliente pode ter no máximo 120 caracteres."),
  categories: z.string().max(480, "Escolha no máximo 6 categorias."),
  excerpt: z.string().max(320, "A descrição curta pode ter no máximo 320 caracteres."),
  content_html: z.string().max(200_000, "O conteúdo está muito longo. Reduza o texto antes de salvar."),
  cover_url: optionalUrl,
  external_url: optionalUrl,
  status: z.enum(["draft", "published", "archived"]),
  home_order: z.number().int().min(0),
  portfolio_order: z.number().int().min(0),
  seo_title: z.string().max(70, "O título usado nos buscadores pode ter no máximo 70 caracteres."),
  seo_description: z.string().max(170, "A descrição usada nos buscadores pode ter no máximo 170 caracteres."),
  published_at: z.string().max(40).optional(),
}).superRefine((value, context) => {
  if (value.status !== "published") return;
  if (value.title.length < 2) {
    context.addIssue({ code: "custom", path: ["title"], message: "Informe um título com pelo menos 2 caracteres para publicar." });
  }
  if (value.slug.length < 2) {
    context.addIssue({ code: "custom", path: ["slug"], message: "Informe um slug com pelo menos 2 caracteres para publicar." });
  }
  if (!value.categories.split(",").some((item) => item.trim())) {
    context.addIssue({ code: "custom", path: ["categories"], message: "Selecione ao menos uma categoria para publicar." });
  }
  if (!value.content_html.trim()) {
    context.addIssue({ code: "custom", path: ["content_html"], message: "Preencha o conteúdo antes de publicar." });
  }
});

export type CaseClientInput = z.infer<typeof caseClientSchema>;

export function caseInputFromFormData(formData: FormData, allowedCategories?: readonly string[]): CaseInput {
  const parsed = caseSchema.parse({
    id: formData.get("id") || undefined,
    version: formData.get("version") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    client_name: formData.get("client_name") ?? "",
    categories: String(formData.get("categories") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    excerpt: formData.get("excerpt") ?? "",
    content_html: formData.get("content_html") ?? "",
    cover_url: formData.get("cover_url") ?? "",
    external_url: formData.get("external_url") ?? "",
    status: formData.get("status") ?? "draft",
    featured_on_home: formData.get("featured_on_home") === "on",
    home_order: formData.get("home_order") ?? 999,
    portfolio_order: formData.get("portfolio_order") ?? 999,
    seo_title: formData.get("seo_title") ?? "",
    seo_description: formData.get("seo_description") ?? "",
    published_at: formData.get("published_at") || null,
  });
  if (allowedCategories) {
    const unavailable = parsed.categories.filter((category) => !allowedCategories.includes(category));
    if (unavailable.length) throw new Error(`Categorias indisponíveis: ${unavailable.join(", ")}. Atualize a página e tente novamente.`);
  }
  return parsed;
}
