"use client";

import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface EditorProps {
  value: string;
  onChange: (content: string) => void;
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const TARGET_W = 800; // 본문 삽화는 800px로 최적화
        const ratio = img.height / img.width;
        canvas.width = Math.min(img.width, TARGET_W);
        canvas.height = canvas.width * ratio;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-canvas rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors ${
          editor.isActive("bold") ? "bg-brand-100 text-brand-800" : "hover:bg-border/60"
        }`}
      >
        굵게
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors ${
          editor.isActive("italic") ? "bg-brand-100 text-brand-800" : "hover:bg-border/60"
        }`}
      >
        기울임
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors ${
          editor.isActive("underline") ? "bg-brand-100 text-brand-800" : "hover:bg-border/60"
        }`}
      >
        밑줄
      </button>
      <span className="w-px bg-border mx-1 self-stretch my-1" aria-hidden />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors ${
          editor.isActive("heading", { level: 2 }) ? "bg-brand-100 text-brand-800" : "hover:bg-border/60"
        }`}
      >
        소제목
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors ${
          editor.isActive("bulletList") ? "bg-brand-100 text-brand-800" : "hover:bg-border/60"
        }`}
      >
        목록
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors ${
          editor.isActive("orderedList") ? "bg-brand-100 text-brand-800" : "hover:bg-border/60"
        }`}
      >
        번호
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors ${
          editor.isActive("blockquote") ? "bg-brand-100 text-brand-800" : "hover:bg-border/60"
        }`}
      >
        인용
      </button>
      <button
        type="button"
        onClick={() => {
          const previous = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("링크 URL", previous ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
        className={`px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors ${
          editor.isActive("link") ? "bg-brand-100 text-brand-800" : "hover:bg-border/60"
        }`}
      >
        링크
      </button>
      <div className="relative flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            const input = document.getElementById('editor-image-upload') as HTMLInputElement;
            input?.click();
          }}
          className="px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors hover:bg-border/60"
        >
          삽화
        </button>
        <input
          id="editor-image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {editor.isActive("image") && (
          <div className="flex items-center gap-1 ml-1 bg-border/40 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => editor.chain().focus().updateAttributes("image", { width: "100%" }).run()}
              className="px-1.5 py-0.5 text-[10px] bg-white rounded shadow-sm hover:bg-gray-50"
            >
              꽉차게
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().updateAttributes("image", { width: "50%" }).run()}
              className="px-1.5 py-0.5 text-[10px] bg-white rounded shadow-sm hover:bg-gray-50"
            >
              중간
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().updateAttributes("image", { width: "25%" }).run()}
              className="px-1.5 py-0.5 text-[10px] bg-white rounded shadow-sm hover:bg-gray-50"
            >
              작게
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RichTextEditor({ value, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      LinkExt.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: "100%",
              renderHTML: (attributes) => ({
                style: `width: ${attributes.width}; height: auto; max-width: 100%; display: block; margin: 0 auto;`,
              }),
            },
          };
        },
      }).configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: "여기에 소설을 써주세요..." }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "novel-editor tiptap ProseMirror",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "<p></p>";
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="novel-editor-shell bg-surface rounded-xl shadow-card ring-1 ring-border/60 overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
