import { app, BrowserWindow, ipcMain } from 'electron';
import { getPreloadPath, getUIPath, getAIModelPath } from './pathResolver.js';
import { isDev } from './util.js';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';
import path from 'path';


let mainWindow: BrowserWindow | null = null;

// Create Electron Main Window
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    transparent: true,
    frame: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = isDev() ? 'http://localhost:5123' : getUIPath();
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => (mainWindow = null));
};

// Register IPC Handlers
const registerIPCHandlers = () => {
  ipcMain.on('minimize', () => mainWindow?.minimize());
  ipcMain.on('maximize', () =>
    mainWindow?.isMaximized() ? mainWindow.restore() : mainWindow?.maximize()
  );
  ipcMain.on('close', () => mainWindow?.close());
};

// AI Model Interaction
const runLlamaAI = async (query: string) => {
  try {
    const modelPath = path.join(getAIModelPath(), "Llama-3.2-3B-Instruct-Q2_K.gguf");
    console.log(`Loading model from: ${modelPath}`);

    const llama = await getLlama();
    const model = await llama.loadModel({ modelPath });
    const context = await model.createContext();
    const session = new LlamaChatSession({ contextSequence: context.getSequence() });

    console.log(`User Query: ${query}`);
    const response = await session.prompt(query);
    console.log(`AI Response: ${response}`);

  } catch (error) {
    console.error("AI Model Error:", error);
  }
};

app.whenReady().then(() => {
  createMainWindow();
  registerIPCHandlers();
  ipcMain.on('testAI', async (event, query: string) => {
    console.log("event : " + event);
    console.log("query : " + query);
    await runLlamaAI(query);
  });
});

