import { app, BrowserWindow, ipcMain } from 'electron';
import { getPreloadPath, getUIPath, getAIModelPath } from './pathResolver.js';
import { isDev } from './util.js';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    transparent: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,  // Disables node integration for security
    },
    frame: false, // Removes default Electron window frame
    // width: 800,
    // height: 600,
  });

  if (!isDev()) {
    mainWindow.loadFile(getUIPath());
  } else {
    mainWindow.loadURL('http://localhost:5123');
  }

  // Minimize Window
  ipcMain.on('minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  // Maximize/Restore Window
  ipcMain.on('maximize', () => {
    console.log('maximize');
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.restore();
      } else {
        mainWindow.maximize();
      }
    }
  });

  // Close Window
  ipcMain.on('close', () => {
    console.log('close');
    if (mainWindow) {
      mainWindow.close();
    }
  });

  mainWindow.on('closed', () => {
    console.log('closed')
    mainWindow = null;
  });



  ipcMain.on('testAI', async () => {
    const __dirname = getAIModelPath();
    console.log("__dirname : " + __dirname);
    const llama = await getLlama();
    const model = await llama.loadModel({
      modelPath: path.join(__dirname, "Hermes-3-Llama-3.2-3B-abliterated.i1-IQ1_S.gguf")
    });

    console.log("model : " + model)

    const context = await model.createContext();
    const session = new LlamaChatSession({
      contextSequence: context.getSequence()
    });

    const q1 = "Hi there, how are you?";
    console.log("User: " + q1);

    const a1 = await session.prompt(q1);
    console.log("AI: " + a1);


    const q2 = "Give me a python code for Binary Search";
    console.log("User: " + q2);

    const a2 = await session.prompt(q2);
    console.log("AI: " + a2);

  });



});
