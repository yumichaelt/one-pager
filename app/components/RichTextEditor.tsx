'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect } from 'react';

// Define the props interface
interface TiptapProps {
  content: any;
  onChange: (richText: any) => void;
}

export const TiptapEditor = ({ content, onChange }: TiptapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true, // Allows checklists to be indented
      }),
    ],
    content: content,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor) {
        const isSame = JSON.stringify(editor.getJSON()) === JSON.stringify(content);
        if (!isSame) {
            editor.commands.setContent(content, false);
        }
    }
  }, [content, editor]);

  return (
    <>
      {editor && <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center space-x-1 bg-slate-800 text-white p-1 rounded-lg shadow-lg">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-slate-600 p-2 rounded' : 'p-2'}>Bold</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-slate-600 p-2 rounded' : 'p-2'}>Italic</button>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-slate-600 p-2 rounded' : 'p-2'}>List</button>
          <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={editor.isActive('taskList') ? 'bg-slate-600 p-2 rounded' : 'p-2'}>Tasks</button>
        </div>
      </BubbleMenu>}
      
      <EditorContent editor={editor} />
    </>
  );
};
