import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('versions', {
  node: (): string => process.versions.node,
  chrome: (): string => process.versions.chrome,
  electron: (): string => process.versions.electron,
});

contextBridge.exposeInMainWorld('electron', {
  sendFrameAction: (action: string): void => ipcRenderer.send(action.toLowerCase()),
  testAI: (query: string): void => ipcRenderer.send('testAI', query),
  compileCode: (code: string, language: string): void =>
    ipcRenderer.send('compile-code', { code, language }),
  // New tab actions.
  addTab: (extensionName: string): void => ipcRenderer.send('ADD_TAB', extensionName),
  closeTab: (tabId: number): void => ipcRenderer.send('CLOSE_TAB', tabId),
  switchTab: (tabId: number): void => ipcRenderer.send('SWITCH_TAB', tabId),
  // Generic command API.
  invokeCommand: (command: string, args: any): Promise<any> =>
    ipcRenderer.invoke('command', command, args),
  // Database Actions.
  insertPluginTable: (): void => ipcRenderer.send('insert-plugin-table'),
  getAllPlugins: (): Promise<any> => ipcRenderer.invoke('get-plugins'),
  initializeAI: (): Promise<any> => ipcRenderer.invoke('initialize-ai'),
  chatWithAI: (prompt: string): Promise<any> =>
    ipcRenderer.invoke('chat-with-ai', prompt),
  searchDuckDuckGo: (query: string): Promise<any> =>
    ipcRenderer.invoke('search-duck-duck-go', query),
  testingLangchain: (query: string): Promise<any> =>
    ipcRenderer.invoke('testing-langchain', query),
});
