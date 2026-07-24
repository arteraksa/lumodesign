import DOMPurify from "dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "h2", "h3", "strong", "em", "ul", "ol", "li", "a", "br"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style", "onerror", "onclick", "onload"],
  }).replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');
}

export function textFromHtml(html: string): string {
  const node = document.createElement("div");
  node.innerHTML = sanitizeHtml(html);
  return node.textContent || "";
}
