import React, { useState } from 'react';
import { Sparkles, Wand2, Undo2, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';
import {
  FieldType,
  AIFieldContext,
  generateFieldContent,
  enhanceFieldContent
} from '../../services/aiFieldHelper';

interface Props {
  fieldType: FieldType;
  currentValue: string;
  originalValue: string;
  hasAIChanged: boolean;
  onUpdate: (newValue: string) => void;
  onMarkAIChanged: () => void;
  onRevert: () => void;
  context: AIFieldContext;
  geminiApiKey?: string;
  disabled?: boolean;
  compact?: boolean; // For smaller fields like category/subcategory
}

type LoadingState = 'idle' | 'generating' | 'enhancing';

export const FieldAIButtons: React.FC<Props> = ({
  fieldType,
  currentValue,
  originalValue,
  hasAIChanged,
  onUpdate,
  onMarkAIChanged,
  onRevert,
  context,
  geminiApiKey,
  disabled = false,
  compact = false
}) => {
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const isEmpty = !currentValue.trim();
  const hasContent = !isEmpty;
  const isLoading = loadingState !== 'idle';
  const noApiKey = !geminiApiKey;

  // Button states
  const canGenerate = isEmpty && !isLoading && !disabled && !noApiKey;
  const canEnhance = hasContent && !isLoading && !disabled && !noApiKey;
  const canRevert = hasAIChanged && !isLoading && !disabled;

  const handleGenerate = async () => {
    if (!canGenerate || !geminiApiKey) return;

    setLoadingState('generating');
    setError(null);

    const result = await generateFieldContent(geminiApiKey, fieldType, context);

    if (result.success && result.content) {
      onUpdate(result.content);
      onMarkAIChanged();
    } else {
      setError(result.error || t('aiField.error'));
    }

    setLoadingState('idle');
  };

  const handleEnhance = async () => {
    if (!canEnhance || !geminiApiKey) return;

    setLoadingState('enhancing');
    setError(null);

    const result = await enhanceFieldContent(geminiApiKey, fieldType, currentValue, context);

    if (result.success && result.content && result.content !== currentValue) {
      onUpdate(result.content);
      onMarkAIChanged();
    } else if (!result.success) {
      setError(result.error || t('aiField.error'));
    }

    setLoadingState('idle');
  };

  const handleRevert = () => {
    if (!canRevert) return;
    onRevert();
    setError(null);
  };

  const buttonBaseClass = compact
    ? 'p-1 rounded transition-all'
    : 'p-1.5 rounded-lg transition-all';

  const enabledClass = 'hover:bg-blue-100 text-blue-600 cursor-pointer';
  const disabledClass = 'text-gray-300 cursor-not-allowed';
  const loadingClass = 'text-blue-400 cursor-wait';

  const getTooltip = (type: 'generate' | 'enhance' | 'revert'): string => {
    if (noApiKey) return t('aiField.noApiKey');
    if (type === 'generate') {
      return isEmpty ? t('aiField.generate') : t('aiField.generateDisabled');
    }
    if (type === 'enhance') {
      return hasContent ? t('aiField.enhance') : t('aiField.enhanceDisabled');
    }
    if (type === 'revert') {
      return hasAIChanged ? t('aiField.revert') : t('aiField.revertDisabled');
    }
    return '';
  };

  return (
    <div className={`flex items-center gap-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        title={getTooltip('generate')}
        className={`${buttonBaseClass} ${
          loadingState === 'generating'
            ? loadingClass
            : canGenerate
            ? enabledClass
            : disabledClass
        }`}
      >
        {loadingState === 'generating' ? (
          <Loader2 className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin`} />
        ) : (
          <Sparkles className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
      </button>

      {/* Enhance Button */}
      <button
        type="button"
        onClick={handleEnhance}
        disabled={!canEnhance}
        title={getTooltip('enhance')}
        className={`${buttonBaseClass} ${
          loadingState === 'enhancing'
            ? loadingClass
            : canEnhance
            ? enabledClass
            : disabledClass
        }`}
      >
        {loadingState === 'enhancing' ? (
          <Loader2 className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin`} />
        ) : (
          <Wand2 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
      </button>

      {/* Revert Button */}
      <button
        type="button"
        onClick={handleRevert}
        disabled={!canRevert}
        title={getTooltip('revert')}
        className={`${buttonBaseClass} ${
          canRevert ? 'hover:bg-orange-100 text-orange-500 cursor-pointer' : disabledClass
        }`}
      >
        <Undo2 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>

      {/* Error indicator */}
      {error && (
        <span className="text-red-500 text-xs ml-1" title={error}>
          !
        </span>
      )}
    </div>
  );
};
