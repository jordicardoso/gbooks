import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { uid } from 'quasar';

app.commandLine.appendSwitch('touch-events', 'disabled');
// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

// --- Definición de rutas centralizada ---
const userDataPath = app.getPath('userData');
const booksBaseDir = path.join(userDataPath, 'gbooks-books');
const libraryFilePath = path.join(userDataPath, 'library.json');

// --- Funciones de Ayuda para Rutas ---
function getBookDir(bookId: string): string {
  return path.join(booksBaseDir, bookId);
}

function getBookAssetsDir(bookId: string): string {
  return path.join(booksBaseDir, bookId, 'assets');
}

let mainWindow: BrowserWindow | undefined;

async function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'),
    width: 1200,
    height: 800,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION,
        ),
      ),
    },
  });

  mainWindow.setMenu(null);

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL);
  } else {
    await mainWindow.loadFile('index.html');
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

void app.whenReady().then(async () => {
  // Asegurarse de que la carpeta de libros exista al inicio
  await fs.mkdir(booksBaseDir, { recursive: true });

  // Protocolo personalizado para servir assets de forma segura
  protocol.registerFileProtocol('gbooks-asset', (request, callback) => {
    const urlParts = request.url.replace(/^gbooks-asset:\/\//, '').split('/');
    if (urlParts.length < 2) {
      console.error('URL de asset inválida:', request.url);
      return callback({ error: -6 /* net::ERR_FILE_NOT_FOUND */ });
    }
    const bookId = urlParts[0] as string;
    const filename = urlParts.slice(1).join('/');
    const filePath = path.join(getBookAssetsDir(bookId), filename);
    callback({ path: path.normalize(filePath) });
  });

  // --- MANEJADORES DE IPC ---

  // Cargar la biblioteca de libros
  ipcMain.handle('library:load', async () => {
    try {
      const fileContent = await fs.readFile(libraryFilePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []; // Si no existe, es la primera vez, devuelve array vacío.
      }
      console.error('Failed to load library:', error);
      throw error;
    }
  });

  // Guardar la biblioteca de libros
  ipcMain.handle('library:save', async (event, books) => {
    try {
      const data = JSON.stringify(books, null, 2);
      await fs.writeFile(libraryFilePath, data, 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Failed to save library:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Crear un nuevo libro
  ipcMain.handle('book:create', async (event, data: { name: string; description: string }) => {
    const bookId = uid();
    const bookDir = getBookDir(bookId);
    const assetsDir = getBookAssetsDir(bookId);
    const bookJsonFilePath = path.join(bookDir, 'book.json');

    const newBook = {
      id: bookId,
      name: data.name,
      description: data.description,
      jsonFile: bookJsonFilePath,
    };

    const initialBookContent = {
      meta: {
        title: data.name,
        description: data.description,
        author: '',
      },
      chapters: [],
      assets: [],
      variables: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    try {
      await fs.mkdir(bookDir, { recursive: true });
      await fs.mkdir(assetsDir, { recursive: true });
      await fs.writeFile(bookJsonFilePath, JSON.stringify(initialBookContent, null, 2));
      console.log(`[Electron Main] Libro creado con ID: ${bookId}`);
      return newBook;
    } catch (error) {
      console.error(`[Electron Main] Fallo al crear ficheros para el libro ${bookId}:`, error);
      throw error;
    }
  });

  // Guardar el contenido de un libro (book.json)
  ipcMain.handle('save-book', async (event, bookId: string, content: string) => {
    const bookJsonPath = path.join(getBookDir(bookId), 'book.json');
    try {
      await fs.writeFile(bookJsonPath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      console.error(`[Electron Main] Error al guardar el archivo ${bookJsonPath}:`, error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'book:update', // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_event, _bookId, _data) => {
      const fileContent = await fs.readFile(libraryFilePath, 'utf-8'); // Lee library.json
      const books = JSON.parse(fileContent);
      // ... encuentra el libro y lo actualiza
      await fs.writeFile(libraryFilePath, JSON.stringify(books, null, 2), 'utf-8'); // Guarda library.json
      // ...
    },
  );

  // Cargar el contenido de un libro (book.json)
  ipcMain.handle('load-book', async (event, bookId: string) => {
    const bookJsonPath = path.join(getBookDir(bookId), 'book.json');
    try {
      const content = await fs.readFile(bookJsonPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`[Electron Main] Error al leer el archivo ${bookJsonPath}:`, error);
      throw error;
    }
  });

  ipcMain.handle('get-asset-path', (event, bookId: string, filename: string) => {
    if (!bookId || !filename) {
      console.error('[Electron Main] get-asset-path llamado sin bookId o filename.');
      return null;
    }
    // Construye y devuelve la URL con tu protocolo personalizado.
    return `gbooks-asset://${bookId}/${filename}`;
  });

  ipcMain.handle('book:get-cover-info', async (event, bookId: string) => {
    const bookJsonPath = path.join(getBookDir(bookId), 'book.json');
    try {
      const content = await fs.readFile(bookJsonPath, 'utf-8');
      const bookData = JSON.parse(content);

      const imageId = bookData.meta?.imageId;
      if (!imageId) {
        return null; // El libro no tiene portada asignada
      }

      const asset = bookData.assets?.find((a: { id: string }) => a.id === imageId);
      if (!asset?.filename) {
        return null; // El asset de la portada no se encontró o es inválido
      }

      // Devolvemos solo el nombre del fichero, que es lo único que necesita el frontend
      return { filename: asset.filename };
    } catch (error) {
      console.error(`[Electron Main] Error al obtener info de portada para ${bookId}:`, error);
      return null; // Devuelve null en caso de error
    }
  });

  // Eliminar un libro completo
  ipcMain.handle('book:delete', async (event, bookId: string) => {
    const bookDir = getBookDir(bookId);
    try {
      await fs.rm(bookDir, { recursive: true, force: true });
      console.log(`[Electron Main] Directorio del libro ${bookId} eliminado.`);
      return { success: true };
    } catch (error) {
      console.error(`[Electron Main] Error al eliminar el libro ${bookId}:`, error);
      throw error;
    }
  });

  // --- MANEJADORES DE ASSETS REFACTORIZADOS ---

  // Listar los assets de un libro (desde book.json)
  ipcMain.handle('list-assets', async (event, bookId: string) => {
    const bookJsonPath = path.join(getBookDir(bookId), 'book.json');
    try {
      const bookContent = await fs.readFile(bookJsonPath, 'utf-8');
      const bookData = JSON.parse(bookContent);
      return bookData.assets || []; // Devuelve la lista de assets o un array vacío
    } catch (err) {
      console.error(`Error al leer los assets del libro ${bookId}:`, err);
      return [];
    }
  });

  // Guardar un nuevo asset y registrarlo en book.json
  ipcMain.handle('save-asset', async (event, bookId, assetData) => {
    const bookDir = getBookDir(bookId);
    const assetsDir = getBookAssetsDir(bookId);
    const bookJsonPath = path.join(bookDir, 'book.json');

    try {
      // 1. Generar nombre de archivo único
      const assetId = uid();
      const fileExtension = path.extname(assetData.originalName);
      const filename = `${assetId}${fileExtension}`;
      const filePath = path.join(assetsDir, filename);

      // 2. Guardar el archivo físico
      await fs.mkdir(assetsDir, { recursive: true });
      await fs.writeFile(filePath, Buffer.from(assetData.buffer));

      // 3. Crear el objeto de metadatos del asset
      const newAsset = {
        id: assetId,
        name: assetData.name,
        category: assetData.category,
        type: assetData.type,
        filename: filename,
        creationDate: new Date().toISOString(),
      };

      // 4. Actualizar book.json
      const bookContent = await fs.readFile(bookJsonPath, 'utf-8');
      const bookData = JSON.parse(bookContent);
      bookData.assets = bookData.assets || [];
      bookData.assets.push(newAsset);
      await fs.writeFile(bookJsonPath, JSON.stringify(bookData, null, 2));

      console.log(
        `[Electron Main] Asset guardado y registrado para el libro ${bookId}: ${filename}`,
      );
      return newAsset; // 5. Devolver el objeto completo al frontend
    } catch (error) {
      console.error(`[Electron Main] Error al guardar el asset para el libro ${bookId}:`, error);
      return null;
    }
  });

  // Eliminar un asset (actualizando book.json y borrando el archivo)
  ipcMain.handle('delete-asset', async (event, bookId: string, assetId: string) => {
    const bookJsonPath = path.join(getBookDir(bookId), 'book.json');
    try {
      // 1. Leer book.json
      const bookContent = await fs.readFile(bookJsonPath, 'utf-8');
      const bookData = JSON.parse(bookContent);

      const assets = bookData.assets || [];
      const assetIndex = assets.findIndex((a: { id: string }) => a.id === assetId);

      if (assetIndex === -1) {
        throw new Error(`Asset con ID ${assetId} no encontrado en el libro ${bookId}.`);
      }

      // 2. Obtener el nombre del archivo y eliminar el asset de la lista
      const [assetToDelete] = assets.splice(assetIndex, 1);
      bookData.assets = assets;

      // 3. Escribir el book.json actualizado
      await fs.writeFile(bookJsonPath, JSON.stringify(bookData, null, 2));

      // 4. Borrar el archivo físico
      const filePath = path.join(getBookAssetsDir(bookId), assetToDelete.filename);
      await fs.unlink(filePath);

      console.log(
        `[Electron Main] Asset eliminado para el libro ${bookId}: ${assetToDelete.filename}`,
      );
      return { success: true };
    } catch (error) {
      console.error(
        `[Electron Main] Error al eliminar el asset ${assetId} para el libro ${bookId}:`,
        error,
      );
      return { success: false, error: (error as Error).message };
    }
  });

  // Crear la ventana después de registrar los manejadores
  void createWindow();
});

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    void createWindow();
  }
});
