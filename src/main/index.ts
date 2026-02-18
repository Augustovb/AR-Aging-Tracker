import { app, BrowserWindow } from 'electron';
import path from 'path';
import logger from './utils/logger';
import DatabaseService from './services/database/DatabaseService';
import { registerIPCHandlers } from './ipc-handlers';
import { ApiKeyManager } from './services/security/ApiKeyManager';
import { SyncEngine } from './services/sync/SyncEngine';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'AR Aging Tracker',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    logger.info('Application starting...');

    // Initialize database
    DatabaseService.initialize();

    // Initialize and encrypt API keys
    ApiKeyManager.initialize();

    // Register IPC handlers
    registerIPCHandlers();

    // Auto-sync from Excel on startup
    try {
      const excelPath = path.join(__dirname, '../..', 'Billing _ AR Aging.xlsx');
      const syncEngine = new SyncEngine(excelPath);
      const result = await syncEngine.sync();
      logger.info(`Auto-sync result: ${result.message}`);
    } catch (syncError) {
      logger.warn('Auto-sync skipped or failed:', syncError);
    }

    // Create main window
    createWindow();

    logger.info('Application started successfully');
  } catch (error) {
    logger.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    DatabaseService.close();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  DatabaseService.close();
});
