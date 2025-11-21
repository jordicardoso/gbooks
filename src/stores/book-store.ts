// src/stores/book-store.ts

import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import type { Viewport } from './types';
import { useNodesStore } from './nodes-store';
import { useAssetsStore } from './assets-store';
import type {
  BookData,
  BookNode,
  CharacterSheet,
  CharacterSheetSchema,
  CharacterSheetSectionSchema,
  BookEvent,
} from './types';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newSheet as Record<string, any>)[section.dataKey] = getInitialDataForSection(section);
  }
  const statsSection = schema.layout.find((s) => s.type === 'stats');
  if (statsSection) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newSheet.stats = (newSheet as Record<string, any>)[statsSection.dataKey] || {};
  }
  if (!newSheet.stats) {
    newSheet.stats = {};
  }

  return newSheet as CharacterSheet;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAndRepairBookData(data: any): BookData {
  const defaults: BookData = {
    meta: { title: 'Sin Título', description: '', author: '' },
    nodes: [],
    edges: [],
    assets: [],
    events: [], // La única fuente de verdad
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  if (!data || typeof data !== 'object') return defaults;

  const rawEvents = data.events || [];
  const migratedEvents: BookEvent[] = rawEvents
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((event: Record<string, any>) => {
      // Solo se procesan objetos con 'name'. La migración de strings se elimina.
      if (typeof event === 'object' && event.name) {
        // Asegura que los eventos tengan un id.
        return {
          id: event.id || event.name.replace(/\s+/g, '_').toLowerCase(),
          name: event.name,
          initialValue: event.initialValue !== undefined ? event.initialValue : false,
        };
      }
      return null;
    })
    .filter((e: BookEvent | null): e is BookEvent => e !== null);

  let cleanViewport = { ...defaults.viewport };
  if (data.viewport) {
    if (data.viewport.flowTransform) {
      cleanViewport = { ...defaults.viewport, ...data.viewport.flowTransform };
    } else {
      cleanViewport = { ...defaults.viewport, ...data.viewport };
    }
  }

  const nodesToMigrate = Array.isArray(data.nodes) ? data.nodes : defaults.nodes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      this.$patch((state) => {
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
      const oldDataKeys = new Set(oldSchema.layout.map((s) => s.dataKey));
      const newDataKeys = new Set(newSchema.layout.map((s) => s.dataKey));
      const newCharacterSheet = { ...this.characterSheet };
      for (const key of oldDataKeys) {
        if (!newDataKeys.has(key)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (newCharacterSheet as Record<string, any>)[key];
        }
      }
      for (const section of newSchema.layout) {
        if (!oldDataKeys.has(section.dataKey)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (newCharacterSheet as Record<string, any>)[section.dataKey] =
            getInitialDataForSection(section);
        }
      }
      this.$patch((state) => {
        if (state.activeBook) {
          state.activeBook.characterSheetSchema = newSchema;
          state.activeBook.characterSheet = newCharacterSheet;
        }
      });
      this.setDirty();
    },

    addEvent(newEvent: { id: string; name: string; initialValue?: string | number | boolean }) {
      if (!this.activeBook) return;
      if (!this.activeBook.events) {
        this.activeBook.events = [];
      }
      this.activeBook.events.push({
        ...newEvent,
        initialValue: newEvent.initialValue !== undefined ? newEvent.initialValue : false,
      });
      this.setDirty();
    },

    async loadBookById(bookId: string) {
      if (!bookId) return;
      this.isLoading = true;
      this.isDirty = false;
      if (this.debounceSaveTimer) clearTimeout(this.debounceSaveTimer);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content = await (window as any).electronAPI.loadBook(bookId);
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

        const cleanEdges = toRaw(nodesStore.edges).map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
          label: (edge.label as string) || '',
          data: edge.data,
          ...(edge.markerEnd ? { markerEnd: edge.markerEnd } : {}),
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window as any).electronAPI.saveBook(this.activeBookId, content);

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
        void this.saveCurrentBook();
      }, 1500);
    },
    deleteEventIfUnused(eventId: string): boolean {
      if (!this.activeBook || !this.activeBook.events) return false;

      const nodesStore = useNodesStore();
      const nodes = nodesStore.nodes;

      // Check if event is used in any node
      const isUsed = nodes.some((node) => {
        // Check actions
        if (node.data.actions) {
          const checkActions = (actions: any[]): boolean => {
            return actions.some((action) => {
              if (action.type === 'setFlag' && action.flag === eventId) return true;
              if (
                action.type === 'conditional' &&
                action.condition.source === 'flag' &&
                action.condition.subject === eventId
              )
                return true;
              if (action.type === 'conditional') {
                return checkActions(action.successActions) || checkActions(action.failureActions);
              }
              return false;
            });
          };
          if (checkActions(node.data.actions)) return true;
        }

        // Check choices
        if (node.data.choices) {
          return node.data.choices.some((choice: any) => {
            if (
              choice.type === 'conditional' &&
              choice.condition.type === 'event' &&
              choice.condition.subject === eventId
            )
              return true;
            return false;
          });
        }

        return false;
      });

      if (!isUsed) {
        const index = this.activeBook.events.findIndex((e) => e.id === eventId);
        if (index !== -1) {
          this.activeBook.events.splice(index, 1);
          this.setDirty();
          return true;
        }
      }

      return false;
    },
  },
});
