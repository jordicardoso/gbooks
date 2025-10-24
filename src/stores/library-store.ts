// src/stores/library-store.ts

import { defineStore } from 'pinia';
import { uid } from 'quasar';

// 1. Añadimos la propiedad 'image' a la interfaz
export interface Book {
  id: string;
  name: string;
  jsonFile: string;
  image: string; // URL de la imagen de portada
}

export interface LibraryState {
  books: Book[];
}

export const useLibraryStore = defineStore('library', {
  state: (): LibraryState => ({
    books: [],
  }),

  getters: {
    getBookById: (state) => {
      return (bookId: string): Book | undefined =>
        state.books.find((book) => book.id === bookId);
    },
  },

  actions: {
    /**
     * 2. Actualizamos la acción para aceptar una imagen.
     * @param name - El nombre del libro.
     * @param jsonFile - El nombre del fichero JSON asociado.
     * @param image - La URL de la imagen de portada.
     */
    addBook(name: string, jsonFile: string, image: string) {
      if (!name || !jsonFile) {
        console.error('El nombre y el fichero JSON son obligatorios.');
        return;
      }

      const newBook: Book = {
        id: uid(),
        name,
        jsonFile,
        image, // Asignamos la imagen
      };

      this.books.push(newBook);
    },

    removeBook(bookId: string) {
      const index = this.books.findIndex((book) => book.id === bookId);
      if (index !== -1) {
        this.books.splice(index, 1);
      }
    },

    /**
     * 3. Actualizamos los datos de ejemplo con imágenes.
     */
    loadSampleData() {
      if (this.books.length === 0) {
        this.addBook(
          'Elige tu propia aventura',
          'adventure_1.json',
          'https://picsum.photos/seed/adventure/100/150'
        );
        this.addBook(
          'El misterio del castillo',
          'castle_mystery.json',
          'https://picsum.photos/seed/mystery/100/150'
        );
        this.addBook(
          'La guarida del dragón',
          'dragon_lair.json',
          'https://picsum.photos/seed/dragon/100/150'
        );
      }
    },
  },
});
