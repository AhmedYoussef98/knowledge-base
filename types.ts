export interface KnowledgeItem {
  id: string;
  category: string;
  subcategory: string;
  question: string;
  answer: string;
  keywords: string;
  image: string;
  video: string;
  views: number;
}

export interface CategoryData {
  mainCategory: string;
  subcategories: string[];
}

export interface SearchLog {
  timestamp: Date;
  query: string;
  wasSuccessful: boolean;
  agentId: string;
}

export interface AnalyticsData {
  topQuestions: [string, number][];
  topKeywords: [string, number][];
}

export type SortOption = 'mostClicked' | 'category' | 'alphabetical';

// Bulk Import Types
export type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export interface ParsedRow {
  rowIndex: number;
  data: Partial<KnowledgeItem>;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  skipped: number;
  failed: number;
}

export interface ImportResult {
  success: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
}
