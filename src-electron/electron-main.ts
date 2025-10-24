import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

const booksBaseDir = path.join(app.getPath('userData'), 'gbooks-books');

function getBookAssetsDir(bookId: string): string {
  return path.join(booksBaseDir, bookId, 'assets');
}

const assetsDir = path.join(app.getPath('userData'), 'gbooks-assets');

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
          'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION
        )
      ),
    },
  });

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

void app.whenReady().then(() => {
  protocol.registerFileProtocol('gbooks-asset', (request, callback) => {
    const urlParts = request.url.replace(/^gbooks-asset:\/\//, '').split('/');
    if (urlParts.length < 2) {
      console.error('URL de asset inválida:', request.url);
      return callback({ error: -6 /* net::ERR_FILE_NOT_FOUND */ });
    }
    const bookId = urlParts[0];
    const filename = urlParts.slice(1).join('/'); // En caso de que el nombre del archivo tenga '/'
    const filePath = path.join(getBookAssetsDir(bookId), filename);
    callback({ path: path.normalize(filePath) });
  });
  // --- MANEJADORES DE IPC ---

  // Manejador para guardar el libro
  ipcMain.handle(
    'save-book',
    async (event, bookId: string, content: string) => { // Asumimos que save-book ahora recibe bookId
      const bookDir = path.join(booksBaseDir, bookId);
      await fs.mkdir(bookDir, { recursive: true }); // Asegurar que la carpeta del libro exista
      const absolutePath = path.join(bookDir, 'book.json'); // Guardar como book.json dentro de la carpeta del libro
      try {
        await fs.writeFile(absolutePath, content, 'utf-8');
        console.log(`[Electron Main] Archivo guardado en: ${absolutePath}`);
        return { success: true };
      } catch (error) {
        const err = error as Error;
        console.error(
          `[Electron Main] Error al guardar el archivo ${absolutePath}:`,
          err
        );
        return { success: false, error: err.message };
      }
    }
  );

  // Manejador para cargar el libro
  ipcMain.handle('load-book', async (event, bookId: string) => {
    const bookDir = path.join(booksBaseDir, bookId);
    const absolutePath = path.join(bookDir, 'book.json');
    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      console.log(`[Electron Main] Archivo cargado desde: ${absolutePath}`);
      return content;
    } catch (error) {
      console.error(
        `[Electron Main] Error al leer el archivo ${absolutePath}:`,
        error
      );
      throw error;
    }
  });

  ipcMain.handle('list-assets', async (event, bookId: string) => {
    const assetsDir = getBookAssetsDir(bookId);
    try {
      await fs.mkdir(assetsDir, { recursive: true });
      const files = await fs.readdir(assetsDir);
      return files.filter(file => /\.(png|jpe?g|gif|webp|svg)$/i.test(file));
    } catch (err) {
      console.error(`Error al leer el directorio de assets para el libro ${bookId}:`, err);
      return [];
    }
  });

  ipcMain.handle(
    'add-asset',
    async (event, bookId: string, originalName: string, fileData: ArrayBuffer) => {
      const assetsDir = getBookAssetsDir(bookId);
      try {
        const buffer = Buffer.from(fileData);
        const timestamp = Date.now();
        const extension = path.extname(originalName);
        const safeBaseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9]/g, '_');
        const newFileName = `${timestamp}-${safeBaseName}${extension}`;

        const filePath = path.join(assetsDir, newFileName);

        await fs.mkdir(assetsDir, { recursive: true });
        await fs.writeFile(filePath, buffer);

        console.log(`[Electron Main] Asset guardado para el libro ${bookId} como: ${newFileName}`);
        return { success: true, filename: newFileName };
      } catch (error) {
        const err = error as Error;
        console.error(`[Electron Main] Error al guardar el asset para el libro ${bookId}:`, err);
        return { success: false, error: err.message };
      }
    }
  );

  ipcMain.handle('delete-asset', async (event, bookId: string, filename: string) => {
    const assetsDir = getBookAssetsDir(bookId);
    try {
      const filePath = path.join(assetsDir, filename);
      await fs.unlink(filePath);
      console.log(`[Electron Main] Asset eliminado para el libro ${bookId}: ${filename}`);
      return { success: true };
    } catch (error) {
      const err = error as Error;
      console.error(`[Electron Main] Error al eliminar el asset ${filename} para el libro ${bookId}:`, err);
      return { success: false, error: err.message };
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
