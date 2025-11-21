// src/boot/library-persistence.ts

import { boot } from 'quasar/wrappers';
import { useLibraryStore, type LibraryState } from 'src/stores/library-store';
import { watch } from 'vue';

export default boot(async ({ store }) => {
  // --- SOLO EJECUTAR EN MODO ELECTRON ---
  // Esta lógica solo funcionará si la app se compila o ejecuta como una app de escritorio.
  if (process.env.MODE === 'electron') {
    try {
      // Importamos los módulos de Node.js necesarios para manejar archivos.
      // Usamos 'await import' para que no falle en un entorno de navegador.
      const fs = await import('fs');
      const path = await import('path');

      // Es una mejor práctica guardar los datos del usuario en la carpeta 'userData'
      // en lugar del directorio de la aplicación, ya que este último puede no ser escribible.
      // '@electron/remote' nos ayuda a obtener esta ruta de forma segura.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { app } = require('@electron/remote');
      const userDataPath = app.getPath('userData');
      const libraryFileName = 'library.json';
      const filePath = path.join(userDataPath, libraryFileName);

      const libraryStore = useLibraryStore(store);

      // --- 1. Cargar la biblioteca desde library.json al iniciar ---
      if (fs.existsSync(filePath)) {
        console.log(`Cargando biblioteca desde: ${filePath}`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (fileContent) {
          const parsedState: { books: LibraryState['books'] } = JSON.parse(fileContent);
          libraryStore.$patch({ books: parsedState.books || [] });
          console.log('Biblioteca cargada correctamente desde library.json.');
        }
      } else {
        console.log('No se encontró library.json, se creará uno nuevo al guardar.');
      }

      // --- 2. Guardar la biblioteca en library.json cada vez que cambie ---
      // Usamos 'watch' de Vue para observar cambios profundos en la lista de libros.
      watch(
        () => libraryStore.books,
        (newBooksState) => {
          try {
            console.log(`Guardando biblioteca en: ${filePath}`);
            // Guardamos solo la lista de libros para mantener el JSON limpio.
            const stateToSave = { books: newBooksState };
            // Usamos JSON.stringify con formato para que el archivo sea legible.
            fs.writeFileSync(filePath, JSON.stringify(stateToSave, null, 2));
          } catch (e) {
            console.error('Error al guardar library.json:', e);
          }
        },
        { deep: true }, // 'deep: true' es crucial para detectar cambios dentro de los objetos del array.
      );
    } catch (e) {
      console.error('Error al inicializar la persistencia de archivos en Electron:', e);
      // Aquí podrías decidir si quieres notificar al usuario o crear un backup.
    }
  } else {
    // Si no estamos en modo Electron, simplemente informamos.
    console.log('Persistencia de archivos deshabilitada (no estamos en modo Electron).');
  }
});
