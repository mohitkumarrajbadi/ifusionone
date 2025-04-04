import { BrowserWindow, app } from 'electron';
import EventBus from '../EventBus/EventBus.js';

class WindowService {
  private mainWindow: BrowserWindow | null = null;

  /**
   * ✅ Sets the main application window with hidden title bar
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;

    // 💡 Ensure the title bar is always hidden
    this.mainWindow.setMenuBarVisibility(false);
    this.mainWindow.setWindowButtonVisibility(false);  // macOS-specific
    this.mainWindow.setResizable(true);  // Ensure resizable but no title bar

    console.log('🪟 Main window set successfully with hidden title bar.');
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
   * ✅ Toggles fullscreen with hidden title bar
   */
  public toggleFullscreen(): void {
    if (!this.mainWindow) {
      console.warn('⚠️ Main window not set.');
      return;
    }

    const isFullScreen = this.mainWindow.isFullScreen();
    const newFullScreen = !isFullScreen;

    console.log(`🔹 Toggling fullscreen: ${newFullScreen}`);
    this.mainWindow.setFullScreen(newFullScreen);

    // 💡 Ensure title bar stays hidden on all platforms
    this.mainWindow.setMenuBarVisibility(false);
    this.mainWindow.setWindowButtonVisibility(false);  // macOS-specific

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
