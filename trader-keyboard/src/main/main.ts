import { app, BrowserWindow, Tray, Menu, nativeImage, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initLogger, logger } from './logger';
import { settingsStore } from './settingsStore';
import { registerIpcHandlers } from './ipcHandlers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Single-instance lock: a second launch (e.g. double-clicking the desktop
// icon while already running) just focuses the existing window instead of
// spawning a duplicate keyboard.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(__dirname, '../dist');
const PUBLIC_DIR = VITE_DEV_SERVER_URL ? path.join(__dirname, '../public') : RENDERER_DIST;

function createWindow(): void {
  const settings = settingsStore.getAll();
  const primaryDisplay = screen.getPrimaryDisplay();
  const defaultWidth = 900;
  const defaultHeight = 340;

  const bounds = settings.windowBounds ?? {
    width: defaultWidth,
    height: defaultHeight,
    x: Math.round((primaryDisplay.workAreaSize.width - defaultWidth) / 2),
    y: primaryDisplay.workAreaSize.height - defaultHeight - 40,
  };

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 640,
    minHeight: 260,
    frame: false,
    transparent: true,
    hasShadow: true,
    resizable: true,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: false,
    icon: path.join(PUBLIC_DIR, 'icon.png'),
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../dist-electron/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // IMPORTANT: this app is a virtual keyboard that types into OTHER
  // applications. If it ever grabs OS input focus, the very next keypress
  // would go to the keyboard window itself instead of the user's target
  // app. setFocusable(false) keeps the window purely clickable-but-non-
  // focus-stealing on Windows, so key presses always land in the target app.
  if (process.platform === 'win32') {
    mainWindow.setFocusable(false);
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver');
  }

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    } else {
      saveWindowBounds();
    }
  });

  mainWindow.on('moved', saveWindowBounds);
  mainWindow.on('resized', saveWindowBounds);

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error('Renderer process gone:', details);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logger.error('Failed to load renderer:', errorCode, errorDescription);
  });
}

function saveWindowBounds(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getBounds();
  settingsStore.set('windowBounds', bounds);
}

function createTray(): void {
  const iconPath = path.join(PUBLIC_DIR, 'tray-icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Trader Keyboard',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: settingsStore.get('alwaysOnTop'),
      click: (menuItem) => {
        settingsStore.set('alwaysOnTop', menuItem.checked);
        mainWindow?.setAlwaysOnTop(menuItem.checked, 'screen-saver');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Trader Keyboard');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  initLogger();
  logger.info('Trader Keyboard starting', { version: app.getVersion() });

  registerIpcHandlers(() => mainWindow);
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // Keep the app alive in the tray on Windows/macOS; only truly quit
  // when the user explicitly chooses Quit from the tray menu.
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});
