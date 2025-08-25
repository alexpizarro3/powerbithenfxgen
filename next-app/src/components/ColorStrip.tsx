'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Color } from '@/lib/colors';
import { usePaletteStore } from '@/store/palette';
import { Lock, Unlock, Trash2, Copy, RefreshCw } from 'lucide-react';

interface ColorStripProps {
  color: Color;
  index: number;
  isSelected?: boolean;
  className?: string;
}

export function ColorStrip({ color, index, isSelected = false, className }: ColorStripProps) {
  const { 
    updateColor, 
    toggleColorLock, 
    removeColor, 
    setSelectedColorIndex,
    colors 
  } = usePaletteStore();

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateColor(index, event.target.value);
  };

  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
      // TODO: Add toast notification
    } catch (error) {
      console.error('Failed to copy color:', error);
    }
  };

  const handleRemove = () => {
    if (colors.length > 1) {
      removeColor(index);
    }
  };

  const handleClick = () => {
    setSelectedColorIndex(isSelected ? null : index);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'group relative flex-1 min-h-[200px] cursor-pointer transition-all duration-200',
        'border border-gray-200 hover:border-gray-300',
        isSelected && 'ring-2 ring-blue-500 border-blue-500',
        className
      )}
      style={{ backgroundColor: color.hex }}
      onClick={handleClick}
    >
      {/* Color Input (Hidden) */}
      <input
        type="color"
        value={color.hex}
        onChange={handleColorChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label={`Color ${index + 1}: ${color.hex}`}
      />

      {/* Color Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-3 transition-all duration-200 transform translate-y-full group-hover:translate-y-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-medium text-gray-900 truncate">
              {color.hex.toUpperCase()}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Lock/Unlock Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleColorLock(index);
              }}
              className={cn(
                'p-1.5 rounded transition-colors',
                color.locked 
                  ? 'text-amber-600 hover:bg-amber-50' 
                  : 'text-gray-400 hover:bg-gray-100'
              )}
              aria-label={color.locked ? 'Unlock color' : 'Lock color'}
            >
              {color.locked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>

            {/* Copy Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyHex();
              }}
              className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Copy hex code"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Remove Button */}
            {colors.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                aria-label="Remove color"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lock Indicator */}
      {color.locked && (
        <div className="absolute top-2 right-2">
          <div className="bg-amber-100 text-amber-800 p-1 rounded-full">
            <Lock className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          layoutId="selected-indicator"
          className="absolute inset-0 border-2 border-blue-500"
          initial={false}
        />
      )}
    </motion.div>
  );
}
