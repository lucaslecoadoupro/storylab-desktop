// Pont sécurisé entre l'interface et le système de fichiers
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('declicStudio', {
  getInfo: () => ipcRenderer.invoke('app:info'),
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  openDataFolder: () => ipcRenderer.invoke('data:open-folder'),
  mediaPut: (name, dataUrl) => ipcRenderer.invoke('media:put', name, dataUrl),
  mediaGet: (name, mime) => ipcRenderer.invoke('media:get', name, mime),
  mediaHas: (name) => ipcRenderer.invoke('media:has', name),
  saveFile: (opts) => ipcRenderer.invoke('file:save', opts),
  openFile: () => ipcRenderer.invoke('file:open'),
  revealFile: (p) => ipcRenderer.invoke('file:reveal', p),
  pendingFile: () => ipcRenderer.invoke('file:pending'),
  openMail: (url) => ipcRenderer.invoke('shell:mail', url),
  onMenu: (cb) => { const h = (_e, v) => cb(v); ipcRenderer.on('menu', h); return () => ipcRenderer.removeListener('menu', h); },
  onFileOpened: (cb) => { const h = (_e, v) => cb(v); ipcRenderer.on('file:opened', h); return () => ipcRenderer.removeListener('file:opened', h); },
});
