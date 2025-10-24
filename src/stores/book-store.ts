// src/stores/book-store.ts

import { defineStore } from 'pinia';
import { uid } from 'quasar';

// --- TUS INTERFACES (SIN CAMBIOS, SON CORRECTAS) ---
export interface Meta {
  title: string;
  version: string;
}
// ... (resto de tus interfaces: Stat, Modifier, BookNode, BookEdge, etc. sin cambios) ...
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
  // 'name' y 'jsonFilePath' se eliminan porque son redundantes.
  // El nombre/título está en 'meta.title'.
}

export const useBookStore = defineStore('book', {
  // --- ESTADO INICIAL AJUSTADO ---
  state: (): BookState => ({
    id: null,
    meta: { title: '', version: '' },
    characterSheet: {
      stats: {
        health: { current: 0, max: 0 },
        dexterity: { current: 0, max: 0 },
        warmth: { current: 0, max: 0 },
        fatigue: { current: 0, max: 0 },
        thirst: { current: 0, max: 0 },
        hunger: { current: 0, max: 0 },
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
     * Carga un libro por su ID, usando la API de Electron.
     */
    async loadBookById(bookId: string) {
      if (!bookId) {
        console.warn('Se intentó cargar un libro sin ID.');
        this.clearBook();
        return;
      }

      this.id = bookId;

      try {
        if (window.electronAPI?.loadBook) {
          console.log(`Cargando libro con ID "${bookId}" vía Electron API...`);
          // La API de Electron ahora solo necesita el bookId
          const fileContent = await window.electronAPI.loadBook(bookId);
          const bookData = JSON.parse(fileContent) as BookData;

          if (!bookData.meta || !bookData.nodes) {
            throw new Error('Estructura de datos del libro inválida.');
          }

          this._populateStore(bookData);
          console.log(`Libro '${this.meta.title}' cargado exitosamente.`);
        } else {
          // Lógica para modo web (actualmente no implementada, podría usar fetch a un API)
          console.warn('Modo web: La carga de libros desde el sistema de archivos no está soportada.');
          // Aquí podrías cargar un libro de ejemplo si lo deseas
          this.clearBook();
        }
      } catch (error) {
        console.error(`Error al cargar el libro con ID "${bookId}":`, error);
        this.clearBook();
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
      // ...
    },
    addNode(payload: { /* ... */ }) {
      // ...
    },
    updateNode(nodeId: string, updates: Partial<BookNode>) {
      // ...
    },
    // ...etc
  },
});
