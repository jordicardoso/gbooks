// src/stores/book-store.ts

import { defineStore } from 'pinia';
import { useNodesStore } from './nodes-store'; // Importamos los stores módulo
import { useAssetsStore } from './assets-store';
import { type BookData, type BookMeta } from './types'; // Importamos tipos

export interface BookState {
  activeBook: BookData | null;
  activeBookId: string | null;
  isLoading: boolean;
  isDirty: boolean;
}

// La función de validación ahora es más simple
function validateAndRepairBookData(data: any): BookData {
  const defaults: BookData = {
    meta: { title: 'Sin Título', description: '', author: '' },
    nodes: [],
    edges: [],
    assets: [],
    variables: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
  if (!data || typeof data !== 'object') return defaults;
  return {
    meta: { ...defaults.meta, ...data.meta },
    nodes: Array.isArray(data.chapters) ? data.chapters : defaults.nodes,
    edges: Array.isArray(data.edges) ? data.edges : defaults.edges,
    assets: Array.isArray(data.assets) ? data.assets : defaults.assets,
    variables: Array.isArray(data.variables) ? data.variables : defaults.variables,
    viewport: { ...defaults.viewport, ...data.viewport },
  };
}

export const useBookStore = defineStore('book', {
  state: (): BookState => ({
    activeBook: null,
    activeBookId: null,
    isLoading: false,
    isDirty: false,
  }),

  actions: {
    async loadBookById(bookId: string) {
      if (!bookId) return;
      this.isLoading = true;
      this.isDirty = false;
      try {
        const content = await window.electronAPI.loadBook(bookId);
        const bookData = validateAndRepairBookData(JSON.parse(content));

        this.activeBook = bookData;
        this.activeBookId = bookId;

        // --- DISTRIBUCIÓN DE DATOS ---
        const nodesStore = useNodesStore();
        const assetsStore = useAssetsStore();

        nodesStore.setElements(bookData.nodes, bookData.edges);
        assetsStore.setAssets(bookId, bookData.assets);
        // Aquí llamarías a otros stores:
        // characterStore.setCharacters(bookData.characterSheets);
        // mapsStore.setMaps(bookData.maps);

      } catch (error) {
        console.error(`Error al cargar el libro con ID "${bookId}":`, error);
        this.clearBook();
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Recolecta los datos de todos los stores y guarda el libro.
     */
    async saveCurrentBook() {
      if (!this.activeBook || !this.activeBookId || !this.isDirty) {
        return;
      }
      this.isLoading = true;
      try {
        // --- RECOLECCIÓN DE DATOS ---
        const nodesStore = useNodesStore();
        const assetsStore = useAssetsStore();

        this.activeBook.nodes = nodesStore.nodes;
        this.activeBook.edges = nodesStore.edges;
        this.activeBook.assets = assetsStore.assets;
        this.activeBook.viewport = nodesStore.viewport;
        // Aquí recolectarías de otros stores...

        const content = JSON.stringify(this.activeBook, null, 2);
        await window.electronAPI.saveBook(this.activeBookId, content);
        this.isDirty = false;
        console.log(`Libro "${this.activeBookId}" guardado.`);
      } catch (error) {
        console.error('Error al guardar el libro:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Limpia este store y notifica a los demás para que se limpien.
     */
    clearBook() {
      this.activeBook = null;
      this.activeBookId = null;
      this.isDirty = false;

      // Notifica a los stores módulo para que limpien su estado
      useNodesStore().clearElements();
      useAssetsStore().clearAssets();
    },

    /**
     * Marca el libro como "sucio". Esta acción será llamada por los stores módulo.
     */
    setDirty() {
      if (!this.isDirty) {
        this.isDirty = true;
        console.log("Book store is now dirty. Changes pending save.");
      }
    },
  },
});
