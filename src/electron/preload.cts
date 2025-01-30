import { contextBridge, ipcRenderer } from 'electron';
import {Ollama} from 'ollama';

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
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
