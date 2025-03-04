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
    compileCode: (code, language) => electron_1.ipcRenderer.send('compile-code', { code, language }),
    // New tab actions
    addTab: (extensionName) => electron_1.ipcRenderer.send('ADD_TAB', extensionName),
    closeTab: (tabId) => electron_1.ipcRenderer.send('CLOSE_TAB', tabId),
    switchTab: (tabId) => electron_1.ipcRenderer.send('SWITCH_TAB', tabId),
    // Legacy channels if needed
    // openExtension: (extensionName: string) => ipcRenderer.send('open-extension', extensionName),
    // closeExtension: (extensionName: string, tabId: number) => ipcRenderer.send('close-extension', extensionName, tabId),
    // Database Actions
    insertPluginTable: () => electron_1.ipcRenderer.send('insert-plugin-table'),
    getAllPlugins: () => electron_1.ipcRenderer.invoke('get-plugins'),
    initializeAI: () => electron_1.ipcRenderer.invoke("initialize-ai"),
    chatWithAI: (prompt) => electron_1.ipcRenderer.invoke("chat-with-ai", prompt)
});
