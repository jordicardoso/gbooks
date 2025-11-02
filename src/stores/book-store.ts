// src/stores/book-store.ts

import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import { useNodesStore } from './nodes-store';
import { useAssetsStore } from './assets-store';
import type { BookData, BookNode, CharacterSheet, CharacterSheetSchema, CharacterSheetSectionSchema } from './types';

export interface BookState {
  activeBook: BookData | null;
  activeBookId: string | null;
  isLoading: boolean;
  isDirty: boolean;
  debounceSaveTimer: NodeJS.Timeout | null;
}

function getInitialDataForSection(type: CharacterSheetSectionSchema['type']) {
  switch (type) {
    case 'stats':
      return []; // Las estadísticas son una lista de objetos
    case 'itemList':
      return []; // El inventario es una lista de objetos
    case 'equipment':
      return {}; // El equipamiento es un mapa de slots a objetos
    case 'enfermedades':
      return {}; //
    default:
      return null; // Fallback para tipos desconocidos
  }
}

function generateDefaultSheetFromSchema(schema: CharacterSheetSchema): CharacterSheet {
  const newSheet: Partial<CharacterSheet> = {};
  for (const section of schema.layout) {
    (newSheet as any)[section.dataKey] = getInitialDataForSection(section.type);
  }
  return newSheet as CharacterSheet;
}

function validateAndRepairBookData(data: any): BookData {
  const defaults: BookData = {
    meta: { title: 'Sin Título', description: '', author: '' },
    nodes: [],
    edges: [],
    assets: [],
    variables: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    characterSheetSchema: null,
    characterSheet: null,
  };

  if (!data || typeof data !== 'object') return defaults;

  const nodesToMigrate = Array.isArray(data.nodes) ? data.nodes : defaults.nodes;
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
    characterSheet(state): CharacterSheet | null | undefined {
      return state.activeBook?.characterSheet;
    },
    characterSheetSchema(state): CharacterSheetSchema | null | undefined {
      return state.activeBook?.characterSheetSchema;
    },
  },

  actions: {
    createInitialCharacterSheet() {
      if (!this.activeBook) return;

      // 1. Definimos un schema inicial súper básico.
      const initialSchema: CharacterSheetSchema = {
        layout: [
          {
            type: 'stats',
            title: 'Estadísticas Principales',
            icon: 'o_analytics',
            dataKey: 'stats',
          },
        ],
      };

      // 2. Asignamos el nuevo schema al libro activo.
      this.activeBook.characterSheetSchema = initialSchema;

      // 3. Generamos la ficha de datos vacía a partir de este schema.
      this.activeBook.characterSheet = generateDefaultSheetFromSchema(initialSchema);

      // 4. Marcamos el libro como modificado para que se guarde.
      this.setDirty();
      console.log('Ficha de personaje inicial creada.');
    },

    setCharacterSheet(newSheet: CharacterSheet) {
      if (this.activeBook) {
        this.activeBook.characterSheet = newSheet;
        this.setDirty();
      }
    },

    updateCharacterSheetSchema(newSchema: CharacterSheetSchema) {
      if (!this.activeBook) return;

      const oldSheet = this.activeBook.characterSheet ?? {};
      const newSheet: Partial<CharacterSheet> = {};

      for (const section of newSchema.layout) {
        const key = section.dataKey as keyof CharacterSheet;

        if (Object.prototype.hasOwnProperty.call(oldSheet, key)) {
          (newSheet as any)[key] = oldSheet[key];
        } else {
          (newSheet as any)[key] = getInitialDataForSection(section.type);
        }
      }

      // Asignamos el nuevo esquema y la ficha reconciliada
      this.activeBook.characterSheetSchema = newSchema;
      this.activeBook.characterSheet = newSheet as CharacterSheet;

      this.setDirty();
      console.log('Schema de la ficha actualizado y datos reconciliados.');
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


    async loadBookById(bookId: string) {
      if (!bookId) return;
      this.isLoading = true;
      this.isDirty = false;

      if (this.debounceSaveTimer) clearTimeout(this.debounceSaveTimer);

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
      if (this.debounceSaveTimer) clearTimeout(this.debounceSaveTimer);

      if (!this.activeBook || !this.activeBookId || !this.isDirty) {
        return;
      }
      this.isLoading = true;
      try {
        const nodesStore = useNodesStore();
        const assetsStore = useAssetsStore();
        const cleanEdges = toRaw(nodesStore.edges).map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          data: edge.data,
        }));

        const bookToSave: BookData = {
          meta: this.activeBook.meta,
          variables: this.activeBook.variables,
          nodes: nodesStore.nodes,
          edges: cleanEdges,
          assets: assetsStore.assets,
          viewport: nodesStore.viewport,
          characterSheet: this.activeBook.characterSheet,
          characterSheetSchema: this.activeBook.characterSheetSchema,
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
