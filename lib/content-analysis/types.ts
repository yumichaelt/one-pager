export interface DocumentContent {
  title: string;
  blocks: { id: string; type: string; content: string }[];
}

export interface Suggestion {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  fieldId?: string; // To link suggestion to a specific block
}

export type AnalysisCheck = (document: DocumentContent) => Suggestion[]; 