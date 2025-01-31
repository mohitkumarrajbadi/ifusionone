import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

const api: IpcChannels = {
  sendFrameAction: (action) => ipcRenderer.send(action.toLowerCase()),
};

contextBridge.exposeInMainWorld('electron', api);

contextBridge.exposeInMainWorld('testing', {
  testAI: () => ipcRenderer.send('testAI')
});

// contextBridge.exposeInMainWorld('ollama', {
//     ollamaTest: async (message: string) => {
//         try {
//             const response = await Ollama.chat({
//                 model: 'llama3.1',
//                 messages: [{role : 'user',content: message}]
//             });
//             console.log(response.message.content)
//         } catch (error) {
//             console.error('Error in ollamaTest:', error);
//         }
//     },
// });
