import { app, BrowserWindow } from 'electron';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { isDev } from './util.js';
app.whenReady().then(() => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true, // Ensures security
            nodeIntegration: false, // Prevents exposing Node.js APIs
        }
    });
    if (!isDev()) {
        mainWindow.loadFile(getUIPath());
    }
    else {
        mainWindow.loadURL('http://localhost:5123');
    }
});
