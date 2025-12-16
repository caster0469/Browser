const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('arcBridge', {
  loadUrl: (url) => ipcRenderer.invoke('browser-load', url),
  navigate: (direction) => ipcRenderer.invoke('browser-nav', direction),
  setTheme: (theme) => ipcRenderer.invoke('browser-theme', theme),
  onStateChange: (callback) => {
    ipcRenderer.removeAllListeners('browser-state');
    ipcRenderer.on('browser-state', (_event, state) => callback(state));
  }
});
