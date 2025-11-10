// src/stores/library-store.ts

import { defineStore } from 'pinia';
import type { Book } from 'src/components/models';

export interface LibraryState {
  books: Book[];
  isInitialized: boolean; // Para saber si ya hemos cargado los datos iniciales
}

export const useLibraryStore = defineStore('library', {
  state: (): LibraryState => ({
    books: [],
    isInitialized: false,
  }),

  getters: {
    getBookById: (state) => {
      return (bookId: string): Book | undefined =>
        state.books.find((book) => book.id === bookId);
    },
  },

  // CORRECCIÓN: Todas las acciones deben estar dentro de este bloque
  actions: {
    /**
     * Carga la biblioteca desde library.json al iniciar la aplicación.
     */
    async initializeLibrary() {
      if (this.isInitialized) return;

      try {
        console.log('[Store] Inicializando la biblioteca...');
        const loadedBooks = await window.electronAPI.loadLibrary();
        this.books = loadedBooks || [];
        this.isInitialized = true; // Solo se pone a true si todo va bien
        console.log('[Store] Biblioteca inicializada con éxito.');
      } catch (error) {
        console.error('Error al inicializar la biblioteca:', error);
        this.books = [];
        // NO ponemos isInitialized a true aquí, para que la UI siga mostrando el spinner
      }
    },

    /**
     * Guarda el estado actual de la biblioteca en library.json.
     */
    async _saveLibrary() {
      try {
        const plainBooks = JSON.parse(JSON.stringify(this.books));
        await window.electronAPI.saveLibrary(plainBooks);
      } catch (error) {
        console.error('Error al guardar la biblioteca:', error);
      }
    },

    /**
     * Crea un nuevo libro, persiste los cambios y actualiza el estado.
     * @param data - Datos del nuevo libro (nombre y descripción).
     */
    async addBook(data: { name: string; description: string }) {
      if (!data.name) {
        throw new Error('El nombre del libro es obligatorio.');
      }

      try {
        const newBook: Book = await window.electronAPI.createBook(data);

        this.books.push(newBook);
        await this._saveLibrary();
        return newBook;
      } catch (error) { // CORRECCIÓN: Se eliminó el guion bajo extra
        console.error('Error al crear el nuevo libro:', error);
        throw error;
      }
    },

    /**
     * NUEVA ACCIÓN: Actualiza los datos de un libro.
     */
    async updateBook(bookId: string, data: { name: string; description: string }) {
      try {
        // 1. Llama al backend para actualizar el book.json específico
        await window.electronAPI.updateBook(bookId, data);

        // 2. Actualiza el estado local en Pinia
        const book = this.books.find(b => b.id === bookId);
        if (book) {
          book.name = data.name;
          book.description = data.description;
        }

        // 3. Guarda la lista general de la biblioteca (library.json)
        await this._saveLibrary();
      } catch (error) {
        console.error(`Error al actualizar el libro ${bookId}:`, error);
        throw error;
      }
    },

    /**
     * ACCIÓN COMPLETADA: Elimina un libro.
     */
    async removeBook(bookId: string) {
      const index = this.books.findIndex((book) => book.id === bookId);
      if (index !== -1) {
        try {
          // 1. Llama al backend para borrar la carpeta del libro
          await window.electronAPI.deleteBook(bookId);

          // 2. Elimina del estado local
          this.books.splice(index, 1);

          // 3. Guarda la lista actualizada
          await this._saveLibrary();
        } catch (error) {
          console.error(`Error al eliminar el libro ${bookId}:`, error);
          throw error;
        }
      }
    },
  },
});
