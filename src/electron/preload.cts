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
  // openExtension: (extensionName: string) => ipcRenderer.send('open-extension', extensionName),
  // closeExtension: (extensionName: string, tabId: number) => ipcRenderer.send('close-extension', extensionName, tabId),
  // Database Actions
  insertPluginTable: () => ipcRenderer.send('insert-plugin-table'),
  getAllPlugins: () => ipcRenderer.invoke('get-plugins'),
  initializeAI: () => ipcRenderer.invoke("initialize-ai"),
  chatWithAI: (prompt: string) => ipcRenderer.invoke("chat-with-ai", prompt),
  searchDuckDuckGo: (query: string) => ipcRenderer.invoke("search-duck-duck-go", query),
  testingLangchain: (query: string) => ipcRenderer.invoke("testing-langchain", query),
});
