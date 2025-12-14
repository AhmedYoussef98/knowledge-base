import { GoogleGenerativeAI } from '@google/generative-ai';

export type FieldType = 'question' | 'answer' | 'category' | 'subcategory' | 'keywords';

export interface AIFieldContext {
  question?: string;
  answer?: string;
  category?: string;
  subcategory?: string;
  existingCategories?: string[];
  tenantName?: string;
}

export interface AIFieldResult {
  content: string;
  success: boolean;
  error?: string;
}

// ============================================
// GENERATE PROMPTS - For empty fields
// ============================================

const getGeneratePrompt = (fieldType: FieldType, context: AIFieldContext): string => {
  const { question, answer, category, existingCategories, tenantName } = context;

  switch (fieldType) {
    case 'question':
      return `You are a knowledge base content writer for "${tenantName || 'a company'}".

Task: Generate a clear, well-structured FAQ question.

${answer ? `Based on this answer content: "${answer}"` : 'Generate a common customer service question.'}

Requirements:
- Write a single, clear question
- Make it specific and searchable
- Use natural language customers would use
- Keep it concise (under 100 characters ideally)

Output: Just the question text, nothing else.`;

    case 'answer':
      if (!question) {
        return `Generate a helpful customer service answer about a common topic.
Output: Just the answer text, no explanations.`;
      }
      return `You are an expert knowledge base content writer for "${tenantName || 'a company'}".

Task: Write a comprehensive, helpful answer for this FAQ question.

Question: "${question}"

Requirements:
- Professional, helpful, and friendly tone
- Clear structure (use bullet points or numbered steps if it's a how-to)
- Include relevant details but stay concise
- If it's a how-to question, provide step-by-step instructions
- If it's a policy question, be specific about rules/limits
- Aim for 2-4 paragraphs or equivalent bullet points
- Match the language of the question (Arabic or English)

Output: Just the answer text, no additional commentary or labels.`;

    case 'category':
      const categoryList = existingCategories?.length
        ? `\nExisting categories: ${existingCategories.join(', ')}`
        : '';
      return `You are organizing a knowledge base for "${tenantName || 'a company'}".

Task: Suggest the best main category for this FAQ item.

Question: "${question || 'General inquiry'}"
${answer ? `Answer: "${answer.substring(0, 200)}..."` : ''}
${categoryList}

Requirements:
- If an existing category fits well, use it exactly as written
- If no existing category fits, suggest a new concise category name
- Category should be 1-3 words
- Use title case (e.g., "Shipping & Delivery")
- Match the language of the question

Output: Just the category name, nothing else.`;

    case 'subcategory':
      return `You are organizing a knowledge base for "${tenantName || 'a company'}".

Task: Suggest the best subcategory for this FAQ item.

Question: "${question || 'General inquiry'}"
Main Category: "${category || 'General'}"

Requirements:
- Subcategory should be more specific than the main category
- Keep it concise (1-3 words)
- Use title case
- Match the language of the question

Output: Just the subcategory name, nothing else.`;

    case 'keywords':
      return `You are an SEO specialist for a knowledge base.

Task: Generate search keywords for this FAQ entry.

Question: "${question || ''}"
Answer: "${answer?.substring(0, 500) || ''}"
Category: "${category || ''}"

Requirements:
- Generate 5-10 relevant keywords/phrases
- Include synonyms and related terms users might search for
- Mix of single words and short 2-3 word phrases
- Include common misspellings if applicable
- Match the language of the content

Output: Just the keywords, space-separated, no explanations or labels.`;

    default:
      return 'Generate helpful content.';
  }
};

// ============================================
// ENHANCE PROMPTS - For existing content
// ============================================

const getEnhancePrompt = (fieldType: FieldType, currentValue: string, context: AIFieldContext): string => {
  const { question, answer, category, tenantName } = context;

  switch (fieldType) {
    case 'question':
      return `You are a knowledge base content editor for "${tenantName || 'a company'}".

Task: Improve this FAQ question to be clearer and more searchable.

Current question: "${currentValue}"
${answer ? `Related answer: "${answer.substring(0, 200)}..."` : ''}

Requirements:
- Make it more specific and clear
- Ensure it uses natural language customers would search for
- Keep the same meaning and intent
- Keep it concise
- Maintain the same language (Arabic or English)

Output: Just the improved question, nothing else.`;

    case 'answer':
      return `You are an expert knowledge base content editor for "${tenantName || 'a company'}".

Task: Enhance and improve this FAQ answer.

Question: "${question || 'Unknown question'}"
Current answer: "${currentValue}"

Requirements:
- Improve clarity and readability
- Add structure (bullets/steps) if beneficial
- Ensure completeness - add any missing important details
- Remove redundancy
- Keep the professional, helpful tone
- Maintain the same language (Arabic or English)
- Don't change the core meaning

Output: Just the improved answer text, no labels or explanations.`;

    case 'category':
      return `You are organizing a knowledge base for "${tenantName || 'a company'}".

Task: Evaluate if this category is the best fit, or suggest a better one.

Question: "${question || ''}"
Current category: "${currentValue}"

Requirements:
- If current category is good, return it unchanged
- If a better category exists, suggest it
- Keep it concise (1-3 words)
- Maintain the same language

Output: Just the category name, nothing else.`;

    case 'subcategory':
      return `You are organizing a knowledge base for "${tenantName || 'a company'}".

Task: Evaluate if this subcategory is the best fit, or suggest a better one.

Question: "${question || ''}"
Main Category: "${category || 'General'}"
Current subcategory: "${currentValue}"

Requirements:
- If current subcategory is appropriate, return it unchanged
- If a more specific/accurate one exists, suggest it
- Keep it concise (1-3 words)
- Maintain the same language

Output: Just the subcategory name, nothing else.`;

    case 'keywords':
      return `You are an SEO specialist for a knowledge base.

Task: Expand and improve these search keywords.

Question: "${question || ''}"
Answer: "${answer?.substring(0, 300) || ''}"
Current keywords: "${currentValue}"

Requirements:
- Keep good existing keywords
- Add missing relevant keywords (aim for 8-12 total)
- Include synonyms and related search terms
- Remove irrelevant or duplicate keywords
- Maintain the same language

Output: Just the keywords, space-separated, no explanations.`;

    default:
      return `Improve this content: "${currentValue}"`;
  }
};

// ============================================
// MAIN API FUNCTIONS
// ============================================

export const generateFieldContent = async (
  apiKey: string,
  fieldType: FieldType,
  context: AIFieldContext
): Promise<AIFieldResult> => {
  if (!apiKey) {
    return { content: '', success: false, error: 'No API key provided' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = getGeneratePrompt(fieldType, context);
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Clean up response - remove quotes if AI wrapped it
    const cleanedResponse = response
      .replace(/^["']|["']$/g, '')
      .replace(/^#+\s*/gm, '') // Remove markdown headers
      .trim();

    return { content: cleanedResponse, success: true };
  } catch (error) {
    console.error(`AI generate error for ${fieldType}:`, error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed'
    };
  }
};

export const enhanceFieldContent = async (
  apiKey: string,
  fieldType: FieldType,
  currentValue: string,
  context: AIFieldContext
): Promise<AIFieldResult> => {
  if (!apiKey) {
    return { content: currentValue, success: false, error: 'No API key provided' };
  }

  if (!currentValue.trim()) {
    return { content: '', success: false, error: 'No content to enhance' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = getEnhancePrompt(fieldType, currentValue, context);
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Clean up response
    const cleanedResponse = response
      .replace(/^["']|["']$/g, '')
      .replace(/^#+\s*/gm, '')
      .trim();

    return { content: cleanedResponse, success: true };
  } catch (error) {
    console.error(`AI enhance error for ${fieldType}:`, error);
    return {
      content: currentValue,
      success: false,
      error: error instanceof Error ? error.message : 'Enhancement failed'
    };
  }
};

// ============================================
// AUTO-FILL ALL FUNCTION (Enhanced version)
// ============================================

export const autoFillAllFields = async (
  apiKey: string,
  question: string,
  existingCategories: string[],
  tenantName?: string
): Promise<{
  answer: string;
  category: string;
  subcategory: string;
  keywords: string;
  success: boolean;
  error?: string;
}> => {
  if (!apiKey) {
    return { answer: '', category: '', subcategory: '', keywords: '', success: false, error: 'No API key' };
  }

  if (!question.trim()) {
    return { answer: '', category: '', subcategory: '', keywords: '', success: false, error: 'Question required' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const categoryList = existingCategories.length
      ? `Existing categories: ${existingCategories.join(', ')}`
      : 'No existing categories yet.';

    const prompt = `You are an expert knowledge base content writer for "${tenantName || 'a company'}".

Task: Generate complete FAQ content for this question.

Question: "${question}"
${categoryList}

Generate:
1. A comprehensive, helpful answer (2-4 paragraphs or bullet points)
2. A main category (use existing if fits, or suggest new - 1-3 words)
3. A subcategory (more specific than category - 1-3 words)
4. Search keywords (5-10 relevant terms, space-separated)

IMPORTANT:
- Match the language of the question (if Arabic, respond in Arabic)
- Answer should be professional, clear, and complete
- Category should be broad, subcategory more specific

Return ONLY a valid JSON object in this exact format, no other text:
{"answer": "...", "category": "...", "subcategory": "...", "keywords": "..."}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      answer: parsed.answer || '',
      category: parsed.category || 'General',
      subcategory: parsed.subcategory || 'Other',
      keywords: parsed.keywords || '',
      success: true
    };
  } catch (error) {
    console.error('Auto-fill all error:', error);
    return {
      answer: '',
      category: '',
      subcategory: '',
      keywords: '',
      success: false,
      error: error instanceof Error ? error.message : 'Auto-fill failed'
    };
  }
};
