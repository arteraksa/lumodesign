import type { Json } from "@/lib/supabase/database.types";

type Mark = { type?: string; attrs?: Record<string, Json | undefined> };
type Node = { type?: string; text?: string; attrs?: Record<string, Json | undefined>; content?: Node[]; marks?: Mark[] };

function safeHref(value: Json | undefined) {
  if (typeof value !== "string") return undefined;
  return /^(https?:\/\/|mailto:|\/)/i.test(value) ? value : undefined;
}

function renderText(node: Node, key: number | string) {
  const value = node.text ?? "";
  return (node.marks ?? []).reduce<React.ReactNode>((content, mark, index) => {
    const markKey = `${key}-mark-${index}`;
    switch (mark.type) {
      case "bold": return <strong key={markKey}>{content}</strong>;
      case "italic": return <em key={markKey}>{content}</em>;
      case "underline": return <u key={markKey}>{content}</u>;
      case "strike": return <s key={markKey}>{content}</s>;
      case "link": {
        const href = safeHref(mark.attrs?.href);
        return href ? <a key={markKey} href={href} target={mark.attrs?.target === "_blank" ? "_blank" : undefined} rel="noreferrer">{content}</a> : content;
      }
      default: return content;
    }
  }, value);
}

function renderNode(node: Node, key: number | string): React.ReactNode {
  if (node.type === "text") return renderText(node, key);
  if (node.type === "hardBreak") return <br key={key} />;
  const children = node.content?.map((child, index) => renderNode(child, `${key}-${index}`));
  switch (node.type) {
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      return level === 3 ? <h3 key={key}>{children}</h3> : <h2 key={key}>{children}</h2>;
    }
    case "paragraph": return <p key={key}>{children}</p>;
    case "bulletList": return <ul key={key}>{children}</ul>;
    case "orderedList": return <ol key={key}>{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "blockquote": return <blockquote key={key}>{children}</blockquote>;
    default: return <div key={key}>{children}</div>;
  }
}

export function ModularContent({ value, className = "" }: { value: Json; className?: string }) {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const root = value as Node;
  return <div className={`case-content ${className}`.trim()}>{root.content?.map((node, index) => renderNode(node, index))}</div>;
}
