import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {

  loadLibrary: () => ipcRenderer.invoke('library:load'),
  saveLibrary: (books) => ipcRenderer.invoke('library:save', books),
  createBook: (data) => ipcRenderer.invoke('book:create', data),

  saveBook: (
    bookId: string, // Ahora saveBook también recibe bookId
    content: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('save-book', bookId, content),

  loadBook: (bookId: string): Promise<string> => // Ahora loadBook también recibe bookId
    ipcRenderer.invoke('load-book', bookId),

  deleteBook: (bookId: string) => ipcRenderer.invoke('book:delete', bookId),

  listAssets: (bookId: string): Promise<string[]> => // Ahora listAssets recibe bookId
    ipcRenderer.invoke('list-assets', bookId),

  addAsset: (
    bookId: string, // Ahora addAsset recibe bookId
    originalName: string,
    fileData: ArrayBuffer
  ): Promise<{ success: boolean; filename?: string; error?: string }> =>
    ipcRenderer.invoke('add-asset', bookId, originalName, fileData),

  saveAsset: (bookId: string, assetData: { buffer: ArrayBuffer, name: string, category: string, originalName: string, type: string }) =>
    ipcRenderer.invoke('save-asset', bookId, assetData),

  deleteAsset: (
    bookId: string, // Ahora deleteAsset recibe bookId
    assetId: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('delete-asset', bookId, assetId),
});
