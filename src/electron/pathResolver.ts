import path from 'path';
import { app } from 'electron';
import { isDev } from './util.js';

export function getPreloadPath() {
  return path.join(
    app.getAppPath(),
    isDev() ? '.' : '..',
    '/dist-electron/preload.cjs'
  );
}

export function getUIPath() {
  return path.join(app.getAppPath(), '/dist-react/index.html');
}

export function getAssetPath() {
  return path.join(app.getAppPath(), isDev() ? '.' : '..', '/src/assets');
}

export function getAIModelPath(){
  return path.join(app.getAppPath(),isDev() ? '.' : '..','/src/aimodels')
}

export function getCompilerFilePath(){
  return path.join(app.getAppPath(),isDev() ? '.' : '..','/src/electron/compiler/compiler_files')
}

export function getExtensionFilePath(extensionName:string) {
  return path.join(app.getAppPath(), isDev() ? '.' : '..', `src/plugins/${extensionName}/index.html`);
}

export function getAiBackEndExecutableFile(){
  return path.join(app.getAppPath(), isDev() ? '.' : '..', 'src/python-ai-hub/dist/ai-backend');
}
