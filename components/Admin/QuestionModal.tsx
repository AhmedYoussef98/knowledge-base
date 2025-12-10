import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Video, Tag, Type, List, Link, Sparkles, Loader2 } from 'lucide-react';
import { addNewItem, updateItem } from '../../services/api';
import { CategoryData, KnowledgeItem } from '../../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingCategories: CategoryData[];
    initialData?: KnowledgeItem;
    tenantId: string;
    geminiApiKey?: string;
}

export const QuestionModal: React.FC<Props> = ({
    isOpen, onClose, onSuccess, existingCategories, initialData, tenantId, geminiApiKey
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: '',
        subcategory: '',
        keywords: '',
        image: '',
        video: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                question: initialData.question,
                answer: initialData.answer,
                category: initialData.category,
                subcategory: initialData.subcategory,
                keywords: initialData.keywords,
                image: initialData.image,
                video: initialData.video
            });
        } else {
            setFormData({
                question: '',
                answer: '',
                category: '',
                subcategory: '',
                keywords: '',
                image: '',
                video: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) {
            alert('Tenant ID is required');
            return;
        }

        setIsSubmitting(true);
        try {
            if (initialData) {
                await updateItem(initialData.id, formData);
            } else {
                await addNewItem(tenantId, formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error saving data');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAIGenerate = async () => {
        if (!formData.question) return alert('Please enter a question first');
        if (!geminiApiKey) return alert('No API key configured. Add your Gemini API key in Settings.');

        setIsGenerating(true);
        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            // Generate answer
            const answerPrompt = `
                Write a detailed and helpful customer service answer for the following question:
                "${formData.question}"
                The answer should be professional, clear, and easy to understand.
            `;
            const answerResult = await model.generateContent(answerPrompt);
            const answer = answerResult.response.text();

            // Suggest categories
            const catPrompt = `
                Analyze this question: "${formData.question}"
                Existing categories: ${existingCategories.map(c => c.mainCategory).join(', ')}
                Suggest a Main Category and a Subcategory for this question.
                If it fits an existing category, use it. If not, suggest a new one.
                Return ONLY a JSON object like this: {"main": "CategoryName", "sub": "SubcategoryName"}
            `;
            const catResult = await model.generateContent(catPrompt);
            const catText = catResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const cats = JSON.parse(catText);

            setFormData(prev => ({
                ...prev,
                answer: answer,
                category: cats.main,
                subcategory: cats.sub
            }));
        } catch (error) {
            console.error('AI Error:', error);
            alert('Failed to generate content with AI. Check your API key.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {initialData ? 'Edit Question' : 'Add New Question'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {initialData ? 'Update existing information' : 'Add new information to the knowledge base'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-grow">

                    {/* AI Helper */}
                    {!initialData && geminiApiKey && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    AI Assistant
                                </h3>
                                <p className="text-xs text-blue-700 mt-1">
                                    Type a question below and let AI generate the answer and categories for you.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAIGenerate}
                                disabled={isGenerating || !formData.question}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Auto-Fill
                            </button>
                        </div>
                    )}

                    {/* No API Key Warning */}
                    {!initialData && !geminiApiKey && (
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                                <strong>Tip:</strong> Add your Gemini API key in Settings to enable AI-powered auto-fill.
                            </p>
                        </div>
                    )}

                    {/* Question & Answer */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <div className="relative">
                                <Type className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Ex: How can I track my shipment?"
                                    value={formData.question}
                                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                            <textarea
                                required
                                rows={5}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Write the detailed answer here..."
                                value={formData.answer}
                                onChange={e => setFormData({ ...formData, answer: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Main Category</label>
                            <div className="relative">
                                <List className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    list="categories"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Select or type new"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                                <datalist id="categories">
                                    {existingCategories.map(c => (
                                        <option key={c.mainCategory} value={c.mainCategory} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* Subcategory */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                            <div className="relative">
                                <Tag className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: Delivery, Payments..."
                                    value={formData.subcategory}
                                    onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Keywords */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: track, shipment (space separated)"
                            value={formData.keywords}
                            onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                        />
                    </div>

                    {/* Media Attachments */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Link className="w-4 h-4 text-blue-500" />
                            Attachments (Links)
                        </h3>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Image Link</label>
                            <div className="relative">
                                <ImageIcon className="absolute top-2.5 left-3 text-gray-400 w-4 h-4" />
                                <input
                                    type="url"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 pl-9 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.image}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Video Link</label>
                            <div className="relative">
                                <Video className="absolute top-2.5 left-3 text-gray-400 w-4 h-4" />
                                <input
                                    type="url"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 pl-9 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://youtube.com/watch?v=..."
                                    value={formData.video}
                                    onChange={e => setFormData({ ...formData, video: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                    >
                        {isSubmitting ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};
