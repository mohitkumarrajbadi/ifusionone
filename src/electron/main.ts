import { app, BrowserWindow, nativeTheme } from 'electron';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { isDev } from './util.js';

app.on('ready', () => {
    const mainWindow = new BrowserWindow(
        {
            webPreferences: {
                preload: getPreloadPath()
            }
        },

    );


    if (!isDev())
        mainWindow.loadFile(getUIPath());
    else
        mainWindow.loadURL('http://localhost:5123')


});