// src/stores/book-store.ts

import { defineStore } from 'pinia';
import { useNodesStore } from './nodes-store';
import { useAssetsStore } from './assets-store';
import type { BookData, BookNode } from './types';

let debounceSaveTimer: NodeJS.Timeout | null = null;

export interface BookState {
  activeBook: BookData | null;
  activeBookId: string | null;
  isLoading: boolean;
  isDirty: boolean;
}

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

  const nodesToMigrate = Array.isArray(data.nodes) ? data.nodes : defaults.nodes;

  // 🔧 Convertir cada nodo para que sus propiedades extra estén dentro de `data`
  const migratedNodes: BookNode[] = nodesToMigrate.map((node: any) => {
    if (!node) return node;

    // Si el nodo ya tiene un `data`, lo dejamos igual
    if (node.data && typeof node.data === 'object') return node;

    // Extraemos las propiedades que deben ir dentro de `data`
    const {
      id,
      type,
      position,
      label,
      selected,
      // todo lo demás se agrupa en "rest"
      ...rest
    } = node;

    return {
      id,
      type,
      position,
      label,
      selected: !!selected,
      data: { ...rest }, // ← aquí van color, description, imageId, etc.
    };
  });

  return {
    meta: { ...defaults.meta, ...data.meta },
    nodes: migratedNodes,
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

      if (debounceSaveTimer) clearTimeout(debounceSaveTimer);

      try {
        const content = await window.electronAPI.loadBook(bookId);
        // Ahora esta función también migra los datos a la última versión.
        const bookData = validateAndRepairBookData(JSON.parse(content));

        this.activeBook = bookData;
        this.activeBookId = bookId;

        const nodesStore = useNodesStore();
        const assetsStore = useAssetsStore();

        // [CORREGIDO] Pasamos también el viewport al store de nodos.
        nodesStore.setElements(bookData.nodes, bookData.edges, bookData.viewport);
        assetsStore.setAssets(bookId, bookData.assets);

      } catch (error) {
        console.error(`Error al cargar el libro con ID "${bookId}":`, error);
        this.clearBook();
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async saveCurrentBook() {
      if (debounceSaveTimer) clearTimeout(debounceSaveTimer);

      if (!this.activeBook || !this.activeBookId || !this.isDirty) {
        return;
      }
      this.isLoading = true;
      try {
        const nodesStore = useNodesStore();
        const assetsStore = useAssetsStore();

        const flattenedNodes = nodesStore.nodes.map(node => {
          const { data, ...restOfNode } = node;
          return { ...restOfNode, ...data };
        });

        const bookToSave: BookData = {
          meta: this.activeBook.meta,
          variables: this.activeBook.variables,
          nodes: flattenedNodes,
          edges: nodesStore.edges,
          assets: assetsStore.assets,
          viewport: nodesStore.viewport,
        };

        console.log('Guardando libro con estructura aplanada:', bookToSave);
        const content = JSON.stringify(bookToSave, null, 2);
        await window.electronAPI.saveBook(this.activeBookId, content);

        this.activeBook = bookToSave;

        this.isDirty = false;
        console.log(`Libro "${this.activeBookId}" guardado.`);
      } catch (error) {
        console.error('Error al guardar el libro:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    clearBook() {
      this.activeBook = null;
      this.activeBookId = null;
      this.isDirty = false;

      useNodesStore().clearElements();
      useAssetsStore().clearAssets();
    },

    setDirty() {
      if (!this.isDirty) {
        this.isDirty = true;
        console.log("Book store is now dirty. Changes pending save.");
      }
      if (debounceSaveTimer) {
        clearTimeout(debounceSaveTimer);
      }
      debounceSaveTimer = setTimeout(() => {
        this.saveCurrentBook();
      }, 1500);
    },
  },
});
