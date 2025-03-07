import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { getPreloadPath, getUIPath, getExtensionFilePath } from './pathResolver.js';
import { isDev } from './util.js';
import codeCompiler from './CodeCompileManager/codeCompiler.js';
import { createWebContentView, closeWebContentView, switchToTab, activeTabId } from './TabManager/TabManager.js';
import { chatWithAI, initializeAI } from './AiManager/AiManager.js';
import { getAllPlugins, insertPlugin } from './DatabaseManager/DatabaseManager.js';
import { searchDuckDuckGo } from './WebScrappingManager/WebScrappingManager.js';
import { testingLangGraph } from './AiManager/TestingLangchain.js';
import { CommandRegistry } from './core/CommandRegistry/CommandRegistry.js';
import WindowService from './core/Services/WindowService.js';

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

  // Set the main window reference in the WindowService.
  WindowService.setMainWindow(mainWindow);

  // Register window and tab commands.
  registerCommands();

  // Setup IPC handlers.
  setupWindowControls();
  setupIpcHandlers();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Update active tab bounds on window resize.
  mainWindow.on('resize', () => {
    if (mainWindow) {
      switchToTab(activeTabId, mainWindow);
    }
  });
}

// Register commands for window and tab management.
function registerCommands(): void {
  // Window Commands.
  CommandRegistry.register('window:minimize', () => WindowService.minimize());
  CommandRegistry.register('window:fullscreen', () => WindowService.toggleFullscreen());
  CommandRegistry.register('window:close', () => WindowService.close());

  // Tab Commands.
  CommandRegistry.register('tab:add', (event: IpcMainEvent, extensionName: string) => {
    if (!mainWindow) return;
    const extensionPath = getExtensionFilePath(extensionName);
    const newTabId = createWebContentView(extensionPath, mainWindow);
    switchToTab(newTabId, mainWindow);
    event.reply('TAB_ADDED', newTabId);
  });

  CommandRegistry.register('tab:close', (event: IpcMainEvent, tabId: number) => {
    if (!mainWindow) return;
    closeWebContentView(tabId, mainWindow);
    event.reply('TAB_CLOSED', tabId);
  });

  CommandRegistry.register('tab:switch', (event: IpcMainEvent, tabId: number) => {
    if (!mainWindow) return;
    switchToTab(tabId, mainWindow);
    event.reply('TAB_SWITCHED', tabId);
  });
}

function setupWindowControls(): void {
  // Route window control IPC calls to CommandRegistry.
  ipcMain.on('minimize', () => CommandRegistry.execute('window:minimize'));
  ipcMain.on('maximize', () => CommandRegistry.execute('window:fullscreen'));
  ipcMain.on('close', () => CommandRegistry.execute('window:close'));
}

function setupIpcHandlers(): void {
  /*** AI Manager ***/
  ipcMain.handle("initialize-ai", async () => {
    await initializeAI();
  });

  ipcMain.handle("chat-with-ai", async (_event, prompt: string) => {
    return await chatWithAI(prompt);
  });

  /*** Code Compiler ***/
  ipcMain.on('compile-code', async (event, { code, language }) => {
    try {
      const response = await codeCompiler(event, { code, language });
      console.log('Compilation Result:', response);
    } catch (error) {
      console.error('Error during compilation:', error);
    }
  });

  /*** Database Operations ***/
  ipcMain.on('createTable', () => {
    console.log('Invoke Testing DB');
    // createTable(); // Uncomment and implement as needed.
  });

  ipcMain.on('insert-plugin-table', () => {
    insertPlugin();
  });

  ipcMain.handle('get-plugins', async () => {
    try {
      return await getAllPlugins();
    } catch (error) {
      console.error("Failed to fetch plugins:", error);
      return [];
    }
  });

  /*** Web Scrapping Section ***/
  ipcMain.handle('search-duck-duck-go', async (_event, query: string) => {
    try {
      console.log("Inside search-duck-duck-go");
      return await searchDuckDuckGo(query);
    } catch (error) {
      console.error("Error fetching search results:", error);
      throw new Error("Failed to fetch search results: " + error);
    }
  });

  /*** Testing Section ***/
  ipcMain.handle('testing-langchain', async (_event, query: string) => {
    console.log("Inside testing-langchain");
    try {
      return await testingLangGraph(query);
    } catch (error) {
      console.error("Error testing langchain:", error);
      throw new Error("Failed to test langchain: " + error);
    }
  });

  // Tab-related IPC messages routed to CommandRegistry.
  ipcMain.on('ADD_TAB', (event, extensionName: string) => {
    console.log('ADD_TAB event received:', extensionName);
    CommandRegistry.execute('tab:add', event, extensionName);
  });
  ipcMain.on('CLOSE_TAB', (event, tabId: number) => {
    CommandRegistry.execute('tab:close', event, tabId);
  });
  ipcMain.on('SWITCH_TAB', (event, tabId: number) => {
    CommandRegistry.execute('tab:switch', event, tabId);
  });

  // Generic command handler.
  ipcMain.handle('command', async (event, command: string, args: any) => {
    console.log("command:", command);
    console.log("args:", args);
    CommandRegistry.execute(command, event, args);
  });

}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
