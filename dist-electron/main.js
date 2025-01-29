import { app, BrowserWindow } from 'electron';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { isDev } from './util.js';
app.on('ready', () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: getPreloadPath()
        }
    });
    if (!isDev())
        mainWindow.loadFile(getUIPath());
    else
        mainWindow.loadURL('http://localhost:5123');
});
