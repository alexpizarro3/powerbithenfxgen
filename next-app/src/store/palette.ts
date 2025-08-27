import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Color, SemanticTokens } from '@/lib/colors';

interface PaletteState {
  // Core state
  colors: Color[];
  themeName: string;
  isGenerating: boolean;
  
  // UI state
  selectedColorIndex: number | null;
  showExportModal: boolean;
  showImportModal: boolean;
  viewMode: 'palette' | 'preview';
  compactMode: boolean;
  
  // Semantic mappings
  semanticTokens: SemanticTokens;
  
  // Actions
  setColors: (colors: Color[]) => void;
  updateColor: (index: number, hex: string) => void;
  toggleColorLock: (index: number) => void;
  addColor: (color?: Partial<Color>) => void;
  removeColor: (index: number) => void;
  reorderColors: (startIndex: number, endIndex: number) => void;
  generateNewPalette: () => void;
  shuffleUnlocked: () => void;
  
  // Theme actions
  setThemeName: (name: string) => void;
  
  // UI actions
  setSelectedColorIndex: (index: number | null) => void;
  setShowExportModal: (show: boolean) => void;
  setShowImportModal: (show: boolean) => void;
  setViewMode: (mode: 'palette' | 'preview') => void;
  setCompactMode: (value: boolean) => void;
  toggleCompactMode: () => void;
  
  // Semantic actions
  setSemanticTokens: (tokens: SemanticTokens) => void;
  updateSemanticToken: (key: keyof SemanticTokens, value: string) => void;
}

export const usePaletteStore = create<PaletteState>()(
  devtools(
    (set, get) => ({
      // Initial state
      colors: [],
      themeName: 'Untitled Theme',
      isGenerating: false,
      selectedColorIndex: null,
      showExportModal: false,
      showImportModal: false,
      viewMode: 'palette',
  compactMode: false,
      semanticTokens: {
        primary: '#3b82f6',
        accent: '#10b981',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#64748b',
      },

      // Color actions
      setColors: (colors) => 
        set({ colors }, false, 'setColors'),

      updateColor: (index, hex) =>
        set((state) => ({
          colors: state.colors.map((color, i) =>
            i === index ? { ...color, hex } : color
          ),
        }), false, 'updateColor'),

      toggleColorLock: (index) =>
        set((state) => ({
          colors: state.colors.map((color, i) =>
            i === index ? { ...color, locked: !color.locked } : color
          ),
        }), false, 'toggleColorLock'),

      addColor: (colorData) =>
        set((state) => ({
          colors: [
            ...state.colors,
            {
              hex: colorData?.hex || '#ffffff',
              locked: colorData?.locked || false,
              id: colorData?.id || `color-${Date.now()}`,
            },
          ],
        }), false, 'addColor'),

      removeColor: (index) =>
        set((state) => ({
          colors: state.colors.filter((_, i) => i !== index),
          selectedColorIndex: 
            state.selectedColorIndex === index ? null : 
            state.selectedColorIndex && state.selectedColorIndex > index ? 
            state.selectedColorIndex - 1 : state.selectedColorIndex,
        }), false, 'removeColor'),

      reorderColors: (startIndex, endIndex) =>
        set((state) => {
          const newColors = [...state.colors];
          const [reorderedItem] = newColors.splice(startIndex, 1);
          newColors.splice(endIndex, 0, reorderedItem);
          return { colors: newColors };
        }, false, 'reorderColors'),

      generateNewPalette: () => {
        set({ isGenerating: true }, false, 'generateNewPalette:start');
        
        // Simulate async generation
        setTimeout(() => {
          const { generateRandomPalette } = require('@/lib/colors');
          const newColors = generateRandomPalette(8);
          set({ 
            colors: newColors,
            isGenerating: false 
          }, false, 'generateNewPalette:complete');
        }, 300);
      },

      shuffleUnlocked: () => {
        const { generateRandomPalette } = require('@/lib/colors');
        const state = get();
        const randoms = generateRandomPalette(state.colors.length);
        set({
          colors: state.colors.map((c, i) => c.locked ? c : { ...c, hex: randoms[i].hex }),
        }, false, 'shuffleUnlocked');
      },

      // Theme actions
      setThemeName: (name) =>
        set({ themeName: name }, false, 'setThemeName'),

      // UI actions
      setSelectedColorIndex: (index) =>
        set({ selectedColorIndex: index }, false, 'setSelectedColorIndex'),

      setShowExportModal: (show) =>
        set({ showExportModal: show }, false, 'setShowExportModal'),

      setShowImportModal: (show) =>
        set({ showImportModal: show }, false, 'setShowImportModal'),

      setViewMode: (mode) =>
        set({ viewMode: mode }, false, 'setViewMode'),

      setCompactMode: (value) =>
        set({ compactMode: value }, false, 'setCompactMode'),

      toggleCompactMode: () =>
        set((state) => ({ compactMode: !state.compactMode }), false, 'toggleCompactMode'),

      // Semantic actions
      setSemanticTokens: (tokens) =>
        set({ semanticTokens: tokens }, false, 'setSemanticTokens'),

      updateSemanticToken: (key, value) =>
        set((state) => ({
          semanticTokens: {
            ...state.semanticTokens,
            [key]: value,
          },
        }), false, 'updateSemanticToken'),
    }),
    {
      name: 'palette-store',
    }
  )
);
