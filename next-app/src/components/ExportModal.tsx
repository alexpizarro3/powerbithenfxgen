'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaletteStore } from '@/store/palette';
import { X, Download, Copy, FileDown } from 'lucide-react';
import { convertToPowerBITheme, generateCSSVariables, mapToSemanticTokens } from '@/lib/colors';
import { toast } from 'sonner';

export function ExportModal() {
  const { 
    showExportModal, 
    setShowExportModal, 
    colors, 
    themeName,
    semanticTokens 
  } = usePaletteStore();

  const [exportFormat, setExportFormat] = React.useState<'powerbi' | 'css' | 'json'>('powerbi');
  const [copySuccess, setCopySuccess] = React.useState(false);

  if (!showExportModal) return null;

  const handleExport = () => {
    let content = '';
    let filename = '';
    let contentType = 'application/json';

    switch (exportFormat) {
      case 'powerbi':
        const powerBITheme = convertToPowerBITheme(colors, themeName);
        content = JSON.stringify(powerBITheme, null, 2);
        filename = `${themeName.replace(/\s+/g, '_').toLowerCase()}_theme.json`;
        break;
      
      case 'css':
        content = generateCSSVariables(colors, semanticTokens);
        filename = `${themeName.replace(/\s+/g, '_').toLowerCase()}_variables.css`;
        contentType = 'text/css';
        break;
      
      case 'json':
        content = JSON.stringify({
          name: themeName,
          colors: colors.map(c => c.hex),
          semanticTokens
        }, null, 2);
        filename = `${themeName.replace(/\s+/g, '_').toLowerCase()}_palette.json`;
        break;
    }

    // Download file
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${filename}`);
  };

  const handleCopy = async () => {
    let content = '';

    switch (exportFormat) {
      case 'powerbi':
        const powerBITheme = convertToPowerBITheme(colors, themeName);
        content = JSON.stringify(powerBITheme, null, 2);
        break;
      
      case 'css':
        content = generateCSSVariables(colors, semanticTokens);
        break;
      
      case 'json':
        content = JSON.stringify({
          name: themeName,
          colors: colors.map(c => c.hex),
          semanticTokens
        }, null, 2);
        break;
    }

    try {
  await navigator.clipboard.writeText(content);
  setCopySuccess(true);
  setTimeout(() => setCopySuccess(false), 2000);
  toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
  toast.error('Failed to copy');
    }
  };

  const getPreviewContent = () => {
    switch (exportFormat) {
      case 'powerbi':
        const powerBITheme = convertToPowerBITheme(colors, themeName);
        return JSON.stringify(powerBITheme, null, 2);
      
      case 'css':
        return generateCSSVariables(colors, semanticTokens);
      
      case 'json':
        return JSON.stringify({
          name: themeName,
          colors: colors.map(c => c.hex),
          semanticTokens
        }, null, 2);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowExportModal(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Theme</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose your preferred export format
              </p>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Format Selection */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setExportFormat('powerbi')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'powerbi'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">Power BI</div>
                  <div className="text-sm text-gray-500">Theme JSON</div>
                </div>
              </button>
              
              <button
                onClick={() => setExportFormat('css')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'css'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">CSS</div>
                  <div className="text-sm text-gray-500">Variables</div>
                </div>
              </button>
              
              <button
                onClick={() => setExportFormat('json')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'json'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">JSON</div>
                  <div className="text-sm text-gray-500">Palette Data</div>
                </div>
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {getPreviewContent()}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-500">
                {colors.length} colors • {themeName}
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    copySuccess
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Copy className="w-4 h-4" />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </motion.button>
                
                <motion.button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileDown className="w-4 h-4" />
                  Download
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
