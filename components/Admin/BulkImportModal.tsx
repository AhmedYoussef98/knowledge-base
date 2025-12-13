import React, { useState, useCallback, useRef } from 'react';
import {
  X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2,
  Loader2, AlertTriangle, ChevronLeft, ChevronRight, FileX
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';
import { ParsedRow, ImportStep, ImportResult, KnowledgeItem } from '../../types';
import { bulkAddItems, checkDuplicateQuestions } from '../../services/api';
import {
  parseFile, validateAllRows, downloadCSVTemplate, downloadXLSXTemplate, downloadErrorReport
} from '../../utils/bulkImport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const BulkImportModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, tenantId }) => {
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setParsedRows([]);
    setIsLoading(false);
    setImportResult(null);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);

    // Validate file type
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
      setError(t('bulkImport.invalidFormat'));
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(t('bulkImport.fileTooLarge'));
      return;
    }

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const { data } = await parseFile(selectedFile);

      if (data.length === 0) {
        setError(t('bulkImport.emptyFile'));
        setFile(null);
        setIsLoading(false);
        return;
      }

      // Validate all rows
      const validated = validateAllRows(data);

      // Check for duplicates
      const questions = validated
        .filter(r => r.isValid)
        .map(r => r.data.question || '');

      const duplicates = await checkDuplicateQuestions(tenantId, questions);

      // Mark duplicates
      const withDuplicates = validated.map(row => ({
        ...row,
        isDuplicate: row.isValid && duplicates.has((row.data.question || '').toLowerCase().trim())
      }));

      setParsedRows(withDuplicates);
      setStep('preview');
    } catch (err) {
      console.error('Parse error:', err);
      setError(t('bulkImport.parseError'));
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setIsLoading(true);

    try {
      // Filter valid, non-duplicate rows
      const itemsToImport = parsedRows
        .filter(row => row.isValid && !row.isDuplicate)
        .map(row => row.data as Omit<KnowledgeItem, 'id' | 'views' | 'tenant_id'>);

      if (itemsToImport.length === 0) {
        setImportResult({
          success: 0,
          skipped: parsedRows.filter(r => r.isDuplicate).length,
          failed: parsedRows.filter(r => !r.isValid).length,
          errors: []
        });
        setStep('complete');
        return;
      }

      const result = await bulkAddItems(tenantId, itemsToImport);

      // Add skipped duplicates to result
      result.skipped += parsedRows.filter(r => r.isDuplicate).length;

      setImportResult(result);
      setStep('complete');

      if (result.success > 0) {
        onSuccess();
      }
    } catch (err) {
      console.error('Import error:', err);
      setImportResult({
        success: 0,
        skipped: 0,
        failed: parsedRows.length,
        errors: [{ row: 0, message: String(err) }]
      });
      setStep('complete');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const validCount = parsedRows.filter(r => r.isValid && !r.isDuplicate).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const duplicateCount = parsedRows.filter(r => r.isDuplicate).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-daleel-tech-slate border border-daleel-cyan/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-6 border-b border-daleel-cyan/20 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-daleel-pure-light" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
              {t('bulkImport.title')}
            </h2>
            <p className="text-sm text-daleel-pure-light/70 mt-1">
              {step === 'upload' && t('bulkImport.uploadDescription')}
              {step === 'preview' && t('bulkImport.previewDescription')}
              {step === 'importing' && t('bulkImport.importingDescription')}
              {step === 'complete' && t('bulkImport.completeDescription')}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-daleel-deep-space rounded-full transition-colors"
          >
            <X className="text-daleel-pure-light/70 w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-daleel-cyan/10 flex items-center justify-center gap-2">
          {(['upload', 'preview', 'importing', 'complete'] as ImportStep[]).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s
                    ? 'bg-daleel-neon text-daleel-deep-space'
                    : i < ['upload', 'preview', 'importing', 'complete'].indexOf(step)
                    ? 'bg-daleel-green/30 text-daleel-green'
                    : 'bg-daleel-deep-space text-daleel-pure-light/50'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div
                  className={`w-12 h-0.5 ${
                    i < ['upload', 'preview', 'importing', 'complete'].indexOf(step)
                      ? 'bg-daleel-green/30'
                      : 'bg-daleel-deep-space'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-daleel-neon bg-daleel-neon/10'
                    : 'border-daleel-cyan/30 hover:border-daleel-cyan/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {isLoading ? (
                  <div className="py-4">
                    <Loader2 className="w-12 h-12 mx-auto text-daleel-neon animate-spin" />
                    <p className="text-daleel-pure-light/70 mt-4">{t('bulkImport.parsing')}</p>
                  </div>
                ) : (
                  <>
                    <FileSpreadsheet className="w-16 h-16 mx-auto text-daleel-cyan/50 mb-4" />
                    <p className="text-daleel-pure-light text-lg font-medium mb-2">
                      {t('bulkImport.dragDrop')}
                    </p>
                    <p className="text-daleel-pure-light/50 mb-4">{t('bulkImport.orBrowse')}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-daleel-neon text-daleel-deep-space rounded-lg font-bold hover:bg-daleel-green transition-colors"
                    >
                      <Upload className="w-4 h-4 inline-block mr-2" />
                      {t('bulkImport.selectFile')}
                    </button>
                    <p className="text-daleel-pure-light/40 text-sm mt-4">
                      {t('bulkImport.supportedFormats')}
                    </p>
                  </>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Template Download */}
              <div className="bg-daleel-deep-space rounded-xl p-4">
                <h3 className="text-daleel-pure-light font-medium mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4 text-daleel-cyan" />
                  {t('bulkImport.downloadTemplate')}
                </h3>
                <p className="text-daleel-pure-light/60 text-sm mb-4">
                  {t('bulkImport.templateDescription')}
                </p>
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={downloadCSVTemplate}
                    className="px-4 py-2 bg-daleel-tech-slate border border-daleel-cyan/30 text-daleel-pure-light rounded-lg hover:border-daleel-cyan transition-colors text-sm font-medium"
                  >
                    CSV
                  </button>
                  <button
                    onClick={downloadXLSXTemplate}
                    className="px-4 py-2 bg-daleel-tech-slate border border-daleel-cyan/30 text-daleel-pure-light rounded-lg hover:border-daleel-cyan transition-colors text-sm font-medium"
                  >
                    XLSX
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-daleel-green/10 border border-daleel-green/30 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-daleel-green mb-2" />
                  <p className="text-2xl font-bold text-daleel-green">{validCount}</p>
                  <p className="text-daleel-pure-light/60 text-sm">{t('bulkImport.validRows')}</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <AlertTriangle className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold text-yellow-500">{duplicateCount}</p>
                  <p className="text-daleel-pure-light/60 text-sm">{t('bulkImport.duplicateRows')}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <FileX className="w-6 h-6 mx-auto text-red-400 mb-2" />
                  <p className="text-2xl font-bold text-red-400">{invalidCount}</p>
                  <p className="text-daleel-pure-light/60 text-sm">{t('bulkImport.invalidRows')}</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-daleel-deep-space rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-daleel-tech-slate sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-daleel-pure-light/70 font-medium">#</th>
                        <th className="px-4 py-3 text-left text-daleel-pure-light/70 font-medium">{t('bulkImport.status')}</th>
                        <th className="px-4 py-3 text-left text-daleel-pure-light/70 font-medium">{t('admin.question')}</th>
                        <th className="px-4 py-3 text-left text-daleel-pure-light/70 font-medium">{t('admin.category')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`border-t border-daleel-cyan/10 ${
                            !row.isValid ? 'bg-red-500/5' : row.isDuplicate ? 'bg-yellow-500/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-daleel-pure-light/50">{row.rowIndex}</td>
                          <td className="px-4 py-3">
                            {!row.isValid ? (
                              <span className="text-red-400 text-xs">{row.errors.join(', ')}</span>
                            ) : row.isDuplicate ? (
                              <span className="text-yellow-500 text-xs">{t('bulkImport.duplicate')}</span>
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-daleel-green" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-daleel-pure-light max-w-xs truncate">
                            {row.data.question || '-'}
                          </td>
                          <td className="px-4 py-3 text-daleel-pure-light/70">
                            {row.data.category || t('bulkImport.defaultCategory')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {validCount === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-500">{t('bulkImport.noValidRows')}</p>
                </div>
              )}
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="py-12 text-center">
              <Loader2 className="w-16 h-16 mx-auto text-daleel-neon animate-spin mb-6" />
              <p className="text-daleel-pure-light text-xl font-medium mb-2">
                {t('bulkImport.importing')}
              </p>
              <p className="text-daleel-pure-light/60">
                {t('bulkImport.pleaseWait')}
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && importResult && (
            <div className="space-y-6">
              {/* Result Summary */}
              <div className="text-center py-6">
                {importResult.success > 0 ? (
                  <CheckCircle2 className="w-16 h-16 mx-auto text-daleel-green mb-4" />
                ) : (
                  <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
                )}
                <h3 className="text-2xl font-bold text-daleel-pure-light mb-2">
                  {importResult.success > 0 ? t('bulkImport.importSuccess') : t('bulkImport.importFailed')}
                </h3>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-daleel-green/10 border border-daleel-green/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-daleel-green">{importResult.success}</p>
                  <p className="text-daleel-pure-light/60 text-sm">{t('bulkImport.imported')}</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-500">{importResult.skipped}</p>
                  <p className="text-daleel-pure-light/60 text-sm">{t('bulkImport.skipped')}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-400">{importResult.failed}</p>
                  <p className="text-daleel-pure-light/60 text-sm">{t('bulkImport.failed')}</p>
                </div>
              </div>

              {/* Error Report Download */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">{t('bulkImport.errorsOccurred')}</span>
                    </div>
                    <button
                      onClick={() => downloadErrorReport(importResult.errors)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4 inline-block mr-2" />
                      {t('bulkImport.downloadErrors')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t border-daleel-cyan/20 flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            {step === 'preview' && (
              <button
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setParsedRows([]);
                }}
                className={`px-5 py-2.5 rounded-lg border border-daleel-cyan/30 text-daleel-pure-light font-medium hover:bg-daleel-deep-space transition-colors flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {t('common.back')}
              </button>
            )}
          </div>

          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {step === 'complete' ? (
              <>
                <button
                  onClick={resetState}
                  className="px-5 py-2.5 rounded-lg border border-daleel-cyan/30 text-daleel-pure-light font-medium hover:bg-daleel-deep-space transition-colors"
                >
                  {t('bulkImport.importMore')}
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-lg bg-daleel-neon text-daleel-deep-space font-bold hover:bg-daleel-green transition-colors"
                >
                  {t('common.close')}
                </button>
              </>
            ) : step === 'preview' ? (
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className={`px-5 py-2.5 rounded-lg bg-daleel-neon text-daleel-deep-space font-bold hover:bg-daleel-green transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                {t('bulkImport.importNow')} ({validCount})
                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : step === 'upload' ? (
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-lg border border-daleel-cyan/30 text-daleel-pure-light font-medium hover:bg-daleel-deep-space transition-colors"
              >
                {t('common.cancel')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
