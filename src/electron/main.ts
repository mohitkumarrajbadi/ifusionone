import { app, BrowserWindow, ipcMain } from 'electron';
import { getPreloadPath, getUIPath, getAIModelPath, getCompilerFilePath } from './pathResolver.js';
import { isDev } from './util.js';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import codeCompiler from './compiler/codeCompiler.js';

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    transparent: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false, // Disables node integration for security
    },
    frame: false,
  });

  if (!isDev()) {
    mainWindow.loadFile(getUIPath());
  } else {
    mainWindow.loadURL('http://localhost:5123');
  }

  // Window Controls
  ipcMain.on('minimize', () => mainWindow?.minimize());
  ipcMain.on('maximize', () => {
    if (mainWindow) {
      mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize();
    }
  });
  ipcMain.on('close', () => mainWindow?.close());
  mainWindow.on('closed', () => (mainWindow = null));

  // AI Test Function
  ipcMain.on('testAI', async () => {
    try {
      const aiModelPath = getAIModelPath();
      console.log("AI Model Path:", aiModelPath);

      const llama = await getLlama();
      const model = await llama.loadModel({
        modelPath: path.join(aiModelPath, "llama-3.2-3b-instruct.Q2_K.gguf"),
      });

      const context = await model.createContext();
      const session = new LlamaChatSession({ contextSequence: context.getSequence() });

      console.log("AI Response:", await session.prompt("Hi there, how are you?"));
      console.log("AI Code Suggestion:", await session.prompt("Give me a python code for Binary Search"));
    } catch (error: unknown) {
      console.error("AI Error:", error instanceof Error ? error.message : "Unknown error");
    }
  });


  ipcMain.on('compile-code', async (event, { code, language }) => {
      try {
    const response = await codeCompiler(event, { code, language });
    console.log('Compilation Result:', response);
  } catch (error) {
    console.error('Error during compilation:', error);
  }
  });





});
