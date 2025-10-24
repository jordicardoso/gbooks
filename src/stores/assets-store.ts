// src/stores/assets-store.ts

import { defineStore } from 'pinia';

export interface AssetState {
  assets: string[];
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
      if (!bookId || this.currentBookId === bookId) {
        return;
      }

      this.isLoading = true;
      this.currentBookId = bookId;
      try {
        // Llama a la función del backend de Electron
        const assetList = await window.electronAPI.listAssets(bookId);
        this.assets = assetList;
      } catch (error) {
        console.error(`Error al cargar los assets para el libro ${bookId}:`, error);
        this.assets = []; // En caso de error, vaciamos la lista
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Añade un nuevo asset al libro actual.
     * @param file - El fichero a subir.
     */
    async addAsset(file: File) {
      if (!this.currentBookId) {
        throw new Error('No hay un libro seleccionado para añadir el asset.');
      }

      try {
        const fileData = await file.arrayBuffer();
        const result = await window.electronAPI.addAsset(
          this.currentBookId,
          file.name,
          fileData
        );

        if (result.success && result.filename) {
          this.assets.push(result.filename);
        } else {
          throw new Error(result.error || 'Error desconocido al añadir el asset.');
        }
      } catch (error) {
        console.error('Error en la acción addAsset:', error);
        throw error;
      }
    },

    /**
     * Elimina un asset del libro actual.
     * @param filename - El nombre del fichero a eliminar.
     */
    async deleteAsset(filename: string) {
      if (!this.currentBookId) {
        throw new Error('No hay un libro seleccionado para eliminar el asset.');
      }

      try {
        const result = await window.electronAPI.deleteAsset(this.currentBookId, filename);
        if (result.success) {
          const index = this.assets.indexOf(filename);
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

    /**
     * Limpia el store cuando se sale de la vista de un libro.
     */
    clearAssets() {
      this.assets = [];
      this.currentBookId = null;
      this.isLoading = false;
    },
  },
});
