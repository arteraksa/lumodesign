import type { Json } from "@/lib/supabase/database.types";

export type RichTextDocument = { type: "doc"; content: RichTextNode[] };
type RichTextMark = { type: "bold" | "italic" | "underline" | "strike" | "link"; attrs?: { href?: string; target?: string } };
type RichTextNode = { type: "text" | "paragraph" | "heading" | "bulletList" | "orderedList" | "listItem" | "blockquote" | "hardBreak"; text?: string; attrs?: { level?: number }; marks?: RichTextMark[]; content?: RichTextNode[] };

const allowedNodeTypes = new Set<RichTextNode["type"]>(["text", "paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "hardBreak"]);
const allowedMarkTypes = new Set<RichTextMark["type"]>(["bold", "italic", "underline", "strike", "link"]);

function legacyTextDocument(value: string): RichTextDocument {
  return { type: "doc", content: value.replace(/<[^>]*>/g, "").split(/\r?\n+/).map((line) => line.trim()).filter(Boolean).map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })) };
}

function normalizeMark(value: unknown): RichTextMark | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { type?: unknown; attrs?: unknown };
  if (typeof raw.type !== "string" || !allowedMarkTypes.has(raw.type as RichTextMark["type"])) return null;
  if (raw.type !== "link") return { type: raw.type as Exclude<RichTextMark["type"], "link"> };
  const attrs = raw.attrs && typeof raw.attrs === "object" ? raw.attrs as { href?: unknown; target?: unknown } : {};
  return typeof attrs.href === "string" ? { type: "link", attrs: { href: attrs.href, target: attrs.target === "_blank" ? "_blank" : undefined } } : null;
}

function normalizeNode(value: unknown): RichTextNode | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { type?: unknown; text?: unknown; content?: unknown; attrs?: unknown; marks?: unknown };
  if (typeof raw.type !== "string" || !allowedNodeTypes.has(raw.type as RichTextNode["type"])) return null;
  if (raw.type === "text") {
    if (typeof raw.text !== "string") return null;
    const marks = Array.isArray(raw.marks) ? raw.marks.map(normalizeMark).filter((mark): mark is RichTextMark => Boolean(mark)) : undefined;
    return { type: "text", text: raw.text, ...(marks?.length ? { marks } : {}) };
  }
  if (raw.type === "hardBreak") return { type: "hardBreak" };
  const content = Array.isArray(raw.content) ? raw.content.map(normalizeNode).filter((node): node is RichTextNode => Boolean(node)) : [];
  const attrs = raw.type === "heading" ? { level: raw.attrs && typeof raw.attrs === "object" && (raw.attrs as { level?: unknown }).level === 3 ? 3 : 2 } : undefined;
  return { type: raw.type as Exclude<RichTextNode["type"], "text" | "hardBreak">, ...(attrs ? { attrs } : {}), content };
}

export function documentFromStoredContent(value: string | null | undefined): RichTextDocument {
  const source = value?.trim() ?? "";
  if (!source) return { type: "doc", content: [] };
  try {
    const parsed = JSON.parse(source) as { type?: unknown; content?: unknown };
    if (parsed.type === "doc" && Array.isArray(parsed.content)) return { type: "doc", content: parsed.content.map(normalizeNode).filter((node): node is RichTextNode => Boolean(node)) };
  } catch { /* Conteúdo legado em texto simples. */ }
  return legacyTextDocument(source);
}

export function documentHasText(value: string | null | undefined) {
  const visit = (nodes: RichTextNode[]): boolean => nodes.some((node) => Boolean(node.text?.trim()) || Boolean(node.content && visit(node.content)));
  return visit(documentFromStoredContent(value).content);
}

export function serializeRichTextDocument(document: unknown) { return JSON.stringify(document); }
export function richTextDocumentJson(value: string | null | undefined): Json { return documentFromStoredContent(value) as Json; }
