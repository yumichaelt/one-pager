import { DocumentContent, Suggestion } from '../types';

export function checkContent(document: DocumentContent): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    const totalContent = document.blocks.map(b => b.content).join(' ');
    const wordCount = totalContent.split(/\s+/).filter(Boolean).length;

    if (wordCount === 0) {
      suggestions.push({
        id: 'no-content',
        severity: 'high',
        message: 'Your document is empty. Add some content blocks.',
      });
    } else if (wordCount < 50) {
      suggestions.push({
        id: 'content-too-short',
        severity: 'low',
        message: `Your one-pager is very brief (${wordCount} words). Consider expanding on your ideas.`,
      });
    }

    const hasCTA = document.blocks.some(b =>
      /learn more|contact us|sign up|buy now|get started/i.test(b.content)
    );

    if (!hasCTA && wordCount > 20) {
      suggestions.push({
        id: 'no-cta',
        severity: 'medium',
        message: 'Consider adding a call to action to guide your readers on what to do next.',
      });
    }

    return suggestions;
} 