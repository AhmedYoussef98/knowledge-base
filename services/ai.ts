import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API - This service is deprecated as tenants now provide their own API keys
// This file is kept for backwards compatibility but the API key must come from environment
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Only initialize if API key is provided
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) : null;

export const askAI = async (question: string, context: string = ''): Promise<string> => {
  if (!model) {
    return 'AI assistant is not configured. Please set up your API key.';
  }

  try {
    const prompt = `
      You are a helpful customer service assistant.
      Context from knowledge base: ${context}
      
      User Question: ${question}
      
      Answer the question based on the context provided. If the answer is not in the context, use your general knowledge but mention that this is general advice. Keep it concise and helpful.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error asking AI:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
};

export const generateAnswer = async (question: string): Promise<string> => {
  if (!model) {
    return '';
  }

  try {
    const prompt = `
      Write a detailed and helpful customer service answer for the following question:
      "${question}"
      
      The answer should be professional, clear, and easy to understand.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating answer:', error);
    return '';
  }
};

export const suggestCategories = async (question: string, existingCategories: string[]): Promise<{ main: string, sub: string }> => {
  if (!model) {
    return { main: 'General', sub: 'General' };
  }

  try {
    const prompt = `
      Analyze this question: "${question}"
      
      Existing categories: ${existingCategories.join(', ')}
      
      Suggest a Main Category and a Subcategory for this question.
      If it fits an existing category, use it. If not, suggest a new one.
      
      Return ONLY a JSON object like this: {"main": "CategoryName", "sub": "SubcategoryName"}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean up potential markdown code blocks
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error suggesting categories:', error);
    return { main: 'General', sub: 'General' };
  }
};
