import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld('electron', {
  sendFrameAction: (action: string) => ipcRenderer.send(action.toLowerCase()),
  testAI: (query: string) => ipcRenderer.send('testAI',query),
  compileCode: (code : string, language:string) => ipcRenderer.send('compile-code',{code,language})
});
