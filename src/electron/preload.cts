import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld('electron', {
  sendFrameAction: (action: string) => ipcRenderer.send(action.toLowerCase()),
  testAI: (query: string) => ipcRenderer.send('testAI', query),
  compileCode: (code: string, language: string) => ipcRenderer.send('compile-code', { code, language }),
  // New tab actions
  addTab: (extensionName: string) => ipcRenderer.send('ADD_TAB', extensionName),
  closeTab: (tabId: number) => ipcRenderer.send('CLOSE_TAB', tabId),
  switchTab: (tabId: number) => ipcRenderer.send('SWITCH_TAB', tabId),
  // Legacy channels if needed
  openExtension: (extensionName: string) => ipcRenderer.send('open-extension', extensionName),
  closeExtension: (extensionName: string, tabId: number) => ipcRenderer.send('close-extension', extensionName, tabId)
});
