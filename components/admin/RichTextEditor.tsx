"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Strikethrough, Underline as UnderlineIcon } from "lucide-react";
import { documentFromStoredContent, serializeRichTextDocument } from "@/lib/content/rich-text";

type EditorAction = "bold" | "italic" | "strike" | "underline" | "bulletList" | "orderedList";
const controls: Array<{ action: EditorAction; label: string; icon: typeof Bold }> = [
  { action: "bold", label: "Negrito", icon: Bold }, { action: "italic", label: "Itálico", icon: Italic }, { action: "strike", label: "Tachado", icon: Strikethrough }, { action: "underline", label: "Sublinhado", icon: UnderlineIcon }, { action: "bulletList", label: "Lista com tópicos", icon: List }, { action: "orderedList", label: "Lista numerada", icon: ListOrdered },
];

export function RichTextEditor({ value, onChange, invalid = false }: { value: string; onChange: (value: string) => void; invalid?: boolean }) {
  const editor = useEditor({ immediatelyRender: false, extensions: [StarterKit], content: documentFromStoredContent(value), editorProps: { attributes: { "aria-describedby": "case-content-help", "aria-invalid": String(invalid), "aria-label": "Descrição do case", "data-testid": "case-content" } }, onUpdate: ({ editor: currentEditor }) => onChange(serializeRichTextDocument(currentEditor.getJSON())) });
  if (!editor) return null;
  return <div className={`admin-rich-text ${invalid ? "form-field-error" : ""}`}><div className="admin-rich-text__toolbar" role="toolbar" aria-label="Formatação do texto">{controls.map(({ action, label, icon: Icon }) => <button key={action} type="button" title={label} aria-label={label} aria-pressed={editor.isActive(action)} onMouseDown={(event) => event.preventDefault()} onClick={() => {
    const chain = editor.chain().focus();
    if (action === "bold") chain.toggleBold().run();
    if (action === "italic") chain.toggleItalic().run();
    if (action === "strike") chain.toggleStrike().run();
    if (action === "underline") chain.toggleUnderline().run();
    if (action === "bulletList") chain.toggleBulletList().run();
    if (action === "orderedList") chain.toggleOrderedList().run();
  }}><Icon size={16} strokeWidth={2} /></button>)}</div><EditorContent editor={editor} /></div>;
}
