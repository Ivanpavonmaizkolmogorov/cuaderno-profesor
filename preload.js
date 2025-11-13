// /Users/ivanpavonmaiz/Proyectos/cuaderno-profesor/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expone una API segura a la ventana del renderer (tu js/main.js)
contextBridge.exposeInMainWorld('electronAPI', {
  startGoogleLogin: () => ipcRenderer.invoke('google-oauth-start')
});