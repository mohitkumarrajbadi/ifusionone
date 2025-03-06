import { app, BrowserWindow, ipcMain } from 'electron';
import { getPreloadPath, getUIPath, getExtensionFilePath } from './pathResolver.js';
import { isDev } from './util.js';
import codeCompiler from './CodeCompileManager/codeCompiler.js';
import { createWebContentView, closeWebContentView, switchToTab, activeTabId } from './TabManager/TabManager.js';
import { chatWithAI, initializeAI } from './AiManager/AiManager.js';
import { getAllPlugins, insertPlugin } from './DatabaseManager/DatabaseManager.js';
import { searchDuckDuckGo } from './WebScrappingManager/WebScrappingManager.js';
import { testingLangGraph } from './AiManager/TestingLangchain.js';
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
    setupWindowControls();
    setupIpcHandlers();
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Update active tab bounds on window resize.
    mainWindow.on('resize', () => {
        if (!mainWindow)
            return;
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
    /*** AI Manager ***/
    ipcMain.handle("initialize-ai", async () => {
        await initializeAI();
    });
    ipcMain.handle("chat-with-ai", async (_event, prompt) => {
        return await chatWithAI(prompt);
    });
    /*** Code Compiler ***/
    ipcMain.on('compile-code', async (event, { code, language }) => {
        try {
            const response = await codeCompiler(event, { code, language });
            console.log('Compilation Result:', response);
        }
        catch (error) {
            console.error('Error during compilation:', error);
        }
    });
    /*** Tab Manager ***/
    ipcMain.on('ADD_TAB', (event, extensionName) => {
        if (!mainWindow)
            return;
        const extensionPath = getExtensionFilePath(extensionName);
        const newTabId = createWebContentView(extensionPath, mainWindow);
        switchToTab(newTabId, mainWindow);
        event.reply('TAB_ADDED', newTabId);
    });
    ipcMain.on('CLOSE_TAB', (event, tabId) => {
        if (!mainWindow)
            return;
        closeWebContentView(tabId, mainWindow);
        event.reply('TAB_CLOSED', tabId);
    });
    ipcMain.on('SWITCH_TAB', (event, tabId) => {
        if (!mainWindow)
            return;
        console.log('Switch Tab request for tabId:', tabId);
        switchToTab(tabId, mainWindow);
        event.reply('TAB_SWITCHED', tabId);
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
            const plugins = await getAllPlugins();
            return plugins;
        }
        catch (error) {
            console.error("Failed to fetch plugins:", error);
            return [];
        }
    });
    /*** Web Scrapping Section ***/
    ipcMain.handle('search-duck-duck-go', async (_event, query) => {
        try {
            console.log("inside the search-duck-duck-go");
            const searchResults = await searchDuckDuckGo(query);
            return searchResults;
        }
        catch (error) {
            console.error("Error fetching search results:", error);
            throw new Error("Failed to fetch search results: " + error);
        }
    });
    /*** Testing Section ***/
    ipcMain.handle('testing-langchain', async (_event, query) => {
        console.log("inside the testing-langchain");
        try {
            // const response = await chatLangchainAI(query);
            // const response = await chatLangchainRAG(query,getAssetPath());
            const response = await testingLangGraph(query);
            return response;
        }
        catch (error) {
            console.error("Error fetching search results:", error);
            throw new Error("Failed to fetch search results: " + error);
        }
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
