import type { Json } from "@/lib/supabase/database.types";

type Node = { type?: string; text?: string; attrs?: Record<string, Json | undefined>; content?: Node[] };

function renderNode(node: Node, key: number | string): React.ReactNode {
  if (node.type === "text") return node.text ?? "";
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

export function ModularContent({ value }: { value: Json }) {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const root = value as Node;
  return <div className="case-content">{root.content?.map((node, index) => renderNode(node, index))}</div>;
}
