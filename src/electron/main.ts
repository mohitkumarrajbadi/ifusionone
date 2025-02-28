import { app, BrowserWindow, ipcMain } from 'electron';
import { getPreloadPath, getUIPath, getExtensionFilePath } from './pathResolver.js';
import { isDev } from './util.js';
import codeCompiler from './CodeCompileManager/codeCompiler.js';
import { createWebContentView, closeWebContentView, switchToTab, activeTabId } from './TabManager/TabManager.js';
import { runAI } from './AiManager/AiManager.js';
import {getAllPlugins, insertPlugin } from './DatabaseManager/DatabaseManager.js';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    transparent: true,
    frame: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
  } else {
    mainWindow.loadFile(getUIPath());
  }

  setupWindowControls();
  setupIpcHandlers();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Update active tab bounds on window resize.
  mainWindow.on('resize', () => {
    if (!mainWindow) return;
    // Use the active tab id from tabmanager.
    switchToTab(activeTabId, mainWindow);
  });
}

function setupWindowControls() {
  ipcMain.on('minimize', () => mainWindow?.minimize());
  ipcMain.on('maximize', () => {
    if (mainWindow) {
      // Toggle full-screen mode
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
  ipcMain.on('close', () => mainWindow?.close());
}

function setupIpcHandlers() {
  ipcMain.on('testAI', async () => {
    runAI();
  });

  ipcMain.on('compile-code', async (event, { code, language }) => {
    try {
      const response = await codeCompiler(event, { code, language });
      console.log('Compilation Result:', response);
    } catch (error) {
      console.error('Error during compilation:', error);
    }
  });

  // ADD_TAB: Create a new tab.
  ipcMain.on('ADD_TAB', (event, extensionName: string) => {
    if (!mainWindow) return;
    const extensionPath = getExtensionFilePath(extensionName);
    const newTabId = createWebContentView(extensionPath, mainWindow);
    switchToTab(newTabId, mainWindow);
    event.reply('TAB_ADDED', newTabId);
  });

  // CLOSE_TAB: Close a tab by its id.
  ipcMain.on('CLOSE_TAB', (event, tabId: number) => {
    if (!mainWindow) return;
    closeWebContentView(tabId, mainWindow);
    event.reply('TAB_CLOSED', tabId);
  });

  // SWITCH_TAB: Switch to a given tab.
  ipcMain.on('SWITCH_TAB', (event, tabId: number) => {
    if (!mainWindow) return;
    console.log('Switch Tab request for tabId:', tabId);
    switchToTab(tabId, mainWindow);
    event.reply('TAB_SWITCHED', tabId);
  });

  // Legacy channels for extensions.
  // ipcMain.on('open-extension', (event, extensionName: string) => {
  //   if (!mainWindow) return;
  //   const extensionPath = getExtensionFilePath(extensionName);
  //   const newTabId = createWebContentView(extensionPath, mainWindow);
  //   switchToTab(newTabId, mainWindow);
  //   event.reply('TAB_ADDED', newTabId);
  // });

  // ipcMain.on('close-extension', (event, extensionName: string, tabId: number) => {
  //   if (!mainWindow) return;
  //   closeWebContentView(tabId, mainWindow);
  //   event.reply('TAB_CLOSED', tabId);
  // });

  // Database Operations
  ipcMain.on('createTable', () => {
    console.log('Invoke Testing DB')
    // createTable();
  });

  ipcMain.on('insert-plugin-table',() => {
    insertPlugin();
  });

  ipcMain.handle('get-plugins', async () => {
    try {
      const plugins = await getAllPlugins(); // Wait for DB response
      return plugins; // Return plugins to the renderer process
    } catch (error) {
      console.error("Failed to fetch plugins:", error);
      return []; // Return an empty array on error
    }
  });

}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
