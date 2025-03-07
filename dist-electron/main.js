// main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { getPreloadPath, getUIPath, getExtensionFilePath } from './pathResolver.js';
import { isDev } from './util.js';
import codeCompiler from './CodeCompileManager/codeCompiler.js';
import { createWebContentView, closeWebContentView, switchToTab, activeTabId } from './TabManager/TabManager.js';
import { getAllPlugins, insertPlugin } from './DatabaseManager/DatabaseManager.js';
import { searchDuckDuckGo } from './WebScrappingManager/WebScrappingManager.js';
import { testingLangGraph } from './AiManager/TestingLangchain.js';
import { CommandRegistry } from './core/CommandRegistry/CommandRegistry.js';
import WindowService from './core/Services/WindowService.js';
import AIChatManager from './AiManager/AiManager.js'; // Default import
let mainWindow = null;
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
    }
    else {
        mainWindow.loadFile(getUIPath());
    }
    // Set the main window reference in the WindowService.
    WindowService.setMainWindow(mainWindow);
    // Register window, tab, and AI commands.
    registerCommands();
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
function registerCommands() {
    // Window Commands.
    CommandRegistry.register('window:minimize', () => WindowService.minimize());
    CommandRegistry.register('window:fullscreen', () => WindowService.toggleFullscreen());
    CommandRegistry.register('window:close', () => WindowService.close());
    // Tab Commands.
    CommandRegistry.register('tab:add', (event, extensionName) => {
        if (!mainWindow)
            return;
        const extensionPath = getExtensionFilePath(extensionName);
        const newTabId = createWebContentView(extensionPath, mainWindow);
        switchToTab(newTabId, mainWindow);
        return newTabId;
    });
    CommandRegistry.register('tab:close', (event, tabId) => {
        if (!mainWindow)
            return;
        closeWebContentView(tabId, mainWindow);
        return tabId;
    });
    CommandRegistry.register('tab:switch', (event, tabId) => {
        if (!mainWindow)
            return;
        switchToTab(tabId, mainWindow);
        return tabId;
    });
    // AI Commands.
    CommandRegistry.register('ai:initialize', async (event) => {
        await AIChatManager.initialize();
        return "AI Initialized";
    });
    CommandRegistry.register('ai:chat', async (event, prompt) => {
        console.log("Inside the Chat Command");
        return await AIChatManager.chat(prompt);
    });
    CommandRegistry.register('ai:reset', async (event) => {
        await AIChatManager.resetSession();
        return "AI Session Reset";
    });
    CommandRegistry.register('ai:close', async (event) => {
        await AIChatManager.close();
        return "AI Session Closed";
    });
    CommandRegistry.register('ai:save-history', async (event, filePath) => {
        await AIChatManager.saveChatHistory(filePath);
        return "Chat History Saved";
    });
    CommandRegistry.register('ai:restore-history', async (event, filePath) => {
        await AIChatManager.restoreChatHistory(filePath);
        return "Chat History Restored";
    });
    CommandRegistry.register('ai:preload', async (event, prompt) => {
        await AIChatManager.preloadPrompt(prompt);
        return "Prompt Preloaded";
    });
    CommandRegistry.register('ai:complete', async (event, prompt) => {
        return await AIChatManager.completePrompt(prompt);
    });
}
function setupWindowControls() {
    ipcMain.on('minimize', () => CommandRegistry.execute('window:minimize'));
    ipcMain.on('maximize', () => CommandRegistry.execute('window:fullscreen'));
    ipcMain.on('close', () => CommandRegistry.execute('window:close'));
}
function setupIpcHandlers() {
    ipcMain.on('compile-code', async (event, { code, language }) => {
        try {
            const response = await codeCompiler(event, { code, language });
            console.log('Compilation Result:', response);
        }
        catch (error) {
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
        }
        catch (error) {
            console.error("Failed to fetch plugins:", error);
            return [];
        }
    });
    ipcMain.handle('search-duck-duck-go', async (_event, query) => {
        try {
            console.log("Inside search-duck-duck-go");
            return await searchDuckDuckGo(query);
        }
        catch (error) {
            console.error("Error fetching search results:", error);
            throw new Error("Failed to fetch search results: " + error);
        }
    });
    ipcMain.handle('testing-langchain', async (_event, query) => {
        console.log("Inside testing-langchain");
        try {
            return await testingLangGraph(query);
        }
        catch (error) {
            console.error("Error testing langchain:", error);
            throw new Error("Failed to test langchain: " + error);
        }
    });
    ipcMain.on('ADD_TAB', (event, extensionName) => {
        console.log('ADD_TAB event received:', extensionName);
        CommandRegistry.execute('tab:add', event, extensionName);
    });
    ipcMain.on('CLOSE_TAB', (event, tabId) => {
        CommandRegistry.execute('tab:close', event, tabId);
    });
    ipcMain.on('SWITCH_TAB', (event, tabId) => {
        CommandRegistry.execute('tab:switch', event, tabId);
    });
    ipcMain.handle('command', async (event, command, args) => {
        console.log("Received generic command:", command, "with args:", args);
        const argsArray = Array.isArray(args) ? args : [args];
        const responseCommand = CommandRegistry.execute(command, event, ...argsArray);
        console.log("Command response:", responseCommand);
        return responseCommand;
    });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
