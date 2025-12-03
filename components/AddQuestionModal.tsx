import React, { useState } from 'react';
import { X, Save, Image as ImageIcon, Video, Tag, Type, List, Link } from 'lucide-react';
import { addNewItem } from '../services/api';
import { CategoryData } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCategories: CategoryData[];
  t: (key: string) => string;
}

export const AddQuestionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, existingCategories, t }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    subcategory: '',
    keywords: '',
    image: '',
    video: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addNewItem(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        question: '',
        answer: '',
        category: '',
        subcategory: '',
        keywords: '',
        image: '',
        video: ''
      });
    } catch (error) {
      console.error(error);
      alert('Error saving data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-squad-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-squad-softPurple">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-squad-primary">{t('addQuestion')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('addQuestionSubtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-grow">
          
          {/* Question & Answer */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-squad-primary mb-1">{t('questionLabel')}</label>
              <div className="relative">
                <Type className="absolute top-3 rtl:right-3 ltr:left-3 text-gray-400 w-5 h-5" />
                <input 
                  required
                  type="text" 
                  className="w-full bg-squad-bg/30 border border-gray-200 rounded-lg p-3 rtl:pr-10 ltr:pl-10 focus:ring-2 focus:ring-squad-orange focus:border-transparent transition-all"
                  placeholder={t('questionPlaceholder')}
                  value={formData.question}
                  onChange={e => setFormData({...formData, question: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-squad-primary mb-1">{t('answerLabel')}</label>
              <textarea 
                required
                rows={5}
                className="w-full bg-squad-bg/30 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-squad-orange focus:border-transparent transition-all"
                placeholder={t('answerPlaceholder')}
                value={formData.answer}
                onChange={e => setFormData({...formData, answer: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-squad-primary mb-1">{t('categoryLabel')}</label>
              <div className="relative">
                <List className="absolute top-3 rtl:right-3 ltr:left-3 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  list="categories"
                  required
                  className="w-full bg-squad-bg/30 border border-gray-200 rounded-lg p-3 rtl:pr-10 ltr:pl-10 focus:ring-2 focus:ring-squad-orange focus:border-transparent"
                  placeholder={t('categoryPlaceholder')}
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
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
              <label className="block text-sm font-medium text-squad-primary mb-1">{t('subcategoryLabel')}</label>
              <div className="relative">
                <Tag className="absolute top-3 rtl:right-3 ltr:left-3 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  required
                  className="w-full bg-squad-bg/30 border border-gray-200 rounded-lg p-3 rtl:pr-10 ltr:pl-10 focus:ring-2 focus:ring-squad-orange focus:border-transparent"
                  placeholder={t('subcategoryPlaceholder')}
                  value={formData.subcategory}
                  onChange={e => setFormData({...formData, subcategory: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-squad-primary mb-1">{t('keywordsLabel')}</label>
            <input 
              type="text"
              className="w-full bg-squad-bg/30 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-squad-orange focus:border-transparent"
              placeholder={t('keywordsPlaceholder')}
              value={formData.keywords}
              onChange={e => setFormData({...formData, keywords: e.target.value})}
            />
          </div>

          {/* Media Attachments */}
          <div className="bg-squad-bg/50 p-4 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-squad-primary flex items-center gap-2">
              <Link className="w-4 h-4 text-squad-orange" />
              {t('attachmentsLabel')}
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('imageLink')}</label>
              <div className="relative">
                <ImageIcon className="absolute top-2.5 rtl:right-3 ltr:left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="url"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 rtl:pr-9 ltr:pl-9 text-sm focus:ring-2 focus:ring-squad-orange focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('videoLink')}</label>
              <div className="relative">
                <Video className="absolute top-2.5 rtl:right-3 ltr:left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="url"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 rtl:pr-9 ltr:pl-9 text-sm focus:ring-2 focus:ring-squad-orange focus:border-transparent"
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.video}
                  onChange={e => setFormData({...formData, video: e.target.value})}
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
            {t('cancel')}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-squad-primary text-white font-medium hover:bg-squad-primary/90 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-squad-primary/20"
          >
            {isSubmitting ? (
              <>{t('saving')}...</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('save')}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};