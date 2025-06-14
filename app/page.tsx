"use client";

import { useState, ChangeEvent, useRef, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ContentAnalysisWidget from "./components/ContentAnalysisWidget";
import { useContentAnalysis } from "../hooks/useContentAnalysis";
import { DocumentContent, Suggestion } from "../lib/content-analysis";

type Block = {
  id: string;
  title: string;
  content: string;
}

type EditableBlockProps = {
    block: Block;
    onUpdate: (id: string, newBlock: Partial<Block>) => void;
    onDelete: (id:string) => void;
    onAddAfter: (id: string) => void;
};

const SortableEditableBlock = ({ block, onUpdate, onDelete, onAddAfter }: EditableBlockProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id: block.id});
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const [menuOpen, setMenuOpen] = useState(false);
    const [isAiMenuOpen, setAiMenuOpen] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleUpdate = (key: 'title' | 'content', value: string) => {
        onUpdate(block.id, { [key]: value });
        setMenuOpen(false);
    };

    const handleRename = () => {
        titleInputRef.current?.focus();
        setMenuOpen(false);
    };

    const handleDelete = () => {
        onDelete(block.id);
        setMenuOpen(false);
    };
    
    const handleAIAction = (action: string) => {
        setMenuOpen(false);
        setAiMenuOpen(false);
        setIsAiLoading(true);

        setTimeout(() => {
            const refinedContent = generateFakeAIResponse(action, block.content);
            onUpdate(block.id, { content: refinedContent });
            setIsAiLoading(false);
        }, 1500);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <div ref={setNodeRef} style={style} className="group flex items-start py-1 w-full">
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2 pt-2">
                <button onClick={() => onAddAfter(block.id)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
                </button>
                 <button {...attributes} {...listeners} className="p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-grab">
                   <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path>
                   </svg>
                </button>
            </div>
            <div className="flex-grow relative">
                {isAiLoading && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center rounded-md z-10">
                        <div className="flex items-center space-x-2 text-gray-600">
                            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>AI is thinking...</span>
                        </div>
                    </div>
                )}
                 <input
                    ref={titleInputRef}
                    type="text"
                    value={block.title}
                    onChange={(e) => handleUpdate('title', e.target.value)}
                    placeholder="Section Title"
                    className="w-full text-2xl font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-gray-100 rounded-md p-1"
                />
                 <textarea
                    value={block.content}
                    onChange={(e) => handleUpdate('content', e.target.value)}
                    placeholder="Start writing here..."
                    className="w-full mt-1 p-1 text-gray-700 bg-transparent focus:outline-none focus:bg-gray-100 rounded-md resize-none"
                    rows={3}
                />
            </div>
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity pl-2 pt-2">
                <div className="relative" ref={menuRef}>
                     <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ><path d="M5 10C3.9 10 3 10.9 3 12C3 13.1 3.9 14 5 14C6.1 14 7 13.1 7 12C7 10.9 6.1 10 5 10ZM19 10C17.9 10 17 10.9 17 12C17 13.1 17.9 14 19 14C20.1 14 21 13.1 21 12C21 10.9 20.1 10 19 10ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z"></path></svg>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                           <button onClick={handleRename} className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Rename</button>
                           <div className="relative" onMouseEnter={() => setAiMenuOpen(true)} onMouseLeave={() => setAiMenuOpen(false)}>
                               <button className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex justify-between items-center">
                                   <span>Refine with AI</span>
                                   <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                               {isAiMenuOpen && (
                                   <div className="absolute left-full -top-1 mt-0 w-48 bg-white rounded-md shadow-lg z-20 border">
                                       {getAIActions(block.title).map(action => (
                                           <button key={action} onClick={() => handleAIAction(action)} className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{action}</button>
                                       ))}
                                   </div>
                               )}
                           </div>
                           <button onClick={handleDelete} className="text-left w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const getAIActions = (title: string): string[] => {
    const lowerCaseTitle = title.toLowerCase();
    const defaultActions = ["Improve Writing", "Make More Concise"];

    let specificActions: string[] = [];
    if (lowerCaseTitle.includes('problem')) {
        specificActions = ["Clarify Problem", "Expand on Impact", "Suggest Metrics"];
    } else if (lowerCaseTitle.includes('solution')) {
        specificActions = ["Strengthen Solution", "Outline Implementation Steps", "Estimate Effort"];
    }
    
    return [...specificActions, ...defaultActions];
}

const generateFakeAIResponse = (action: string, originalContent: string): string => {
    const templates: { [key: string]: string } = {
        "Clarify Problem": `To better clarify the problem, let's reframe it. The core issue is not just a cluttered UI, but the resulting high cognitive load on users, which directly causes the 20% engagement drop. By focusing on "reducing cognitive load," we can set a clearer design target.`,
        "Expand on Impact": `The 20% drop in engagement has cascading negative effects. It means lower user retention, reduced ad revenue, and a weakened market position against competitors. A revitalized UI would not only recover this loss but could also attract a new user segment, boosting overall growth.`,
        "Suggest Metrics": `To measure success, we should track: 1. User Engagement Rate (increase from X% to Y%), 2. Task Completion Time (reduce by Z seconds), 3. User Satisfaction Score (via in-app surveys), and 4. App Store Ratings (improve from A to B stars).`,
        "Strengthen Solution": `To strengthen the solution, we should incorporate user-centric design principles. Let's add A/B testing for key UI elements, conduct usability testing with a target user group before full rollout, and build in an analytics framework to monitor post-launch performance.`,
        "Outline Implementation Steps": `Here is a phased implementation plan:\n1. **Phase 1 (2 weeks):** Wireframing and Prototyping\n2. **Phase 2 (4 weeks):** UI/UX Design and Asset Creation\n3. **Phase 3 (6 weeks):** Frontend and Backend Development\n4. **Phase 4 (2 weeks):** Testing and Deployment`,
        "Estimate Effort": `Based on the proposed plan, the estimated effort is approximately 8-10 developer weeks. This includes design, development, and testing, assuming a team of two engineers and one designer.`,
        "Improve Writing": `The current mobile application's user interface is convoluted, which has resulted in a significant 20% decrease in user engagement. We need a strategic overhaul to improve the user experience.`,
        "Make More Concise": `A cluttered mobile UI has led to a 20% drop in user engagement.`
    };

    return templates[action] || `Here's a refined version of your content:\n\n"${originalContent}"`;
}

const PageTitleBlock = ({ block, onUpdate }: { block: Block; onUpdate: (id: string, newBlock: Partial<Block>) => void; }) => (
     <input
        type="text"
        value={block.title}
        onChange={(e) => onUpdate(block.id, { title: e.target.value })}
        placeholder="Untitled"
        className="w-full text-4xl font-bold text-gray-800 bg-transparent focus:outline-none resize-none placeholder-gray-400 focus:bg-gray-100 rounded-md p-1"
    />
);

export default function Home() {
    const [blocks, setBlocks] = useState<Block[]>([
    {
      id: 'title',
      title: "One-Pager Title",
      content: "",
    },
    {
      id: uuidv4(),
      title: "Problem Statement",
      content: "Our current mobile app has a cluttered user interface, leading to a 20% drop-off in user engagement.",
    },
    {
      id: uuidv4(),
      title: "Proposed Solution",
      content: "A complete redesign of the mobile app with a focus on intuitive navigation, a minimalist aesthetic, and personalized content discovery.",
    }
  ]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleBlockUpdate = (id: string, newBlockData: Partial<Block>) => {
    setBlocks(prevBlocks => prevBlocks.map(block => {
        if (block.id === id) {
            return { ...block, ...newBlockData };
        }
        return block;
    }));
  };

  const handleAddBlockAfter = (afterId: string) => {
    const newBlock: Block = {
        id: uuidv4(),
        title: "New Section",
        content: "",
    };
    const index = blocks.findIndex(b => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  }

  const handleDeleteBlock = (id: string) => {
    if (blocks.length > 2) { // Always keep title and at least one content block
        setBlocks(blocks.filter(block => block.id !== id));
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        if (items[oldIndex].id === 'title' || (over && items[newIndex].id === 'title')) {
            return items; // Prevent reordering with the title
        }
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems;
      });
    }
  }

  const pageTitle = blocks.find(b => b.id === 'title')!;
  const contentBlocks = blocks.filter(b => b.id !== 'title');

  const documentForAnalysis = useMemo(() => ({
    title: pageTitle.title,
    blocks: contentBlocks.map(block => ({
        id: block.id,
        type: block.title, // Using section title as 'type'
        content: block.content,
    }))
  }), [blocks]);

  const suggestions = useContentAnalysis(documentForAnalysis);

  return (
    <main className="container mx-auto px-6 py-12 flex justify-center">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl w-full max-w-4xl">
        <div className="space-y-6">
            <PageTitleBlock block={pageTitle} onUpdate={handleBlockUpdate} />
            {isMounted && <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={contentBlocks} strategy={verticalListSortingStrategy}>
                    {contentBlocks.map(block => (
                        <SortableEditableBlock
                            key={block.id}
                            block={block}
                            onUpdate={handleBlockUpdate}
                            onDelete={handleDeleteBlock}
                            onAddAfter={handleAddBlockAfter}
                        />
                    ))}
                </SortableContext>
            </DndContext>}
        </div>
      </div>
      <ContentAnalysisWidget suggestions={suggestions} />
    </main>
  );
}
