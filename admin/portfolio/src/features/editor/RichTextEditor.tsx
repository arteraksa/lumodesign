import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import { useEffect } from "react";
import { sanitizeHtml } from "@/lib/validation/html";

export function RichTextEditor({
  value,
  html,
  onChange,
}: {
  value: unknown;
  html: string;
  onChange: (json: unknown, html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: (value as object) || html || "<p></p>",
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getJSON(), sanitizeHtml(instance.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value);
    if (next && current !== next) editor.commands.setContent(value as never);
  }, [editor, value]);

  if (!editor) return <div className="state-line">Carregando editor...</div>;

  function setLink() {
    const previous = editor?.getAttributes("link").href || "";
    const url = window.prompt("URL do link", previous);
    if (url === null) return;
    if (!url) editor?.chain().focus().unsetLink().run();
    else if (/^(https?:\/\/|mailto:)/i.test(url)) editor?.chain().focus().setLink({ href: url }).run();
    else alert("Use apenas HTTP, HTTPS ou mailto.");
  }

  return (
    <section className="rich-editor-section">
      <div className="editor-toolbar" role="toolbar" aria-label="Ferramentas de texto">
        <button className={editor.isActive("heading", { level: 2 }) ? "active" : ""} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button className={editor.isActive("heading", { level: 3 }) ? "active" : ""} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button className={editor.isActive("bold") ? "active" : ""} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito"><Bold size={16} /></button>
        <button className={editor.isActive("italic") ? "active" : ""} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italico"><Italic size={16} /></button>
        <button className={editor.isActive("bulletList") ? "active" : ""} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista"><List size={16} /></button>
        <button className={editor.isActive("orderedList") ? "active" : ""} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista ordenada"><ListOrdered size={16} /></button>
        <button className={editor.isActive("link") ? "active" : ""} onClick={setLink} title="Link"><LinkIcon size={16} /></button>
        <button onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 size={16} /></button>
        <button onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 size={16} /></button>
      </div>
      <EditorContent editor={editor} className="tiptap-surface" data-testid="case-content-editor" />
      <div className="content-preview">
        <h3>Preview do conteudo</h3>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
      </div>
    </section>
  );
}
