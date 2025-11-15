// /Users/ivanpavonmaiz/Proyectos/cuaderno-profesor/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expone una API segura a la ventana del renderer (tu js/main.js)
contextBridge.exposeInMainWorld('electronAPI', {
  startGoogleLogin: () => ipcRenderer.invoke('google-oauth-start'),
  saveAs: () => ipcRenderer.invoke('save-file-dialog'),
  connectFile: () => ipcRenderer.invoke('open-file-dialog'),
  saveFile: (content) => ipcRenderer.invoke('save-file-local', content),
  updateDriveFile: (fileId, content, accessToken) => ipcRenderer.invoke('update-file-drive', fileId, content, accessToken),
  updateDriveMirror: (fileName, content, accessToken) => ipcRenderer.invoke('update-mirror-drive', fileName, content, accessToken)
});