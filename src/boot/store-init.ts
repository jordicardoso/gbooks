// src/boot/store-init.ts

import { boot } from 'quasar/wrappers';
import { useLibraryStore } from 'src/stores/library-store';
// Importa aquí otros stores que necesiten inicialización
// import { useBookStore } from 'src/stores/book-store';

export default boot(async (/* { app } */) => {
  console.log('[Boot] Inicializando stores...');

  // Obtenemos las instancias de los stores
  const libraryStore = useLibraryStore();

  await Promise.all([
    libraryStore.initializeLibrary(),
    // bookStore.initializeSomething(), // etc.
  ]);

  console.log('[Boot] Todos los stores han sido inicializados.');
});
