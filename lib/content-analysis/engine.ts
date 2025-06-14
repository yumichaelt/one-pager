import { DocumentContent, Suggestion, AnalysisCheck } from './types';
import { checkTitle } from './checks/title';
import { checkContent } from './checks/content';
import { checkRisksAndMitigations } from './checks/risks';

const allChecks: AnalysisCheck[] = [
  checkTitle,
  checkContent,
  checkRisksAndMitigations,
];

export class ContentAnalysisEngine {
  analyze(document: DocumentContent): Suggestion[] {
    return allChecks.flatMap(check => check(document));
  }
} 