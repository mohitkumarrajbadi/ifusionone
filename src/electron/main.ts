// main.ts

import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { getPreloadPath, getUIPath, getExtensionFilePath, getAiBackEndExecutableFile } from './pathResolver.js';
import { isDev } from './util.js';
import codeCompiler from './CodeCompileManager/codeCompiler.js';
import { createWebContentView, closeWebContentView, switchToTab, activeTabId } from './TabManager/TabManager.js';
import { getAllPlugins, insertPlugin } from './DatabaseManager/DatabaseManager.js';
import { searchDuckDuckGo } from './WebScrappingManager/WebScrappingManager.js';
import { testingLangGraph } from './AiManager/TestingLangchain.js';
import { CommandRegistry } from './core/CommandRegistry/CommandRegistry.js';
import WindowService from './core/Services/WindowService.js';
import AIChatManager from './AiManager/AiManager.js';  // Default import
import { processFile } from './AiManager/DataProcessor.js';
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { testBackendConnection } from './AiPythonBackendManager/AiPythonBackendManager.js';
import os from 'os';
import path from 'path';

let backendProcess: any = null;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    transparent: true,                    // ✅ Transparent background
    frame: false,                         // ✅ Frameless window
    fullscreenable: true,                 // ✅ Allow fullscreen
    autoHideMenuBar: true,                // ✅ Hide menu bar
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
  } else {
    mainWindow.loadFile(getUIPath());
  }

  // Set the main window reference in the WindowService.
  WindowService.setMainWindow(mainWindow);

  // Register window, tab, and AI commands.
  registerCommands();
  startBackend();  // Start Python backend on app launch


  // Setup IPC handlers.
  setupWindowControls();
  setupIpcHandlers();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('resize', () => {
    if (mainWindow) {
      switchToTab(activeTabId, mainWindow);
    }
  });
}

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
    return newTabId;
  });
  CommandRegistry.register('tab:close', (event: IpcMainEvent, tabId: number) => {
    if (!mainWindow) return;
    closeWebContentView(tabId, mainWindow);
    return tabId;
  });
  CommandRegistry.register('tab:switch', (event: IpcMainEvent, tabId: number) => {
    if (!mainWindow) return;
    switchToTab(tabId, mainWindow);
    return tabId;
  });

  // AI Commands.

  CommandRegistry.register('ai:initialize', async (event: IpcMainEvent) => {
    await AIChatManager.initialize();
    return "AI Initialized";
  });
  CommandRegistry.register('ai:chat', async (event: IpcMainEvent, prompt: string) => {
    console.log("Inside the Chat Command");
    return await AIChatManager.chat(prompt);
  });
  CommandRegistry.register('ai:reset', async (event: IpcMainEvent) => {
    await AIChatManager.resetSession();
    return "AI Session Reset";
  });
  CommandRegistry.register('ai:close', async (event: IpcMainEvent) => {
    await AIChatManager.close();
    return "AI Session Closed";
  });
  CommandRegistry.register('ai:save-history', async (event: IpcMainEvent, filePath: string) => {
    await AIChatManager.saveChatHistory(filePath);
    return "Chat History Saved";
  });
  CommandRegistry.register('ai:restore-history', async (event: IpcMainEvent, filePath: string) => {
    await AIChatManager.restoreChatHistory(filePath);
    return "Chat History Restored";
  });
  CommandRegistry.register('ai:preload', async (event: IpcMainEvent, prompt: string) => {
    await AIChatManager.preloadPrompt(prompt);
    return "Prompt Preloaded";
  });
  CommandRegistry.register('ai:complete', async (event: IpcMainEvent, prompt: string) => {
    return await AIChatManager.completePrompt(prompt);
  });

  // Process DataSet
  CommandRegistry.register('ai:process-dataset', async (event: IpcMainEvent, filePath: string) => {
    console.log('Main filePath : ', filePath)
    const result = await processFile(filePath as any);
    return result;
  });

  // Ai Backend Python Testing
  CommandRegistry.register('ai:test-python-backend', async (event: IpcMainEvent, filePath: string) => {
    console.log('Main.ts Testing python backedn')
    const result = '';
    testBackendConnection()
      .then((data) => console.log("Backend Response:", data))
      .catch((error) => console.error("Backend Error:", error));
    return result;
  });

}

function setupWindowControls(): void {
  ipcMain.on('minimize', () => CommandRegistry.execute('window:minimize'));
  ipcMain.on('maximize', () => CommandRegistry.execute('window:fullscreen'));
  ipcMain.on('close', () => CommandRegistry.execute('window:close'));
}

function setupIpcHandlers(): void {
  ipcMain.on('compile-code', async (event, { code, language }) => {
    try {
      const response = await codeCompiler(event, { code, language });
      console.log('Compilation Result:', response);
    } catch (error) {
      console.error('Error during compilation:', error);
    }
  });
  ipcMain.on('createTable', () => {
    console.log('Invoke Testing DB');
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
  ipcMain.handle('search-duck-duck-go', async (_event, query: string) => {
    try {
      console.log("Inside search-duck-duck-go");
      return await searchDuckDuckGo(query);
    } catch (error) {
      console.error("Error fetching search results:", error);
      throw new Error("Failed to fetch search results: " + error);
    }
  });
  ipcMain.handle('testing-langchain', async (_event, query: string) => {
    console.log("Inside testing-langchain");
    try {
      return await testingLangGraph(query);
    } catch (error) {
      console.error("Error testing langchain:", error);
      throw new Error("Failed to test langchain: " + error);
    }
  });
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
  ipcMain.handle('command', async (event, command: string, args: any) => {
    console.log("Received generic command:", command, "with args:", args);
    const argsArray = Array.isArray(args) ? args : [args];
    const responseCommand = CommandRegistry.execute(command, event, ...argsArray);
    console.log("Command response:", responseCommand);
    return responseCommand;
  });
}

// Start the Python backend
function startBackend(): void {
  // try {
  //   const backendPath: string = getAiBackEndExecutableFile();
  //   const interpreter: string = os.platform() === "win32" ? "python" : "python3";

  //   console.log(`🚀 Starting Python backend: ${interpreter} -m uvicorn server:app --reload`);

  //   // Spawn the backend process
  //   backendProcess = spawn(interpreter, ["-m", "uvicorn", "server:app", "--reload"], {
  //     cwd: path.dirname(backendPath),  // Ensure the working directory is correct
  //     detached: true,                   // Run process independently
  //     stdio: "inherit",                  // Display backend logs in Electron console
  //   });

  //   // Handle backend process events
  //   backendProcess.on("close", (code: number) => {
  //     console.log(`🔚 Backend exited with code ${code}`);
  //     backendProcess = null;
  //   });

  //   backendProcess.on("error", (err: Error) => {
  //     console.error(`🔥 Backend Execution Error: ${err.message}`);
  //   });

  // } catch (error) {
  //   console.error("❌ Failed to start backend:", error);
  // }
}

function stopBackend(): void {
  if (backendProcess) {
    console.log("🛑 Stopping backend process...");
    backendProcess.kill();
    backendProcess = null;
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
