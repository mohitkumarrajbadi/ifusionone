import { BrowserWindow, app } from 'electron';
import EventBus from '../EventBus/EventBus.js';

class WindowService {
  private mainWindow: BrowserWindow | null = null;

  /**
   * ✅ Sets the main application window
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    console.log('🪟 Main window set successfully.');
  }

  /**
   * ✅ Minimizes the window
   */
  public minimize(): void {
    if (!this.mainWindow) {
      console.warn('⚠️ Main window not set.');
      return;
    }

    if (this.mainWindow.isMinimized()) {
      console.log('🔹 Window is already minimized.');
      return;
    }

    this.mainWindow.minimize();
    console.log('🔹 Window minimized.');
    EventBus.emit('window-minimized', { timestamp: Date.now() });
  }

  /**
   * ✅ Toggles true fullscreen with hidden title bar on macOS
   */
  public toggleFullscreen(): void {
    if (!this.mainWindow) {
      console.warn('⚠️ Main window not set.');
      return;
    }

    const isMac = process.platform === 'darwin';
    const isFullScreen = this.mainWindow.isFullScreen();
    const newFullScreen = !isFullScreen;

    if (isMac) {
      console.log(`🍎 Toggling fullscreen with hidden title bar on macOS: ${newFullScreen}`);

      this.mainWindow.setFullScreen(newFullScreen);
      this.mainWindow.setVisibleOnAllWorkspaces(true);

      // ✅ Hide header/title bar completely during fullscreen
      this.mainWindow.setWindowButtonVisibility(!newFullScreen); 
      this.mainWindow.setMenuBarVisibility(false);  // Hide menu bar on macOS
    } else {
      console.log(`🪟 Toggling fullscreen on Windows/Linux: ${newFullScreen}`);
      this.mainWindow.setFullScreen(newFullScreen);
    }

    EventBus.emit('window-fullscreen-toggled', { fullscreen: newFullScreen });
  }

  /**
   * ✅ Closes the window with event emission
   */
  public close(): void {
    if (!this.mainWindow) {
      console.warn('⚠️ Main window not set.');
      return;
    }

    console.log('🔹 Closing window...');
    this.mainWindow.close();
    EventBus.emit('window-closed', { timestamp: Date.now() });
  }

  /**
   * ✅ Quit the app gracefully
   */
  public quit(): void {
    console.log('🔹 Quitting application...');
    app.quit();
  }

  /**
   * ✅ Restores window from minimized state
   */
  public restore(): void {
    if (!this.mainWindow) {
      console.warn('⚠️ Main window not set.');
      return;
    }

    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
      console.log('🔹 Window restored.');
    } else {
      console.log('🔹 Window is not minimized.');
    }
  }
}

export default new WindowService();
