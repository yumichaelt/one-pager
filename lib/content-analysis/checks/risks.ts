import { DocumentContent, Suggestion } from '../types';

export function checkRisksAndMitigations(document: DocumentContent): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  const hasRisksSection = document.blocks.some(block =>
    /risk/i.test(block.type)
  );

  if (!hasRisksSection) {
    suggestions.push({
      id: 'no-risks-section',
      severity: 'medium',
      message: 'Consider adding a "Risks and Mitigations" section to address potential challenges and show foresight.',
    });
    return suggestions;
  }

  const risksBlock = document.blocks.find(block => /risk/i.test(block.type));

  if (risksBlock && !risksBlock.content.trim()) {
    suggestions.push({
      id: 'empty-risks-section',
      severity: 'low',
      message: 'The "Risks" section is empty. Outline potential risks and how you plan to mitigate them.',
      fieldId: risksBlock.id,
    });
  }

  return suggestions;
} 