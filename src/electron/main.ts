import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { getPreloadPath, getUIPath, getExtensionFilePath } from './pathResolver.js';
import { isDev } from './util.js';
import codeCompiler from './core/Services/CompilerService/CompilerService.js';
import { createWebContentView, closeWebContentView, switchToTab } from './core/Services/TabService/TabManager.js';
import { getAllPlugins, insertPlugin, runSqlCommand } from './core/Services/DatabaseService/DatabaseService.js';
import { CommandRegistry } from './core/Registry/CommandRegistry.js';
import WindowService from './core/Services/WindowService.js';
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    transparent: true,
    frame: false,
    fullscreenable: true,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(isDev() ? 'http://localhost:5123' : getUIPath());
  WindowService.setMainWindow(mainWindow);
  registerCommands();
  setupIpcHandlers();

  mainWindow.on('closed', () => (mainWindow = null));
  mainWindow.on('resize', () => mainWindow );
}

function registerCommands(): void {
  // Window Commands
  CommandRegistry.register('window:minimize', () => WindowService.minimize());
  CommandRegistry.register('window:fullscreen', () => WindowService.toggleFullscreen());
  CommandRegistry.register('window:close', () => WindowService.close());

  // Tab Commands
  CommandRegistry.register('tab:add', (event: IpcMainEvent, extensionName: string) => {
    if (!mainWindow) return;
    const extensionPath = getExtensionFilePath(extensionName);
    const newTabId = createWebContentView(extensionPath, mainWindow);
    if (newTabId) switchToTab(newTabId, mainWindow);
    return newTabId;
  });
  CommandRegistry.register('tab:close', (event: IpcMainEvent, tabId: number) => closeWebContentView(tabId, mainWindow));
  CommandRegistry.register('tab:switch', (event: IpcMainEvent, tabId: number) => switchToTab(tabId, mainWindow));

  // AI Commands
  // CommandRegistry.register('ai:initialize', async () => await AIChatManager.initialize());
  // CommandRegistry.register('ai:chat', async (_event, prompt: string) => await AIChatManager.chat(prompt));
  // CommandRegistry.register('ai:reset', async () => await AIChatManager.resetSession());
  // CommandRegistry.register('ai:close', async () => await AIChatManager.close());
  // CommandRegistry.register('ai:save-history', async (_event, filePath: string) => await AIChatManager.saveChatHistory(filePath));
  // CommandRegistry.register('ai:restore-history', async (_event, filePath: string) => await AIChatManager.restoreChatHistory(filePath));
  // CommandRegistry.register('ai:preload', async (_event, prompt: string) => await AIChatManager.preloadPrompt(prompt));
  // CommandRegistry.register('ai:complete', async (_event, prompt: string) => await AIChatManager.completePrompt(prompt));
  // CommandRegistry.register('ai:process-dataset', async (_event, filePath: string) => await processFile(filePath));
  // CommandRegistry.register('ai:test-python-backend', async () => testBackendConnection());
}

function setupIpcHandlers(): void {
  ipcMain.on('minimize', () => CommandRegistry.execute('window:minimize'));
  ipcMain.on('maximize', () => CommandRegistry.execute('window:fullscreen'));
  ipcMain.on('close', () => CommandRegistry.execute('window:close'));
  ipcMain.on('ADD_TAB', (event, extensionName: string) => CommandRegistry.execute('tab:add', event, extensionName));
  ipcMain.on('CLOSE_TAB', (event, tabId: number) => CommandRegistry.execute('tab:close', event, tabId));
  ipcMain.on('SWITCH_TAB', (event, tabId: number) => CommandRegistry.execute('tab:switch', event, tabId));
  ipcMain.handle('compile-code', async (_event, { code, language }) => await codeCompiler({ code, language }));
  ipcMain.on('insert-plugin-table', () => insertPlugin());
  ipcMain.handle('get-plugins', async () => await getAllPlugins());
  ipcMain.handle('run-sql', async (_event, query: string) => await runSqlCommand(query));
  // ipcMain.handle('search-duck-duck-go', async (_event, query: string) => await searchDuckDuckGo(query));
  // ipcMain.handle('testing-langchain', async (_event, query: string) => await testingLangGraph(query));
  ipcMain.handle('command', async (_event, command: string, args: any) => CommandRegistry.execute(command, _event, ...[].concat(args)));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
