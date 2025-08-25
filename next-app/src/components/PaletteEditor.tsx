'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaletteStore } from '@/store/palette';
import { ColorStrip } from './ColorStrip';
import { Plus } from 'lucide-react';
import { generateRandomColor } from '@/lib/colors';

export function PaletteEditor() {
  const { 
    colors, 
    selectedColorIndex, 
    addColor, 
    isGenerating 
  } = usePaletteStore();

  const handleAddColor = () => {
    addColor({
      hex: generateRandomColor(),
      locked: false,
      id: `color-${Date.now()}`,
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-stretch gap-0 min-h-[200px] bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <AnimatePresence mode="popLayout">
          {colors.map((color, index) => (
            <ColorStrip
              key={color.id}
              color={color}
              index={index}
              isSelected={selectedColorIndex === index}
            />
          ))}
        </AnimatePresence>

        {/* Add Color Button */}
        {colors.length < 12 && (
          <motion.button
            layout
            onClick={handleAddColor}
            disabled={isGenerating}
            className="flex-shrink-0 w-16 bg-gray-50 hover:bg-gray-100 border-l border-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-6 h-6 text-gray-400" />
          </motion.button>
        )}
      </div>

      {/* Color Count Indicator */}
      <div className="mt-2 text-center">
        <span className="text-sm text-gray-500">
          {colors.length} {colors.length === 1 ? 'color' : 'colors'}
          {colors.length < 12 && ' • Click + to add more'}
        </span>
      </div>
    </div>
  );
}
