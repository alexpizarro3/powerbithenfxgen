'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePaletteStore } from '@/store/palette';
import { 
  RefreshCw, 
  Download, 
  Upload, 
  Palette,
  Eye,
  Settings,
  Shuffle
} from 'lucide-react';
import { generateRandomPalette } from '@/lib/colors';

export function Toolbar() {
  const { 
    generateNewPalette,
    setShowExportModal,
    setShowImportModal,
    setViewMode,
    viewMode,
    isGenerating,
    colors,
    setColors
  } = usePaletteStore();

  const handleGenerateFromCoolors = () => {
    // Generate using Coolors.co inspired algorithm
    const newPalette = generateRandomPalette(colors.length || 5);
    setColors(newPalette);
  };

  const handleShufflePalette = () => {
    const unlockedColors = colors.map((color, index) => ({
      ...color,
      hex: color.locked ? color.hex : generateRandomPalette(1)[0].hex
    }));
    setColors(unlockedColors);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      {/* Left Section - Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Palette className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            PBIX Theme Creator
          </h1>
          <p className="text-sm text-gray-500">
            Create beautiful Power BI themes
          </p>
        </div>
      </div>

      {/* Center Section - Generation Tools */}
      <div className="flex items-center gap-2">
        <motion.button
          onClick={handleGenerateFromCoolors}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          Generate
        </motion.button>

        <motion.button
          onClick={handleShufflePalette}
          disabled={isGenerating || colors.length === 0}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </motion.button>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('palette')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'palette'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            Editor
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {/* Import Button */}
        <motion.button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload className="w-4 h-4" />
          Import
        </motion.button>

        {/* Export Button */}
        <motion.button
          onClick={() => setShowExportModal(true)}
          disabled={colors.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      </div>
    </div>
  );
}
