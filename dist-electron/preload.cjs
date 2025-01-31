"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
});
const api = {
    sendFrameAction: (action) => electron_1.ipcRenderer.send(action.toLowerCase()),
};
electron_1.contextBridge.exposeInMainWorld('electron', api);
electron_1.contextBridge.exposeInMainWorld('testing', {
    testAI: () => electron_1.ipcRenderer.send('testAI')
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
