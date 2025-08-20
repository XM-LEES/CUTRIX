import { create } from 'zustand';
import { StyleState, Style } from '../types';
import { styleService } from '../services';

export const useStyleStore = create<StyleState & {
  fetchStyles: () => Promise<void>;
  fetchStyle: (id: number) => Promise<void>;
  createStyle: (styleNumber: string) => Promise<void>;
  setCurrentStyle: (style: Style | null) => void;
}>((set) => ({
  styles: [],
  currentStyle: null,
  loading: false,
  error: null,

  fetchStyles: async () => {
    set({ loading: true, error: null });
    try {
      const styles = await styleService.getStyles();
      set({ styles, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchStyle: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const style = await styleService.getStyle(id);
      set({ currentStyle: style, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createStyle: async (styleNumber: string) => {
    set({ loading: true, error: null });
    try {
      const newStyle = await styleService.createStyle({ style_number: styleNumber });
      set((state) => ({
        styles: [...state.styles, newStyle],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setCurrentStyle: (style) => set({ currentStyle: style }),
}));