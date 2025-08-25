'use client';

import React from 'react';
import { usePaletteStore } from '@/store/palette';
import { Toolbar } from '@/components/Toolbar';
import { PaletteEditor } from '@/components/PaletteEditor';
import { ExportModal } from '@/components/ExportModal';
import { generateRandomPalette } from '@/lib/colors';

export default function Home() {
  const { colors, setColors } = usePaletteStore();

  // Initialize with a random palette on first load
  React.useEffect(() => {
    if (colors.length === 0) {
      const initialPalette = generateRandomPalette(5);
      setColors(initialPalette);
    }
  }, [colors.length, setColors]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Toolbar */}
      <Toolbar />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Create Your Perfect Power BI Theme
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Generate beautiful, accessible color palettes for your Power BI reports. 
              Export as theme JSON files or CSS variables for seamless integration.
            </p>
          </div>

          {/* Palette Editor */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Color Palette
                </h3>
                <p className="text-gray-600">
                  Click on any color to edit it. Lock colors to preserve them when generating new palettes.
                </p>
              </div>
              
              <PaletteEditor />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-2">🎨 Generate</h4>
                <p className="text-gray-600 text-sm">
                  Create new random palettes or shuffle unlocked colors for inspiration.
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-2">🔒 Lock Colors</h4>
                <p className="text-gray-600 text-sm">
                  Preserve specific colors while exploring new combinations for the rest.
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-2">📁 Export</h4>
                <p className="text-gray-600 text-sm">
                  Download as Power BI theme JSON, CSS variables, or palette data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ExportModal />
    </div>
  );
}
