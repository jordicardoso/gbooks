// src/stores/assets-store.ts

import { defineStore } from 'pinia';
import { useBookStore } from './book-store';
import { type Asset } from './types'; // Importamos tipos

export interface AssetState {
  assets: Asset[];
  currentBookId: string | null;
  isLoading: boolean;
}

export const useAssetsStore = defineStore('assets', {
  state: (): AssetState => ({
    assets: [],
    currentBookId: null,
    isLoading: false,
  }),

  getters: {
    // Los getters no cambian
    getAssetUrl: (state) => (filename: string): string => {
      if (!state.currentBookId || !filename) return '';
      return `gbooks-asset://${state.currentBookId}/${filename}`;
    },
    getAssetById: (state) => (assetId: string): Asset | undefined => {
      return state.assets.find(asset => asset.id === assetId);
    },
    getUniqueCategories: (state): string[] => {
      if (!state.assets || state.assets.length === 0) return [];
      const categories = state.assets.map(asset => asset.category);
      return [...new Set(categories)];
    },
  },

  actions: {
    /**
     * Acción de inicialización. Llamada por book-store.
     */
    setAssets(bookId: string, assets: Asset[]) {
      this.currentBookId = bookId;
      this.assets = assets;
    },

    /**
     * Limpia el estado del store.
     */
    clearAssets() {
      this.assets = [];
      this.currentBookId = null;
    },

    /**
     * Añade un nuevo asset, lo guarda en disco, y notifica al book-store.
     */
    async addAsset(file: File, name: string, category: string): Promise<Asset | null> {
      if (!this.currentBookId) return null;
      this.isLoading = true;
      try {
        const buffer = await file.arrayBuffer();
        const newAsset = await window.electronAPI.saveAsset(this.currentBookId, {
          buffer, name, category, originalName: file.name, type: 'image',
        });

        if (newAsset) {
          this.assets.push(newAsset);
          // Notifica al orquestador que hay cambios
          useBookStore().setDirty();
          return newAsset;
        }
        return null;
      } catch (error) {
        console.error('Error en la acción addAsset:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Actualiza un asset, lo guarda en disco y notifica al book-store.
     */
    async updateAsset(assetId: string, updates: { name: string; category: string }) {
      if (!this.currentBookId) throw new Error('No hay libro seleccionado.');
      this.isLoading = true;
      try {
        const updatedAsset = await window.electronAPI.updateAsset(this.currentBookId, assetId, updates);
        if (updatedAsset) {
          const index = this.assets.findIndex(a => a.id === assetId);
          if (index > -1) this.assets[index] = updatedAsset;
          // Notifica al orquestador que hay cambios
          useBookStore().setDirty();
        }
      } catch (error) {
        console.error('Error en la acción updateAsset:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Elimina un asset, lo borra del disco y notifica al book-store.
     */
    async deleteAsset(assetId: string) {
      if (!this.currentBookId) throw new Error('No hay libro seleccionado.');
      this.isLoading = true;
      try {
        const result = await window.electronAPI.deleteAsset(this.currentBookId, assetId);
        if (result.success) {
          const index = this.assets.findIndex(asset => asset.id === assetId);
          if (index > -1) this.assets.splice(index, 1);
          // Notifica al orquestador que hay cambios
          useBookStore().setDirty();
        } else {
          throw new Error(result.error || 'Error desconocido al eliminar.');
        }
      } catch (error) {
        console.error('Error en la acción deleteAsset:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
