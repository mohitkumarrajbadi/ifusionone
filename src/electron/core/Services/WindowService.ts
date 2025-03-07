// WindowService.ts
import { BrowserWindow } from 'electron';
import EventBus from '../EventBus/EventBus.js';

class WindowService {
  private mainWindow: BrowserWindow | null = null;

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  public minimize(): void {
    if (!this.mainWindow) {
      console.warn('Main window not set.');
      return;
    }
    this.mainWindow.minimize();
    // Emit an event after minimizing the window
    EventBus.emit('window-minimized', { timestamp: Date.now() });
  }

  public toggleFullscreen(): void {
    if (this.mainWindow) {
      const newFullScreen = !this.mainWindow.isFullScreen();
      this.mainWindow.setFullScreen(newFullScreen);
      EventBus.emit('window-fullscreen-toggled', { fullscreen: newFullScreen });
    }
  }

  public close(): void {
    this.mainWindow?.close();
    EventBus.emit('window-closed', { timestamp: Date.now() });
  }
}

export default new WindowService();
