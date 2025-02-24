import { app, BrowserWindow, ipcMain } from 'electron';
import { getPreloadPath, getUIPath, getExtensionFilePath } from './pathResolver.js';
import { isDev } from './util.js';
import codeCompiler from './CodeCompileManager/codeCompiler.js';
import { createWebContentView, closeWebContentView, switchToTab, activeTabId } from './TabManager/TabManager.js';
import { runAI } from './AiManager/AiManager.js';
// Import sqlite and sqlite3 for our database operations.
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
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
        // Use the active tab id from TabManager.
        switchToTab(activeTabId, mainWindow);
    });
}
function setupWindowControls() {
    ipcMain.on('minimize', () => mainWindow?.minimize());
    ipcMain.on('maximize', () => {
        if (mainWindow) {
            mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize();
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
        }
        catch (error) {
            console.error('Error during compilation:', error);
        }
    });
    // TAB IPC handlers
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
    // Legacy channels for extensions.
    ipcMain.on('open-extension', (event, extensionName) => {
        if (!mainWindow)
            return;
        const extensionPath = getExtensionFilePath(extensionName);
        const newTabId = createWebContentView(extensionPath, mainWindow);
        switchToTab(newTabId, mainWindow);
        event.reply('TAB_ADDED', newTabId);
    });
    ipcMain.on('close-extension', (event, extensionName, tabId) => {
        if (!mainWindow)
            return;
        closeWebContentView(tabId, mainWindow);
        event.reply('TAB_CLOSED', tabId);
    });
    /* ------------------- SQLite CRUD IPC Handlers ------------------- */
    // Create database and table.
    ipcMain.on('create-database', async (event) => {
        try {
            const db = await open({
                filename: '/tmp/database.db',
                driver: sqlite3.Database
            });
            await db.run(`CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          description TEXT
      )`);
            await db.close();
            console.log('Database and table created successfully.');
            event.reply('db-created', "Database and table created successfully.");
        }
        catch (err) {
            console.error("Error creating database:", err.message);
            event.reply('db-error', err.message);
        }
    });
    // Insert a new row.
    ipcMain.on('insert-item', async (event, { name, description }) => {
        try {
            const db = await open({
                filename: '/tmp/database.db',
                driver: sqlite3.Database
            });
            const result = await db.run("INSERT INTO items (name, description) VALUES (?, ?)", name, description);
            await db.close();
            console.log("Inserted row with id:", result.lastID);
            event.reply('item-inserted', { id: result.lastID });
        }
        catch (err) {
            console.error("Error inserting row:", err.message);
            event.reply('db-error', err.message);
        }
    });
    // Read all rows.
    ipcMain.on('read-items', async (event) => {
        try {
            const db = await open({
                filename: '/tmp/database.db',
                driver: sqlite3.Database
            });
            const rows = await db.all("SELECT * FROM items");
            await db.close();
            event.reply('items-read', rows);
        }
        catch (err) {
            console.error("Error reading items:", err.message);
            event.reply('db-error', err.message);
        }
    });
    // Update an item.
    ipcMain.on('update-item', async (event, { id, name, description }) => {
        try {
            const db = await open({
                filename: '/tmp/database.db',
                driver: sqlite3.Database
            });
            const result = await db.run("UPDATE items SET name = ?, description = ? WHERE id = ?", name, description, id);
            await db.close();
            event.reply('item-updated', { changes: result.changes });
        }
        catch (err) {
            console.error("Error updating item:", err.message);
            event.reply('db-error', err.message);
        }
    });
    // Delete an item.
    ipcMain.on('delete-item', async (event, id) => {
        try {
            const db = await open({
                filename: '/tmp/database.db',
                driver: sqlite3.Database
            });
            const result = await db.run("DELETE FROM items WHERE id = ?", id);
            await db.close();
            event.reply('item-deleted', { changes: result.changes });
        }
        catch (err) {
            console.error("Error deleting item:", err.message);
            event.reply('db-error', err.message);
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
