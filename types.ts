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
