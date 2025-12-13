import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { KnowledgeItem, ParsedRow } from '../types';

// Template column names (strict order)
export const TEMPLATE_COLUMNS = ['question', 'answer', 'category', 'subcategory', 'keywords', 'image', 'video'];

// Sample data for template
const SAMPLE_ROW = {
  question: 'How do I reset my password?',
  answer: 'Click "Forgot Password" on the login page and follow the instructions sent to your email.',
  category: 'Account',
  subcategory: 'Security',
  keywords: 'password reset security login',
  image: '',
  video: ''
};

// ============================================
// FILE PARSING
// ============================================

export const parseCSV = (file: File): Promise<{ headers: string[]; data: Record<string, string>[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          data: results.data as Record<string, string>[]
        });
      },
      error: (error) => reject(error)
    });
  });
};

export const parseXLSX = (file: File): Promise<{ headers: string[]; data: Record<string, string>[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, {
          defval: '',
          raw: false
        });

        // Normalize headers to lowercase
        const normalizedData = jsonData.map(row => {
          const normalized: Record<string, string> = {};
          Object.entries(row).forEach(([key, value]) => {
            normalized[key.toLowerCase().trim()] = String(value || '');
          });
          return normalized;
        });

        const headers = Object.keys(normalizedData[0] || {});
        resolve({ headers, data: normalizedData });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const parseFile = async (file: File): Promise<{ headers: string[]; data: Record<string, string>[] }> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseXLSX(file);
  }

  throw new Error('Unsupported file format. Please use CSV or XLSX.');
};

// ============================================
// VALIDATION
// ============================================

export const validateRow = (row: Record<string, string>, rowIndex: number): ParsedRow => {
  const errors: string[] = [];

  // Only question is required
  const question = row.question?.trim() || '';
  if (!question) {
    errors.push('Question is required');
  }

  // Validate URLs if provided
  const imageUrl = row.image?.trim() || '';
  const videoUrl = row.video?.trim() || '';

  if (imageUrl && !isValidUrl(imageUrl)) {
    errors.push('Invalid image URL format');
  }

  if (videoUrl && !isValidUrl(videoUrl)) {
    errors.push('Invalid video URL format');
  }

  return {
    rowIndex,
    data: {
      question,
      answer: row.answer?.trim() || '',
      category: row.category?.trim() || '',
      subcategory: row.subcategory?.trim() || '',
      keywords: row.keywords?.trim() || '',
      image: imageUrl,
      video: videoUrl
    },
    isValid: errors.length === 0,
    errors
  };
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateAllRows = (data: Record<string, string>[]): ParsedRow[] => {
  return data.map((row, index) => validateRow(row, index + 1));
};

// ============================================
// TEMPLATE DOWNLOAD
// ============================================

const downloadFile = (content: string | Blob, filename: string, mimeType?: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadCSVTemplate = () => {
  const headers = TEMPLATE_COLUMNS.join(',');
  const sampleRow = TEMPLATE_COLUMNS.map(col => {
    const value = SAMPLE_ROW[col as keyof typeof SAMPLE_ROW] || '';
    // Escape commas and quotes in CSV
    if (value.includes(',') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }).join(',');

  const csv = `${headers}\n${sampleRow}`;
  downloadFile(csv, 'knowledge_base_template.csv', 'text/csv');
};

export const downloadXLSXTemplate = () => {
  const ws = XLSX.utils.json_to_sheet([SAMPLE_ROW], { header: TEMPLATE_COLUMNS });

  // Set column widths
  ws['!cols'] = [
    { wch: 40 }, // question
    { wch: 60 }, // answer
    { wch: 15 }, // category
    { wch: 15 }, // subcategory
    { wch: 30 }, // keywords
    { wch: 40 }, // image
    { wch: 40 }, // video
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'knowledge_base_template.xlsx');
};

// ============================================
// EXPORT DATA
// ============================================

export const exportToCSV = (data: KnowledgeItem[], filename: string = 'knowledge_base_export.csv') => {
  const exportData = data.map(item => ({
    question: item.question,
    answer: item.answer,
    category: item.category,
    subcategory: item.subcategory,
    keywords: item.keywords,
    image: item.image,
    video: item.video
  }));

  const csv = Papa.unparse(exportData, {
    columns: TEMPLATE_COLUMNS
  });

  downloadFile(csv, filename, 'text/csv');
};

export const exportToXLSX = (data: KnowledgeItem[], filename: string = 'knowledge_base_export.xlsx') => {
  const exportData = data.map(item => ({
    question: item.question,
    answer: item.answer,
    category: item.category,
    subcategory: item.subcategory,
    keywords: item.keywords,
    image: item.image,
    video: item.video
  }));

  const ws = XLSX.utils.json_to_sheet(exportData, { header: TEMPLATE_COLUMNS });

  // Set column widths
  ws['!cols'] = [
    { wch: 40 }, // question
    { wch: 60 }, // answer
    { wch: 15 }, // category
    { wch: 15 }, // subcategory
    { wch: 30 }, // keywords
    { wch: 40 }, // image
    { wch: 40 }, // video
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Knowledge Base');
  XLSX.writeFile(wb, filename);
};

// ============================================
// ERROR REPORT
// ============================================

export const downloadErrorReport = (errors: { row: number; message: string }[]) => {
  const csv = Papa.unparse(errors.map(e => ({
    'Row Number': e.row,
    'Error Message': e.message
  })));

  downloadFile(csv, 'import_errors.csv', 'text/csv');
};
