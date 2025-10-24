// src/stores/book-store.ts

import { defineStore } from 'pinia';

// --- TUS INTERFACES (SIN CAMBIOS, SON CORRECTAS) ---
export interface Meta {
  title: string;
  version: string;
}

export interface CharacterSheet {
  stats: {
    [key: string]: { current: number; max: number };
  };
  equipment: {
    [key: string]: string | null;
  };
  inventory: string[];
  afflictions: string[];
}

export interface CharacterSheetSchema {
  layout: unknown[]; // Puedes definir un tipo más específico si lo tienes
}

export interface BookNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  label: string;
  // ... otras propiedades de nodo
}

export interface BookEdge {
  id: string;
  source: string;
  target: string;
  // ... otras propiedades de enlace
}

export interface BookData {
  meta: Meta;
  characterSheet: CharacterSheet;
  characterSheetSchema: CharacterSheetSchema;
  nodes: BookNode[];
  edges: BookEdge[];
  mapId: string | null;
}

export interface BookState extends BookData {
  id: string | null; // El ID del libro, que coincide con el nombre de su carpeta
}

export const useBookStore = defineStore('book', {
  // --- ESTADO INICIAL AJUSTADO ---
  state: (): BookState => ({
    id: null,
    meta: { title: '', version: '1.0.0' },
    characterSheet: {
      stats: {
        health: { current: 10, max: 10 },
        dexterity: { current: 10, max: 10 },
        warmth: { current: 10, max: 10 },
        fatigue: { current: 10, max: 10 },
        thirst: { current: 10, max: 10 },
        hunger: { current: 10, max: 10 },
      },
      equipment: { head: null, jacket: null, torso: null, legs: null, feet: null },
      inventory: [],
      afflictions: [],
    },
    mapId: null,
    characterSheetSchema: { layout: [] },
    nodes: [],
    edges: [],
  }),

  getters: {
    // El getter es correcto, no necesita cambios
    getNodeById: (state) => {
      return (nodeId: string): BookNode | undefined =>
        state.nodes.find((node) => node.id === nodeId);
    },
    // Un nuevo getter útil
    currentBookTitle: (state) => state.meta.title || 'Libro sin título',
  },

  actions: {
    /**
     * Acción interna para poblar el estado con los datos de un libro.
     */
    _populateStore(bookData: BookData) {
      this.meta = bookData.meta || this.meta;
      this.characterSheet = bookData.characterSheet || this.characterSheet;
      this.characterSheetSchema = bookData.characterSheetSchema || { layout: [] };
      this.nodes = bookData.nodes || [];
      this.edges = bookData.edges || [];
      this.mapId = bookData.mapId || null;
    },

    /**
     * Carga un libro por su ID. Si no existe, lo crea y lo guarda.
     */
    async loadBookById(bookId: string) {
      if (!bookId) {
        console.warn('Se intentó cargar un libro sin ID.');
        this.clearBook();
        return;
      }

      // Asigna el ID inmediatamente para saber en qué libro estamos trabajando.
      this.id = bookId;

      // Solo procedemos si estamos en modo Electron.
      if (!window.electronAPI?.loadBook) {
        console.warn('Modo web: La carga/creación de libros no está soportada.');
        this.clearBook();
        return;
      }

      try {
        // --- INTENTA CARGAR EL LIBRO ---
        console.log(`Cargando libro con ID "${bookId}" vía Electron API...`);
        const fileContent = await window.electronAPI.loadBook(bookId);
        const bookData = JSON.parse(fileContent) as BookData;

        if (!bookData.meta || !bookData.nodes) {
          throw new Error('Estructura de datos del libro inválida. Creando uno nuevo.');
        }

        this._populateStore(bookData);
        console.log(`Libro '${this.meta.title}' cargado exitosamente.`);

      } catch (error) {
        // --- MANEJA EL FALLO (CREA EL LIBRO SI NO SE ENCUENTRA) ---
        const err = error as Error;

        // Comprueba si el error es el esperado "archivo no encontrado".
        if (err.message.includes('ENOENT')) {
          console.log(`El archivo para el libro "${bookId}" no existe. Creando uno nuevo.`);

          // 1. Restablece el store a un estado limpio y por defecto.
          this.$reset();

          // 2. Asigna el ID y un título por defecto para el nuevo libro.
          this.id = bookId;
          this.meta.title = 'Nuevo Libro'; // Puedes cambiar este valor por defecto

          // 3. Guarda inmediatamente este nuevo libro para crear el archivo en el disco.
          await this.saveCurrentBook();

        } else {
          // Es un error diferente e inesperado (ej. JSON malformado, problemas de permisos).
          console.error(`Error inesperado al cargar el libro con ID "${bookId}":`, error);
          this.clearBook();
        }
      }
    },

    /**
     * Guarda el estado actual del libro en su archivo correspondiente.
     */
    async saveCurrentBook() {
      if (!this.id) {
        console.warn('No hay un libro activo para guardar.');
        return;
      }

      const bookDataToSave: BookData = {
        meta: this.meta,
        characterSheet: this.characterSheet,
        characterSheetSchema: this.characterSheetSchema,
        nodes: this.nodes,
        edges: this.edges,
        mapId: this.mapId,
      };
      const content = JSON.stringify(bookDataToSave, null, 2);

      if (window.electronAPI?.saveBook) {
        // La API de Electron ahora solo necesita el bookId y el contenido
        const result = await window.electronAPI.saveBook(this.id, content);
        if (result.success) {
          console.log(`Libro '${this.meta.title}' guardado exitosamente.`);
        } else {
          console.error(`Error al guardar el libro:`, result.error);
        }
      } else {
        // Fallback para modo web
        localStorage.setItem(`gbooks_book_${this.id}`, content);
        console.log(`Libro '${this.meta.title}' guardado en localStorage (modo navegador).`);
      }
    },

    /**
     * Limpia el estado del libro actual.
     */
    clearBook() {
      this.id = null;
      // Restablece el estado al inicial
      this.$reset();
    },

    // --- El resto de tus acciones (addNode, updateNode, etc.) son correctas y no necesitan cambios ---
    updateCharacterSheet(updates: Partial<CharacterSheet>) {
      this.characterSheet = { ...this.characterSheet, ...updates };
    },
    addNode(payload: { id: string; type: string; position: { x: number; y: number }; label: string; }) {
      this.nodes.push(payload);
    },
    updateNode(nodeId: string, updates: Partial<BookNode>) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        Object.assign(node, updates);
      }
    },
    // ...etc
  },
});
