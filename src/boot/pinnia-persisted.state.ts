// src/boot/pinia-persisted-state.ts

import { boot } from 'quasar/wrappers';
import { useBookStore } from 'src/stores/book-store';
import type { BookState } from 'src/stores/book-store';

// Clave única para almacenar tu libro en localStorage
const LOCAL_STORAGE_KEY = 'gbooks_current_book_editor_state';

export default boot(({ store }) => {
  const bookStore = useBookStore(store); // Obtiene la instancia de tu store

  // --- 1. Cargar el estado desde localStorage al iniciar la aplicación ---
  try {
    const persistedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (persistedState) {
      const parsedState: BookState = JSON.parse(persistedState);
      // Usamos $patch para actualizar múltiples propiedades del estado de una vez
      bookStore.$patch(parsedState);
      console.log('Estado del libro cargado desde localStorage.');
    }
  } catch (e) {
    console.error('Error al cargar el estado del libro desde localStorage:', e);
    // Opcional: Si los datos están corruptos, podrías borrarlos
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  // --- 2. Suscribirse a los cambios del store para guardar el estado en localStorage ---
  // Cada vez que el estado del bookStore cambie, se guardará automáticamente.
  bookStore.$subscribe(
    (mutation, state) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        // console.log('Estado del libro guardado en localStorage.'); // Descomenta para depurar
      } catch (e) {
        console.error('Error al guardar el estado del libro en localStorage:', e);
      }
    },
    { detached: true },
  ); // `detached: true` asegura que la suscripción no se elimine
  // cuando un componente que usa el store se desmonte.
});
