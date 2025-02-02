"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
});
electron_1.contextBridge.exposeInMainWorld('electron', {
    sendFrameAction: (action) => electron_1.ipcRenderer.send(action.toLowerCase()),
    testAI: (query) => electron_1.ipcRenderer.send('testAI', query),
});
