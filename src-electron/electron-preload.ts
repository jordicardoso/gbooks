import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveBook: (
    bookId: string, // Ahora saveBook también recibe bookId
    content: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('save-book', bookId, content),

  /**
   * Carga el contenido de un archivo.
   * @param relativePath - Ej: 'public/mock-data/adventure_1.json'
   * @returns El contenido del archivo como string.
   */
  loadBook: (bookId: string): Promise<string> => // Ahora loadBook también recibe bookId
    ipcRenderer.invoke('load-book', bookId),

  listAssets: (bookId: string): Promise<string[]> => // Ahora listAssets recibe bookId
    ipcRenderer.invoke('list-assets', bookId),

  addAsset: (
    bookId: string, // Ahora addAsset recibe bookId
    originalName: string,
    fileData: ArrayBuffer
  ): Promise<{ success: boolean; filename?: string; error?: string }> =>
    ipcRenderer.invoke('add-asset', bookId, originalName, fileData),

  deleteAsset: (
    bookId: string, // Ahora deleteAsset recibe bookId
    filename: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('delete-asset', bookId, filename),
});
