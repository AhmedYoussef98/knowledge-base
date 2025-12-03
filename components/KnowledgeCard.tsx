import React, { useState } from 'react';
import { KnowledgeItem } from '../types';
import { ChevronDown, Copy, Check, Tag, Video, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { convertGoogleDriveUrl, isImage, isVideo, getCategoryColor } from '../utils/helpers';

interface Props {
  item: KnowledgeItem;
  categoryIndex: number;
  onView: (id: string) => void;
  t: (key: string) => string;
  lang: 'ar' | 'en';
}

export const KnowledgeCard: React.FC<Props> = ({ item, categoryIndex, onView, t, lang }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (newState) {
      onView(item.id);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryColorClass = getCategoryColor(item.category, categoryIndex);
  const isRTL = lang === 'ar';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border border-squad-palePurple overflow-hidden hover:shadow-md transition-shadow duration-300 ${isExpanded ? 'ring-2 ring-squad-orange ring-opacity-50' : ''}`}
    >
      <div 
        onClick={handleToggle}
        className="p-4 cursor-pointer flex items-center justify-between group"
      >
        <div className="flex items-center gap-4 flex-1">
          <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${categoryColorClass}`}>
            {item.category}
          </span>
          <h3 className="font-semibold text-squad-primary text-lg group-hover:text-squad-orange transition-colors">
            {item.question}
          </h3>
        </div>
        
        <div className="flex items-center gap-3 text-squad-softPurple">
           {(item.image || item.video) && (
             <div className="flex gap-1">
               {item.video && <Video size={16} />}
               {item.image && <ImageIcon size={16} />}
             </div>
           )}
           <ChevronDown 
             className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-squad-orange' : ''}`} 
           />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-squad-bg/30 border-t border-gray-100"
          >
            <div className="p-5">
              
              {/* Media Section */}
              {(item.image || item.video) && (
                <div className="mb-4 space-y-4">
                  {item.image && isImage(item.image) && (
                    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <img src={convertGoogleDriveUrl(item.image)} alt="Content" className="w-full max-h-96 object-contain bg-black/5" />
                    </div>
                  )}
                  {item.video && isVideo(item.video) && (
                    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-video">
                      <iframe 
                        src={convertGoogleDriveUrl(item.video)} 
                        className="w-full h-full"
                        allowFullScreen
                        title="Video content"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed text-base">
                {item.answer}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Tag size={14} className="text-squad-orange" />
                  <span>{item.subcategory}</span>
                  {item.keywords && (
                    <span className="opacity-50 truncate max-w-[200px] ltr:ml-2 rtl:mr-2">
                      ({item.keywords})
                    </span>
                  )}
                </div>
                
                <button 
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    copied 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-squad-orange hover:text-white hover:border-squad-orange'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? t('copied') : t('copyAnswer')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};