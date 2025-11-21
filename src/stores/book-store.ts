// src/stores/book-store.ts

import { defineStore } from 'pinia';
import { toRaw, type Viewport } from 'vue';
import { useNodesStore } from './nodes-store';
import { useAssetsStore } from './assets-store';
import type { BookData, BookNode, CharacterSheet, CharacterSheetSchema,
  CharacterSheetSectionSchema, BookEvent } from './types';

export interface BookState {
  activeBook: BookData | null;
  activeBookId: string | null;
  isLoading: boolean;
  isDirty: boolean;
  debounceSaveTimer: NodeJS.Timeout | null;
}

function getInitialDataForSection(section: CharacterSheetSectionSchema) {
  switch (section.type) {
    case 'stats':
      return {}; // Las estadísticas son un objeto de objetos
    case 'itemSection':
      // Diferenciamos entre lista (inventario) y slots (equipo)
      return section.mode === 'list' ? [] : {};
    case 'events':
      return []; // Los eventos son una lista
    default:
      return null; // Fallback para tipos desconocidos
  }
}

function generateDefaultSheetFromSchema(schema: CharacterSheetSchema): CharacterSheet {
  const newSheet: Partial<CharacterSheet> = {};
  for (const section of schema.layout) {
    (newSheet as any)[section.dataKey] = getInitialDataForSection(section);
  }
  const statsSection = schema.layout.find(s => s.type === 'stats');
  if (statsSection && !newSheet.stats) {
    newSheet.stats = (newSheet as any)[statsSection.dataKey] || {};
  } else if (!newSheet.stats) {
    newSheet.stats = {};
  }

  return newSheet as CharacterSheet;
}

function validateAndRepairBookData(data: any): BookData {
  const defaults: BookData = {
    meta: { title: 'Sin Título', description: '', author: '' },
    nodes: [],
    edges: [],
    assets: [],
    events: [], // La única fuente de verdad
    viewport: { x: 0, y: 0, zoom: 1 },
    characterSheetSchema: null,
    characterSheet: null,
  };

  if (!data || typeof data !== 'object') return defaults;

  const rawEvents = data.events || [];
  const migratedEvents: BookEvent[] = rawEvents.map((event: any) => {
    // Solo se procesan objetos con 'name'. La migración de strings se elimina.
    if (typeof event === 'object' && event.name) {
      // Asegura que los eventos tengan un id.
      return { id: event.id || event.name.replace(/\s+/g, '_').toLowerCase(), name: event.name };
    }
    return null;
  }).filter((e): e is BookEvent => e !== null);


  let cleanViewport = { ...defaults.viewport };
  if (data.viewport) {
    if (data.viewport.flowTransform) {
      cleanViewport = { ...defaults.viewport, ...data.viewport.flowTransform };
    } else {
      cleanViewport = { ...defaults.viewport, ...data.viewport };
    }
  }

  const nodesToMigrate = Array.isArray(data.nodes) ? data.nodes : defaults.nodes;
  const migratedNodes: BookNode[] = nodesToMigrate.map((node: any) => {
    if (!node) return node;
    if (node.data && typeof node.data === 'object') return node;
    const { id, type, position, label, selected, ...rest } = node;
    return { id, type, position, label, selected: !!selected, data: { ...rest } };
  });

  return {
    meta: { ...defaults.meta, ...data.meta },
    nodes: migratedNodes,
    edges: Array.isArray(data.edges) ? data.edges : defaults.edges,
    assets: Array.isArray(data.assets) ? data.assets : defaults.assets,
    events: migratedEvents, // Usamos los eventos limpios
    viewport: cleanViewport,
    characterSheetSchema: data.characterSheetSchema || defaults.characterSheetSchema,
    characterSheet: data.characterSheet || defaults.characterSheet,
  };
}

export const useBookStore = defineStore('book', {
  state: (): BookState => ({
    activeBook: null,
    activeBookId: null,
    isLoading: false,
    isDirty: false,
    debounceSaveTimer: null,
  }),

  getters: {
    characterSheet(state): CharacterSheet | null {
      return state.activeBook?.characterSheet ?? null;
    },
    characterSheetSchema(state): CharacterSheetSchema | null {
      return state.activeBook?.characterSheetSchema ?? null;
    },
  },

  actions: {
    getViewport(): Viewport {
      if (this.activeBook && this.activeBook.viewport) {
        return this.activeBook.viewport;
      }
      return { x: 0, y: 0, zoom: 1 };
    },

    createInitialCharacterSheet() {
      if (!this.activeBook) return;
      const initialSchema: CharacterSheetSchema = {
        layout: [
          {
            type: 'stats',
            title: 'Estadísticas Principales',
            icon: 'analytics',
            dataKey: 'stats',
          },
        ],
      };
      this.$patch(state => {
        if (state.activeBook) {
          state.activeBook.characterSheetSchema = initialSchema;
          state.activeBook.characterSheet = generateDefaultSheetFromSchema(initialSchema);
        }
      });
      this.setDirty();
    },

    setCharacterSheet(newSheet: CharacterSheet) {
      if (this.activeBook) {
        this.activeBook.characterSheet = newSheet;
        this.setDirty();
      }
    },

    updateCharacterSheetSchema(newSchema: CharacterSheetSchema) {
      if (!this.activeBook || !this.characterSheet || !this.characterSheetSchema) {
        console.error('No se puede actualizar el schema si no hay ficha activa.');
        return;
      }
      const oldSchema = this.characterSheetSchema;
      const oldDataKeys = new Set(oldSchema.layout.map(s => s.dataKey));
      const newDataKeys = new Set(newSchema.layout.map(s => s.dataKey));
      const newCharacterSheet = { ...this.characterSheet };
      for (const key of oldDataKeys) {
        if (!newDataKeys.has(key)) {
          delete (newCharacterSheet as any)[key];
        }
      }
      for (const section of newSchema.layout) {
        if (!oldDataKeys.has(section.dataKey)) {
          (newCharacterSheet as any)[section.dataKey] = getInitialDataForSection(section);
        }
      }
      this.$patch(state => {
        if (state.activeBook) {
          state.activeBook.characterSheetSchema = newSchema;
          state.activeBook.characterSheet = newCharacterSheet;
        }
      });
      this.setDirty();
    },

    addEvent(newEvent: { id: string; name: string }) {
      if (!this.activeBook) return;
      if (!this.activeBook.events) {
        this.activeBook.events = [];
      }
      this.activeBook.events.push(newEvent);
      this.setDirty();
    },

    async loadBookById(bookId: string) {
      if (!bookId) return;
      this.isLoading = true;
      this.isDirty = false;
      if (this.debounceSaveTimer) clearTimeout(this.debounceSaveTimer);
      try {
        const content = await window.electronAPI.loadBook(bookId);
        const bookData = validateAndRepairBookData(JSON.parse(content));
        this.activeBook = bookData;
        this.activeBookId = bookId;
        const nodesStore = useNodesStore();
        const assetsStore = useAssetsStore();
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

    async saveCurrentBook(force = false) {
      if (this.debounceSaveTimer) clearTimeout(this.debounceSaveTimer);
      if (!this.activeBook || !this.activeBookId) return;
      if (!this.isDirty && !force) return;

      this.isLoading = true;
      try {
        const nodesStore = useNodesStore();
        const assetsStore = useAssetsStore();

        const cleanEdges = toRaw(nodesStore.edges).map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          markerEnd: edge.markerEnd,
          label: edge.label,
          data: edge.data,
        }));

        const bookToSave: BookData = {
          ...this.activeBook,
          nodes: nodesStore.nodes,
          edges: cleanEdges,
          events: this.activeBook.events,
          assets: assetsStore.assets,
          viewport: nodesStore.viewport,
        };

        const content = JSON.stringify(bookToSave, null, 2);
        await window.electronAPI.saveBook(this.activeBookId, content);

        this.activeBook = bookToSave;
        this.isDirty = false;
      } catch (error) {
        console.error('Error al guardar el libro:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    clearBook() {
      if (this.debounceSaveTimer) clearTimeout(this.debounceSaveTimer);
      this.debounceSaveTimer = null;
      this.activeBook = null;
      this.activeBookId = null;
      this.isDirty = false;
      useNodesStore().clearElements();
      useAssetsStore().clearAssets();
    },

    setDirty() {
      if (!this.isDirty) {
        this.isDirty = true;
      }
      if (this.debounceSaveTimer) {
        clearTimeout(this.debounceSaveTimer);
      }
      this.debounceSaveTimer = setTimeout(() => {
        this.saveCurrentBook();
      }, 1500);
    },
  },
});
