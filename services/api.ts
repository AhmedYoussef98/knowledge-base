import { KnowledgeItem, CategoryData, AnalyticsData, SearchLog } from '../types';
import { supabase } from './supabase';

// ============================================
// TENANT-AWARE API FUNCTIONS
// All functions now require tenantId for data isolation
// ============================================

export const getCategories = async (tenantId: string): Promise<CategoryData[]> => {
  if (!tenantId) return [];

  const { data, error } = await supabase
    .from('knowledge_items')
    .select('category, subcategory')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const categoriesMap = new Map<string, Set<string>>();

  data.forEach(item => {
    if (!categoriesMap.has(item.category)) {
      categoriesMap.set(item.category, new Set());
    }
    if (item.subcategory) {
      categoriesMap.get(item.category)?.add(item.subcategory);
    }
  });

  return Array.from(categoriesMap.entries()).map(([main, subs]) => ({
    mainCategory: main,
    subcategories: Array.from(subs)
  }));
};

export const getAllContent = async (tenantId: string): Promise<KnowledgeItem[]> => {
  if (!tenantId) return [];

  const { data, error } = await supabase
    .from('knowledge_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching content:', error);
    return [];
  }

  return data as KnowledgeItem[];
};

export const addNewItem = async (
  tenantId: string,
  newItem: Omit<KnowledgeItem, 'id' | 'views' | 'tenant_id'>
): Promise<KnowledgeItem | null> => {
  if (!tenantId) throw new Error('Tenant ID required');

  const { data, error } = await supabase
    .from('knowledge_items')
    .insert([{ ...newItem, tenant_id: tenantId }])
    .select()
    .single();

  if (error) {
    console.error('Error adding item:', error);
    throw error;
  }

  return data as KnowledgeItem;
};

export const updateItem = async (
  id: string,
  updates: Partial<KnowledgeItem>
): Promise<KnowledgeItem | null> => {
  // Remove tenant_id from updates to prevent changing it
  const { tenant_id, ...safeUpdates } = updates as any;

  const { data, error } = await supabase
    .from('knowledge_items')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating item:', error);
    throw error;
  }

  return data as KnowledgeItem;
};

export const deleteItem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('knowledge_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting item:', error);
    return false;
  }

  return true;
};

export const getRecentSearches = async (tenantId: string): Promise<SearchLog[]> => {
  if (!tenantId) return [];

  const { data, error } = await supabase
    .from('search_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent searches:', error);
    return [];
  }

  return data.map((log: any) => ({
    ...log,
    timestamp: new Date(log.created_at),
    wasSuccessful: log.was_successful,
    agentId: log.agent_id
  }));
};

export const getAnalytics = async (tenantId: string): Promise<AnalyticsData> => {
  if (!tenantId) return { topQuestions: [], topKeywords: [] };

  // 1. Get Top Questions (Most Views)
  const { data: topQData } = await supabase
    .from('knowledge_items')
    .select('question, views')
    .eq('tenant_id', tenantId)
    .order('views', { ascending: false })
    .limit(5);

  const topQuestions = (topQData || []).map(i => [i.question, i.views] as [string, number]);

  // 2. Get Top Keywords (Simple aggregation from recent search logs)
  const { data: searchLogs } = await supabase
    .from('search_logs')
    .select('query')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  const keywordCounts: Record<string, number> = {};

  if (searchLogs) {
    searchLogs.forEach(log => {
      const words = log.query.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          keywordCounts[word] = (keywordCounts[word] || 0) + 1;
        }
      });
    });
  }

  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    topQuestions,
    topKeywords
  };
};

export const logSearchEvent = async (tenantId: string, query: string, success: boolean) => {
  if (!tenantId) return;

  await supabase
    .from('search_logs')
    .insert([{
      tenant_id: tenantId,
      query,
      was_successful: success,
      agent_id: 'visitor'
    }]);
};

export const logQuestionClickEvent = async (questionId: string) => {
  // 1. Fetch current view count
  const { data: currentItem } = await supabase
    .from('knowledge_items')
    .select('views')
    .eq('id', questionId)
    .single();

  if (currentItem) {
    // 2. Increment
    await supabase
      .from('knowledge_items')
      .update({ views: (currentItem.views || 0) + 1 })
      .eq('id', questionId);
  }
};