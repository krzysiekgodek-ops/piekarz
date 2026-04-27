import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const ACCENT = '#c8860a';

const ToolBtn = ({ active, onClick, title, children }) => (
  <button
    type="button"
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
      active
        ? 'text-white'
        : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--bg-input)]'
    }`}
    style={active ? { background: ACCENT } : {}}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px self-stretch bg-[var(--border)] mx-0.5" />;

const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  return (
    <div className="border-2 border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg)]">
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-[var(--border)]">
        <ToolBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Pogrubienie"
        >
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Kursywa"
        >
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Podkreślenie"
        >
          <UnderlineIcon size={14} />
        </ToolBtn>

        <Divider />

        <ToolBtn
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Nagłówek H1"
        >
          <span className="text-[11px] font-black">H1</span>
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Nagłówek H2"
        >
          <span className="text-[11px] font-black">H2</span>
        </ToolBtn>

        <Divider />

        <ToolBtn
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista punktowana"
        >
          <List size={14} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerowana"
        >
          <ListOrdered size={14} />
        </ToolBtn>

        <Divider />

        <ToolBtn
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Do lewej"
        >
          <AlignLeft size={14} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Wyśrodkuj"
        >
          <AlignCenter size={14} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Do prawej"
        >
          <AlignRight size={14} />
        </ToolBtn>
      </div>

      <EditorContent
        editor={editor}
        className="rich-editor min-h-[8rem] p-4 text-sm"
      />
    </div>
  );
};

export default RichTextEditor;
