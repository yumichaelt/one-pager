"use client";

import { useState, useCallback, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from "./contexts/AuthContext";
import SideBySideModal from "./components/SideBySideModal";

type AiSuggestion = {
    forField: 'title' | 'content';
    text: string;
    action: string;
};

type Block = {
  id: string;
  title: string;
  content: string;
  suggestion?: AiSuggestion | null;
}

type EditableBlockProps = {
    block: Block;
    isAiLoading: boolean;
    onUpdate: (id: string, newBlock: Partial<Block>) => void;
    onDelete: (id:string) => void;
    onAddAfter: (id: string) => void;
    onAiAction: (blockId: string, action: string, field: 'title' | 'content') => void;
    onAcceptSuggestion: (blockId: string) => void;
    onRejectSuggestion: (blockId: string) => void;
    onViewSuggestion: (blockId: string) => void;
};

const SortableEditableBlock = ({ block, isAiLoading, onUpdate, onDelete, onAddAfter, onAiAction, onAcceptSuggestion, onRejectSuggestion, onViewSuggestion }: EditableBlockProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id: block.id});
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const [menuOpen, setMenuOpen] = useState(false);
    const [isAiMenuOpen, setAiMenuOpen] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const hasTitleSuggestion = block.suggestion?.forField === 'title';
    const hasContentSuggestion = block.suggestion?.forField === 'content';

    const displayTitle = hasTitleSuggestion ? block.suggestion!.text : block.title;
    const displayContent = hasContentSuggestion ? block.suggestion!.text : block.content;

    const handleUpdate = (key: 'title' | 'content', value: string) => {
        if (block.suggestion) {
            onRejectSuggestion(block.id);
        }
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
    
    const handleAIAction = (action: string, field: 'title' | 'content') => {
        setMenuOpen(false);
        setAiMenuOpen(false);
        onAiAction(block.id, action, field);
    };

    useLayoutEffect(() => {
        if (contentRef.current) {
            contentRef.current.style.height = 'auto';
            contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
        }
    }, [block.content]);

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
                    value={displayTitle}
                    onChange={(e) => handleUpdate('title', e.target.value)}
                    placeholder="Section Title"
                    className={`w-full text-2xl font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-gray-100 rounded-md p-1 ${hasTitleSuggestion ? 'bg-green-100' : ''}`}
                />
                 <textarea
                    ref={contentRef}
                    value={displayContent}
                    onChange={(e) => handleUpdate('content', e.target.value)}
                    placeholder="Start writing here..."
                    className={`w-full mt-1 p-1 text-gray-700 bg-transparent focus:outline-none focus:bg-gray-100 rounded-md ${hasContentSuggestion ? 'bg-green-100' : ''}`}
                    style={{ overflow: 'hidden' }}
                />
            </div>
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity pl-2 pt-2">
                {block.suggestion ? (
                    <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg shadow-md p-1">
                        <button onClick={() => onViewSuggestion(block.id)} title="View Changes" className="p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-indigo-600">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <button onClick={() => onRejectSuggestion(block.id)} title="Reject" className="p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <button onClick={() => onAcceptSuggestion(block.id)} title="Accept" className="p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </button>
                    </div>
                ) : (
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
                                           <div className="py-1">
                                                <div className="px-3 py-1 text-xs font-semibold text-gray-500">REFINE TITLE</div>
                                                {getAIActions(block.title, 'title').map(action => (
                                                   <button key={action} onClick={() => handleAIAction(action, 'title')} className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{action}</button>
                                                ))}
                                                <div className="border-t my-1"></div>
                                                <div className="px-3 py-1 text-xs font-semibold text-gray-500">REFINE CONTENT</div>
                                                {getAIActions(block.title, 'content').map(action => (
                                                   <button key={action} onClick={() => handleAIAction(action, 'content')} className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{action}</button>
                                                ))}
                                           </div>
                                       </div>
                                   )}
                               </div>
                               <button onClick={handleDelete} className="text-left w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const getAIActions = (title: string, field: 'title' | 'content'): string[] => {
    const lowerCaseTitle = title.toLowerCase();
    
    if (field === 'title') {
        return ["Make it more impactful", "Shorten it", "Rephrase as a question"];
    }

    // field === 'content'
    const defaultActions = ["Improve Writing", "Make More Concise"];
    let specificActions: string[] = [];
    if (lowerCaseTitle.includes('problem')) {
        specificActions = ["Clarify Problem", "Expand on Impact", "Suggest Metrics"];
    } else if (lowerCaseTitle.includes('solution')) {
        specificActions = ["Strengthen Solution", "Outline Implementation Steps", "Estimate Effort"];
    }
    
    return [...specificActions, ...defaultActions];
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
    const { session, supabase } = useAuth();
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingBlockId, setLoadingBlockId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Debounce saving to Supabase
    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    const saveToSupabase = useCallback(
        debounce(async (docId: string, newBlocks: Block[]) => {
            if (!docId) return;
            
            const title = newBlocks.find(b => b.id === 'title')?.title || "Untitled";
            const fields = newBlocks.filter(b => b.id !== 'title');

            const { error } = await supabase
                .from('documents')
                .update({ title, fields: fields })
                .eq('id', docId);

            if (error) {
                console.error("Error saving to Supabase:", error);
            }
        }, 1000),
        [supabase]
    );
    
    useEffect(() => {
        const fetchDocument = async () => {
            setLoading(true);
            const user = session?.user;
            
            if (!user) {
                // GUEST MODE: Load default content, don't save.
                setBlocks([
                    { id: 'title', title: "My One-Pager", content: "" },
                    { id: uuidv4(), title: "Problem Statement", content: "As a guest, your work won't be saved." },
                    { id: uuidv4(), title: "Proposed Solution", content: "Sign up to save your documents!" },
                ]);
                setDocumentId(null);
                setLoading(false);
                return;
            }
            
            // LOGGED-IN USER: Fetch from Supabase as before
            let { data: documents, error } = await supabase
                .from('documents')
                .select('*')
                .limit(1);

            if (error) {
                console.error("Error fetching document:", error);
                setLoading(false);
                return;
            }

            let doc;
            if (!documents || documents.length === 0) {
                // No documents found, create a new one
                const newDoc = {
                    user_id: user.id,
                    title: "Untitled One-Pager",
                    fields: [
                        { id: uuidv4(), title: "Problem Statement", content: "" },
                        { id: uuidv4(), title: "Proposed Solution", content: "" }
                    ]
                };
                const { data, error: createError } = await supabase
                    .from('documents')
                    .insert(newDoc)
                    .select()
                    .single();
                
                if (createError) {
                    console.error("Error creating document:", createError);
                    setLoading(false);
                    return;
                }
                doc = data;
            } else {
                doc = documents[0];
            }

            setDocumentId(doc.id);
            const fetchedBlocks: Block[] = [
                { id: 'title', title: doc.title, content: '' },
                ...(doc.fields || [])
            ];
            setBlocks(fetchedBlocks);
            setLoading(false);
        };

        fetchDocument();
    }, [session, supabase]);

    const titleBlock = blocks.find(b => b.id === 'title');
    const contentBlocks = blocks.filter(b => b.id !== 'title');

    const handleBlockUpdate = (id: string, newBlockData: Partial<Block>) => {
        setBlocks(currentBlocks => currentBlocks.map(block => {
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
    };

    const handleDeleteBlock = (id: string) => {
        if (blocks.length > 2) { 
            const newBlocks = blocks.filter(block => block.id !== id);
            setBlocks(newBlocks);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        
        if (over && active.id !== over.id) {
            const reorderedBlocks = ((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                if (items[oldIndex].id === 'title' || (over && items[newIndex].id === 'title')) {
                    return items;
                }
                return arrayMove(items, oldIndex, newIndex);
            })(blocks);
            setBlocks(reorderedBlocks);
        }
    };

    const handleViewSuggestion = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            setSelectedBlock(block);
            setModalOpen(true);
        }
    };

    const handleGenerateOnePager = async () => {
        if (!titleBlock?.title) {
            alert("Please enter a title for your one-pager first.");
            return;
        }
        setLoading(true); // Use main loading state for simplicity
        try {

            const { data, error } = await supabase.functions.invoke('generate-one-pager', {
                body: { title: titleBlock.title },
            });

            if (error) throw error;
            
            if (data && data.generatedOnePager) {
                 const newBlocks = data.generatedOnePager.fields.map((field: any) => ({
                    id: uuidv4(),
                    title: field.label,
                    content: field.value
                }));
                setBlocks(currentBlocks => {
                    const title = currentBlocks.find(b => b.id === 'title')
                    return [
                        ...(title ? [title] : []), // keep existing title
                        ...newBlocks
                    ];
                });
            }

        } catch (error) {
            console.error('Error invoking Supabase function:', error);
            // You could show an error message to the user here
        } finally {
            setLoading(false);
        }
    };

    const handleAiAction = async (blockId: string, actionText: string, field: 'title' | 'content') => {
        setLoadingBlockId(blockId);

        try {
            const currentBlock = blocks.find(b => b.id === blockId);
            if (!currentBlock) return;

            const documentContext = {
                title: titleBlock?.title || "Untitled",
                fields: contentBlocks.map(b => ({ label: b.title, value: b.content }))
            };
            
            const targetField = {
                label: currentBlock.title,
                value: field === 'title' ? currentBlock.title : currentBlock.content,
            }

            const { data, error } = await supabase.functions.invoke('refine-with-ai', {
                body: { documentContext, specificAction: actionText, targetField },
            });

            if (error) throw error;
            
            if (data && data.refinedText) {
                setBlocks(currentBlocks => currentBlocks.map(block => {
                    if (block.id === blockId) {
                        return {
                            ...block,
                            suggestion: {
                                forField: field,
                                text: data.refinedText,
                                action: actionText,
                            }
                        };
                    }
                    return block;
                }));
            }

        } catch (error) {
            console.error('Error invoking Supabase function:', error);
            // You could show an error message to the user here
        } finally {
            setLoadingBlockId(null);
        }
    };

    const handleAcceptSuggestion = (blockId: string) => {
        setBlocks(currentBlocks => currentBlocks.map(block => {
            if (block.id === blockId && block.suggestion) {
                const { forField, text } = block.suggestion;
                return {
                    ...block,
                    [forField]: text, // Replace the content/title with the suggestion
                    suggestion: null, // Clear the suggestion
                };
            }
            return block;
        }));
    };

    const handleRejectSuggestion = (blockId: string) => {
        setBlocks(currentBlocks => currentBlocks.map(block => {
            if (block.id === blockId) {
                return { ...block, suggestion: null }; // Clear the suggestion
            }
            return block;
        }));
    };

    if (loading) {
        return (
            <main className="flex min-h-screen flex-col items-center p-24">
                <p>Loading your document...</p>
            </main>
        )
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-24">
            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                    {blocks.find(b => b.id === 'title') && (
                        <div className="flex-grow">
                            <PageTitleBlock block={blocks.find(b => b.id === 'title')!} onUpdate={handleBlockUpdate} />
                        </div>
                    )}
                    <button 
                        onClick={handleGenerateOnePager}
                        disabled={loading}
                        className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <span>Generate</span>
                    </button>
                </div>
               
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={contentBlocks} strategy={verticalListSortingStrategy}>
                        <div className="mt-8 space-y-4">
                            {contentBlocks.map(block => (
                                <SortableEditableBlock 
                                    key={block.id} 
                                    block={block} 
                                    isAiLoading={loadingBlockId === block.id}
                                    onUpdate={handleBlockUpdate} 
                                    onDelete={handleDeleteBlock} 
                                    onAddAfter={handleAddBlockAfter}
                                    onAiAction={handleAiAction}
                                    onAcceptSuggestion={handleAcceptSuggestion}
                                    onRejectSuggestion={handleRejectSuggestion}
                                    onViewSuggestion={handleViewSuggestion}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                {selectedBlock && selectedBlock.suggestion && (
                    <SideBySideModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onAccept={() => {
                            handleAcceptSuggestion(selectedBlock.id);
                            setModalOpen(false);
                        }}
                        originalContent={selectedBlock[selectedBlock.suggestion.forField]}
                        suggestedContent={selectedBlock.suggestion.text}
                        fieldName={selectedBlock.suggestion.forField}
                    />
                )}
            </div>
        </main>
    );
}
