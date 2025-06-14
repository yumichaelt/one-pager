'use client';

import { useState, useEffect, useMemo } from 'react';
import { ContentAnalysisEngine, DocumentContent, Suggestion } from '../lib/content-analysis';

export function useContentAnalysis(document: DocumentContent) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  const analysisEngine = useMemo(() => new ContentAnalysisEngine(), []);

  useEffect(() => {
    if (document) {
      const newSuggestions = analysisEngine.analyze(document);
      setSuggestions(newSuggestions);
    }
  }, [document, analysisEngine]);

  return suggestions;
} 