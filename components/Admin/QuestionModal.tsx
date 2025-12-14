import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Video, Tag, Type, List, Link, Sparkles, Loader2 } from 'lucide-react';
import { addNewItem, updateItem } from '../../services/api';
import { CategoryData, KnowledgeItem } from '../../types';
import { FieldAIButtons } from './FieldAIButtons';
import { autoFillAllFields, AIFieldContext } from '../../services/aiFieldHelper';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingCategories: CategoryData[];
    initialData?: KnowledgeItem;
    tenantId: string;
    geminiApiKey?: string;
    tenantName?: string;
}

interface FormData {
    question: string;
    answer: string;
    category: string;
    subcategory: string;
    keywords: string;
    image: string;
    video: string;
}

interface AIChangedFields {
    question: boolean;
    answer: boolean;
    category: boolean;
    subcategory: boolean;
    keywords: boolean;
}

const emptyFormData: FormData = {
    question: '',
    answer: '',
    category: '',
    subcategory: '',
    keywords: '',
    image: '',
    video: ''
};

export const QuestionModal: React.FC<Props> = ({
    isOpen, onClose, onSuccess, existingCategories, initialData, tenantId, geminiApiKey, tenantName
}) => {
    const { isRTL } = useLanguage();
    const { t } = useTranslation();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [formData, setFormData] = useState<FormData>(emptyFormData);
    const [originalValues, setOriginalValues] = useState<FormData>(emptyFormData);
    const [aiChangedFields, setAIChangedFields] = useState<AIChangedFields>({
        question: false,
        answer: false,
        category: false,
        subcategory: false,
        keywords: false
    });

    // Reset form when modal opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) {
            const newData = initialData ? {
                question: initialData.question,
                answer: initialData.answer,
                category: initialData.category,
                subcategory: initialData.subcategory,
                keywords: initialData.keywords,
                image: initialData.image,
                video: initialData.video
            } : emptyFormData;

            setFormData(newData);
            setOriginalValues(newData);
            setAIChangedFields({
                question: false,
                answer: false,
                category: false,
                subcategory: false,
                keywords: false
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

    // Auto-fill all fields at once
    const handleAutoFillAll = async () => {
        if (!formData.question) {
            alert(t('aiField.questionRequired') || 'Please enter a question first');
            return;
        }
        if (!geminiApiKey) {
            alert(t('aiField.noApiKey') || 'No API key configured. Add your Gemini API key in Settings.');
            return;
        }

        setIsAutoFilling(true);
        try {
            const result = await autoFillAllFields(
                geminiApiKey,
                formData.question,
                existingCategories.map(c => c.mainCategory),
                tenantName
            );

            if (result.success) {
                setFormData(prev => ({
                    ...prev,
                    answer: result.answer || prev.answer,
                    category: result.category || prev.category,
                    subcategory: result.subcategory || prev.subcategory,
                    keywords: result.keywords || prev.keywords
                }));
                setAIChangedFields(prev => ({
                    ...prev,
                    answer: !!result.answer,
                    category: !!result.category,
                    subcategory: !!result.subcategory,
                    keywords: !!result.keywords
                }));
            } else {
                alert(result.error || 'Failed to generate content');
            }
        } catch (error) {
            console.error('Auto-fill error:', error);
            alert('Failed to generate content with AI');
        } finally {
            setIsAutoFilling(false);
        }
    };

    // Field update handlers
    const updateField = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const markFieldAIChanged = (field: keyof AIChangedFields) => {
        setAIChangedFields(prev => ({ ...prev, [field]: true }));
    };

    const revertField = (field: keyof FormData) => {
        setFormData(prev => ({ ...prev, [field]: originalValues[field] }));
        setAIChangedFields(prev => ({ ...prev, [field]: false }));
    };

    // Build context for AI field helpers
    const getFieldContext = (): AIFieldContext => ({
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
        subcategory: formData.subcategory,
        existingCategories: existingCategories.map(c => c.mainCategory),
        tenantName
    });

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>

                {/* Header */}
                <div className={`p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {initialData ? t('admin.editQuestion') : t('admin.addQuestion')}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {initialData
                                ? (isRTL ? 'تحديث المعلومات الحالية' : 'Update existing information')
                                : (isRTL ? 'إضافة معلومات جديدة للقاعدة المعرفية' : 'Add new information to the knowledge base')
                            }
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-grow">

                    {/* AI Auto-Fill All Section */}
                    {geminiApiKey && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                            <div className={isRTL ? 'text-right' : ''}>
                                <h3 className={`font-bold text-blue-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    {t('aiField.assistant') || 'AI Assistant'}
                                </h3>
                                <p className="text-xs text-blue-700 mt-1">
                                    {t('aiField.autoFillDescription') || 'Type a question and let AI generate all fields, or use individual AI buttons on each field.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAutoFillAll}
                                disabled={isAutoFilling || !formData.question}
                                className={`px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                {isAutoFilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {t('aiField.autoFillAll') || 'Auto-Fill All'}
                            </button>
                        </div>
                    )}

                    {/* No API Key Warning */}
                    {!geminiApiKey && (
                        <div className={`bg-yellow-50 p-4 rounded-xl border border-yellow-200 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-yellow-800">
                                <strong>{isRTL ? 'نصيحة:' : 'Tip:'}</strong> {t('aiField.noApiKey') || 'Add your Gemini API key in Settings to enable AI-powered features.'}
                            </p>
                        </div>
                    )}

                    {/* Question Field */}
                    <div>
                        <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <label className="block text-sm font-medium text-gray-700">{t('admin.question')}</label>
                            <FieldAIButtons
                                fieldType="question"
                                currentValue={formData.question}
                                originalValue={originalValues.question}
                                hasAIChanged={aiChangedFields.question}
                                onUpdate={(v) => updateField('question', v)}
                                onMarkAIChanged={() => markFieldAIChanged('question')}
                                onRevert={() => revertField('question')}
                                context={getFieldContext()}
                                geminiApiKey={geminiApiKey}
                            />
                        </div>
                        <div className="relative">
                            <Type className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-5 h-5`} />
                            <input
                                type="text"
                                className={`w-full bg-gray-50 border border-gray-200 rounded-lg p-3 ${isRTL ? 'pr-10 text-right' : 'pl-10'} text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                placeholder={isRTL ? 'مثال: كيف يمكنني تتبع شحنتي؟' : 'Ex: How can I track my shipment?'}
                                value={formData.question}
                                onChange={e => updateField('question', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Answer Field */}
                    <div>
                        <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <label className="block text-sm font-medium text-gray-700">{t('admin.answer')}</label>
                            <FieldAIButtons
                                fieldType="answer"
                                currentValue={formData.answer}
                                originalValue={originalValues.answer}
                                hasAIChanged={aiChangedFields.answer}
                                onUpdate={(v) => updateField('answer', v)}
                                onMarkAIChanged={() => markFieldAIChanged('answer')}
                                onRevert={() => revertField('answer')}
                                context={getFieldContext()}
                                geminiApiKey={geminiApiKey}
                            />
                        </div>
                        <textarea
                            rows={5}
                            className={`w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isRTL ? 'text-right' : ''}`}
                            placeholder={isRTL ? 'اكتب الإجابة التفصيلية هنا...' : 'Write the detailed answer here...'}
                            value={formData.answer}
                            onChange={e => updateField('answer', e.target.value)}
                        />
                    </div>

                    {/* Category & Subcategory Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <label className="block text-sm font-medium text-gray-700">{t('admin.category')}</label>
                                <FieldAIButtons
                                    fieldType="category"
                                    currentValue={formData.category}
                                    originalValue={originalValues.category}
                                    hasAIChanged={aiChangedFields.category}
                                    onUpdate={(v) => updateField('category', v)}
                                    onMarkAIChanged={() => markFieldAIChanged('category')}
                                    onRevert={() => revertField('category')}
                                    context={getFieldContext()}
                                    geminiApiKey={geminiApiKey}
                                    compact
                                />
                            </div>
                            <div className="relative">
                                <List className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-5 h-5`} />
                                <input
                                    type="text"
                                    list="categories"
                                    className={`w-full bg-gray-50 border border-gray-200 rounded-lg p-3 ${isRTL ? 'pr-10 text-right' : 'pl-10'} text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder={isRTL ? 'اختر أو اكتب جديد' : 'Select or type new'}
                                    value={formData.category}
                                    onChange={e => updateField('category', e.target.value)}
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
                            <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <label className="block text-sm font-medium text-gray-700">
                                    {isRTL ? 'التصنيف الفرعي' : 'Subcategory'}
                                </label>
                                <FieldAIButtons
                                    fieldType="subcategory"
                                    currentValue={formData.subcategory}
                                    originalValue={originalValues.subcategory}
                                    hasAIChanged={aiChangedFields.subcategory}
                                    onUpdate={(v) => updateField('subcategory', v)}
                                    onMarkAIChanged={() => markFieldAIChanged('subcategory')}
                                    onRevert={() => revertField('subcategory')}
                                    context={getFieldContext()}
                                    geminiApiKey={geminiApiKey}
                                    compact
                                />
                            </div>
                            <div className="relative">
                                <Tag className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-5 h-5`} />
                                <input
                                    type="text"
                                    className={`w-full bg-gray-50 border border-gray-200 rounded-lg p-3 ${isRTL ? 'pr-10 text-right' : 'pl-10'} text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder={isRTL ? 'مثال: التوصيل، المدفوعات...' : 'Ex: Delivery, Payments...'}
                                    value={formData.subcategory}
                                    onChange={e => updateField('subcategory', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Keywords Field */}
                    <div>
                        <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <label className="block text-sm font-medium text-gray-700">{t('admin.keywords')}</label>
                            <FieldAIButtons
                                fieldType="keywords"
                                currentValue={formData.keywords}
                                originalValue={originalValues.keywords}
                                hasAIChanged={aiChangedFields.keywords}
                                onUpdate={(v) => updateField('keywords', v)}
                                onMarkAIChanged={() => markFieldAIChanged('keywords')}
                                onRevert={() => revertField('keywords')}
                                context={getFieldContext()}
                                geminiApiKey={geminiApiKey}
                            />
                        </div>
                        <input
                            type="text"
                            className={`w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRTL ? 'text-right' : ''}`}
                            placeholder={isRTL ? 'مثال: تتبع شحنة توصيل (مفصولة بمسافات)' : 'Ex: track, shipment (space separated)'}
                            value={formData.keywords}
                            onChange={e => updateField('keywords', e.target.value)}
                        />
                    </div>

                    {/* Media Attachments */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <h3 className={`text-sm font-bold text-gray-700 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Link className="w-4 h-4 text-blue-500" />
                            {isRTL ? 'المرفقات (روابط)' : 'Attachments (Links)'}
                        </h3>

                        <div>
                            <label className={`block text-xs font-medium text-gray-500 mb-1 ${isRTL ? 'text-right' : ''}`}>
                                {t('admin.image')}
                            </label>
                            <div className="relative">
                                <ImageIcon className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-4 h-4`} />
                                <input
                                    type="url"
                                    className={`w-full bg-white border border-gray-200 rounded-lg p-2 ${isRTL ? 'pr-9 text-right' : 'pl-9'} text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.image}
                                    onChange={e => updateField('image', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-medium text-gray-500 mb-1 ${isRTL ? 'text-right' : ''}`}>
                                {t('admin.video')}
                            </label>
                            <div className="relative">
                                <Video className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-4 h-4`} />
                                <input
                                    type="url"
                                    className={`w-full bg-white border border-gray-200 rounded-lg p-2 ${isRTL ? 'pr-9 text-right' : 'pl-9'} text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder="https://youtube.com/watch?v=..."
                                    value={formData.video}
                                    onChange={e => updateField('video', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer Actions */}
                <div className={`p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        {isSubmitting ? (
                            <>{isRTL ? 'جاري الحفظ...' : 'Saving...'}</>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {t('common.save')}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};
