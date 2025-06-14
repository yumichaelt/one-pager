import { DocumentContent, Suggestion } from '../types';

export function checkTitle(document: DocumentContent): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const title = document.title;

  if (!title.trim()) {
    suggestions.push({
      id: 'no-title',
      severity: 'high',
      message: 'Add a title to your one-pager.',
    });
  } else if (title.length < 10) {
    suggestions.push({
      id: 'title-too-short',
      severity: 'medium',
      message: 'Your title is very short. Consider making it more descriptive.',
    });
  } else if (title.length > 70) {
      suggestions.push({
          id: 'title-too-long',
          severity: 'medium',
          message: 'Your title is quite long. Shorter titles are often more impactful.',
      });
  }

  return suggestions;
} 