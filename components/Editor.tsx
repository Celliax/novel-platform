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
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("이미지 URL", "https://");
          if (!url) return;
          editor.chain().focus().setImage({ src: url }).run();
        }}
        className="px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors hover:bg-border/60"
      >
        이미지
      </button>
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
      Image.configure({ inline: false, allowBase64: true }),
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
