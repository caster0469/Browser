const path = require('path');
const { app, BrowserWindow, BrowserView, ipcMain, nativeTheme } = require('electron');

const SIDEBAR_WIDTH = 320;
let mainWindow;
let view;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: 'Arc Lite',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#f5f5f7',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      scrollBounce: true,
      devTools: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      scrollBounce: true,
      devTools: true,
      partition: 'persist:arc-lite'
    }
  });

  mainWindow.setBrowserView(view);
  view.webContents.loadURL('https://example.com');

  const updateViewBounds = () => {
    if (!mainWindow || !view) return;
    const { width, height } = mainWindow.getContentBounds();
    view.setBounds({
      x: SIDEBAR_WIDTH,
      y: 0,
      width: Math.max(200, width - SIDEBAR_WIDTH),
      height
    });
  };

  updateViewBounds();
  mainWindow.on('resize', updateViewBounds);
  mainWindow.on('maximize', updateViewBounds);
  mainWindow.on('unmaximize', updateViewBounds);

  const pushBrowserState = () => {
    if (!mainWindow || !view) return;
    mainWindow.webContents.send('browser-state', {
      url: view.webContents.getURL(),
      title: view.webContents.getTitle(),
      canGoBack: view.webContents.canGoBack(),
      canGoForward: view.webContents.canGoForward()
    });
  };

  view.webContents.on('did-navigate', pushBrowserState);
  view.webContents.on('did-navigate-in-page', pushBrowserState);
  view.webContents.on('page-title-updated', pushBrowserState);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('browser-load', async (_event, url) => {
  if (!view) return;
  const safeUrl = /^https?:\/\//i.test(url) ? url : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
  await view.webContents.loadURL(safeUrl);
});

ipcMain.handle('browser-nav', (_event, direction) => {
  if (!view) return;
  if (direction === 'back' && view.webContents.canGoBack()) view.webContents.goBack();
  if (direction === 'forward' && view.webContents.canGoForward()) view.webContents.goForward();
  if (direction === 'reload') view.webContents.reload();
});

ipcMain.handle('browser-theme', (_event, theme) => {
  if (theme === 'light' || theme === 'dark') {
    nativeTheme.themeSource = theme;
  } else {
    nativeTheme.themeSource = 'system';
  }
});
