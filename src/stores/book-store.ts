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

/**
 * [MEJORA] Valida, repara y migra los datos del libro a la estructura más reciente.
 * Esta función ahora también se encarga de "aplanar" los nodos que vienen con la estructura antigua.
 */
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

  // 1. Validar y obtener los nodos, usando los por defecto si no existen.
  const nodesToMigrate = Array.isArray(data.nodes) ? data.nodes : defaults.nodes;

  // 2. [CLAVE] Mapear cada nodo para asegurar la estructura aplanada.
  const migratedNodes: BookNode[] = nodesToMigrate.map((node: any) => {
    // Si el nodo tiene un objeto 'data', es la estructura antigua.
    if (node && node.data && typeof node.data === 'object') {
      const { data: nodeData, ...restOfNode } = node;
      // Fusionamos las propiedades de 'data' en el nivel superior del nodo.
      // Las propiedades de 'restOfNode' (id, type, position) prevalecen si hay conflicto.
      return { ...nodeData, ...restOfNode };
    }
    // Si no, asumimos que ya tiene la estructura correcta.
    return node;
  });

  // 3. Devolver la estructura del libro completa con los nodos ya migrados.
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

        // La recolección de datos ya es correcta, ya que los stores
        // internos siempre trabajan con la estructura aplanada.
        this.activeBook.nodes = nodesStore.nodes;
        this.activeBook.edges = nodesStore.edges;
        this.activeBook.assets = assetsStore.assets;
        this.activeBook.viewport = nodesStore.viewport;

        console.log('Guardando libro con estructura aplanada:', this.activeBook);
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
