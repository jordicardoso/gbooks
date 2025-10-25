// src/stores/assets-store.ts

import { defineStore } from 'pinia';

export interface Asset {
  id: string;
  name: string;
  category: string;
  type: 'image';
  filename: string;
  creationDate: string;
}

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
    // Devuelve la URL completa para un asset, usando el protocolo personalizado
    getAssetUrl: (state) => (filename: string) => {
      if (!state.currentBookId || !filename) {
        return '';
      }
      return `gbooks-asset://${state.currentBookId}/${filename}`;
    },
  },

  actions: {
    /**
     * Carga los assets para un libro específico.
     * Si el bookId es el mismo que ya está cargado, no hace nada.
     * @param bookId - El ID del libro del que se cargarán los assets.
     */
    async loadAssets(bookId: string) {
      if (!bookId) return;

      this.isLoading = true;
      this.currentBookId = bookId;
      try {
        // La API de Electron ahora devuelve Asset[]
        const assetList: Asset[] = await window.electronAPI.listAssets(bookId);
        this.assets = assetList;
      } catch (error) {
        console.error(`Error al cargar los assets para el libro ${bookId}:`, error);
        this.assets = [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Añade un nuevo asset al libro actual.
     * @param file - El fichero a subir.
     */
    async addAsset(bookId: string, file: File, name: string, category: string) {
      if (!bookId) {
        console.error('addAsset: bookId es nulo o indefinido.');
        return false;
      }
      try {
        const buffer = await file.arrayBuffer();
        const result: Asset | null = await window.electronAPI.saveAsset(bookId, {
          buffer,
          name,
          category,
          originalName: file.name,
          type: 'image',
        });

        if (result) {
          this.assets.push(result); // Ahora esto es consistente
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error en la acción addAsset:', error);
        return false;
      }
    },

    /**
     * Elimina un asset del libro actual.
     * @param filename - El nombre del fichero a eliminar.
     */
    async deleteAsset(assetId: string) {
      if (!this.currentBookId) {
        throw new Error('No hay un libro seleccionado para eliminar el asset.');
      }

      try {
        // La API de Electron ahora espera el assetId
        const result = await window.electronAPI.deleteAsset(this.currentBookId, assetId);
        if (result.success) {
          const index = this.assets.findIndex(asset => asset.id === assetId);
          if (index > -1) {
            this.assets.splice(index, 1);
          }
        } else {
          throw new Error(result.error || 'Error desconocido al eliminar el asset.');
        }
      } catch (error) {
        console.error('Error en la acción deleteAsset:', error);
        throw error;
      }
    },

    clearAssets() {
      this.assets = [];
      this.currentBookId = null;
      this.isLoading = false;
    },
  },
});
