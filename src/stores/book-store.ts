// src/stores/book-store.ts
import { defineStore } from 'pinia';
import {
  Node,
  Edge,
  Viewport,
} from '@vue-flow/core';
import { uid } from 'quasar';

export interface BookNodeData {
  description: string;
  imageId?: string;
  tag?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

// 2. Define un BookNode como un Nodo de Vue Flow que usa tus datos personalizados
export type BookNode = Node<BookNodeData>;

export interface BookData {
  meta: BookMeta;
  chapters: BookNode[]; // Usa el tipo BookNode que acabamos de definir
  // ... resto de la interfaz
}

// Interfaces para la estructura de datos de un libro
export interface BookMeta {
  title: string;
  description: string;
  author: string;
}

export interface BookVariable {
  id: string;
  name: string;
  initialValue: string | number | boolean;
}

export interface BookData {
  meta: BookMeta;
  chapters: Node[];
  edges: Edge[]; // <-- 1. AÑADIR EDGES AL MODELO
  assets: string[];
  variables: BookVariable[];
  viewport: Viewport;
}

export interface BookState {
  activeBook: BookData | null;
  activeBookId: string | null;
  isLoading: boolean;
  isDirty: boolean; // Para saber si hay cambios sin guardar
}

/**
 * SOLUCIÓN CLAVE: Esta función toma los datos crudos del fichero JSON
 * y se asegura de que todas las propiedades necesarias existan,
 * añadiendo valores por defecto si faltan.
 */
function validateAndRepairBookData(data: any): BookData {
  const defaults = {
    meta: { title: 'Sin Título', description: '', author: '' },
    chapters: [],
    edges: [], // <-- 2. AÑADIR VALOR POR DEFECTO PARA EDGES
    assets: [],
    variables: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  if (!data || typeof data !== 'object') {
    return defaults;
  }

  // Asegura que cada propiedad principal exista
  return {
    meta: data.meta && typeof data.meta === 'object' ? data.meta : defaults.meta,
    chapters: Array.isArray(data.chapters) ? data.chapters : defaults.chapters,
    edges: Array.isArray(data.edges) ? data.edges : defaults.edges, // <-- 3. VALIDAR Y REPARAR EDGES
    assets: Array.isArray(data.assets) ? data.assets : defaults.assets,
    variables: Array.isArray(data.variables) ? data.variables : defaults.variables,
    viewport: data.viewport && typeof data.viewport === 'object' ? data.viewport : defaults.viewport,
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
        console.log(`Cargando libro con ID "${bookId}" vía Electron API...`);
        const content = await window.electronAPI.loadBook(bookId);
        const rawData = JSON.parse(content);

        // Usamos la función de validación y reparación
        this.activeBook = validateAndRepairBookData(rawData);
        this.activeBookId = bookId;

      } catch (error) {
        console.error(`Error al cargar el libro con ID "${bookId}":`, error);
        this.clearBook();
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async saveCurrentBook() {
      if (!this.activeBook || !this.activeBookId) {
        console.warn('No hay un libro activo para guardar.');
        return;
      }
      if (!this.isDirty) {
        // console.log('No hay cambios para guardar.');
        return;
      }

      this.isLoading = true;
      try {
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
    },

    // --- Acciones para modificar el libro ---

    setDirty() {
      if (!this.isDirty) {
        this.isDirty = true;
      }
    },

    createNode(payload: { position: { x: number; y: number }; type: string }) {
      if (!this.activeBook) return;

      if (payload.type === 'start' && this.activeBook.chapters.some(n => n.type === 'start')) {
        console.warn('Intento de crear un segundo nodo inicial. Operación cancelada.');
        // Opcional: Mostrar una notificación al usuario con Quasar.
        return;
      }
      // 3. Crea el nodo siguiendo el nuevo formato
      const newNode: BookNode = {
        id: uid(),
        type: payload.type,
        position: payload.position,
        label: `Nuevo Nodo ${this.activeBook.chapters.length + 1}`,
        // ¡IMPORTANTE! Los datos personalizados van dentro de la propiedad 'data'
        data: {
          description: 'Nuevo nodo de historia...',
        },
      };

      this.activeBook = {
        ...this.activeBook,
        chapters: [...this.activeBook.chapters, newNode],
      };

      this.setDirty();
    },

    updateViewport(viewport: Viewport) {
      if (this.activeBook) {
        this.activeBook.viewport = viewport;
        this.setDirty();
      }
    },

    updateNodes(nodes: Node[]) {
      if (this.activeBook) {
        this.activeBook.chapters = nodes;
        this.setDirty();
      }
    },

    updateEdges(edges: Edge[]) {
      // <-- 4. CORREGIR LA LÓGICA DE ESTA ACCIÓN
      if (this.activeBook) {
        this.activeBook.edges = edges;
        this.setDirty();
      }
    }
  },
});
