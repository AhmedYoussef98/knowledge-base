import React, { useState } from 'react';
import { KnowledgeItem } from '../types';
import { ChevronDown, Copy, Check, Tag, Video, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { convertGoogleDriveUrl, isImage, isVideo, getCategoryColor } from '../utils/helpers';

interface Props {
  item: KnowledgeItem;
  categoryIndex: number;
  onView: (id: string) => void;
  t: any;
  lang: string;
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
      className={`bg-daleel-tech-slate rounded-xl shadow-lg border border-daleel-cyan/20 overflow-hidden hover:border-daleel-cyan/60 transition-all duration-300 ${isExpanded ? 'ring-2 ring-daleel-neon ring-opacity-50 glow-neon' : ''}`}
    >
      <div
        onClick={handleToggle}
        className={`p-4 cursor-pointer flex items-center justify-between group ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${categoryColorClass}`}>
            {item.category}
          </span>
          <h3 className={`font-semibold text-daleel-pure-light text-lg group-hover:text-daleel-neon transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
            {item.question}
          </h3>
        </div>

        <div className={`flex items-center gap-3 text-daleel-cyan ${isRTL ? 'flex-row-reverse' : ''}`}>
           {(item.image || item.video) && (
             <div className="flex gap-1">
               {item.video && <Video size={16} />}
               {item.image && <ImageIcon size={16} />}
             </div>
           )}
           <ChevronDown
             className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-daleel-neon' : ''}`}
           />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-daleel-deep-space/50 border-t border-daleel-cyan/20"
          >
            <div className="p-5">

              {/* Media Section */}
              {(item.image || item.video) && (
                <div className="mb-4 space-y-4">
                  {item.image && isImage(item.image) && (
                    <div className="rounded-lg overflow-hidden border border-daleel-cyan/30 shadow-lg glow-cyan">
                      <img src={convertGoogleDriveUrl(item.image)} alt="Content" className="w-full max-h-96 object-contain bg-daleel-deep-space" />
                    </div>
                  )}
                  {item.video && isVideo(item.video) && (
                    <div className="rounded-lg overflow-hidden border border-daleel-cyan/30 shadow-lg aspect-video glow-cyan">
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

              <div className={`prose prose-sm max-w-none text-daleel-pure-light/90 whitespace-pre-line leading-relaxed text-base ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                {item.answer}
              </div>

              <div className={`mt-6 flex items-center justify-between border-t border-daleel-cyan/20 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 text-xs text-daleel-pure-light/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Tag size={14} className="text-daleel-neon" />
                  <span>{item.subcategory}</span>
                  {item.keywords && (
                    <span className={`opacity-50 truncate max-w-[200px] ${isRTL ? 'mr-2' : 'ml-2'}`}>
                      ({item.keywords})
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    copied
                      ? 'bg-daleel-green/20 text-daleel-green border border-daleel-green/30'
                      : 'bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light hover:bg-daleel-neon hover:text-daleel-deep-space hover:border-daleel-neon glow-hover'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {typeof t === 'function' ? (copied ? t('kb.copied') : t('kb.copyAnswer')) : (copied ? 'Copied!' : 'Copy')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
