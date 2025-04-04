import { BrowserWindow, WebContentsView, Rectangle } from 'electron';
import { getPreloadPath } from '../../pathResolver.js'
import EventBus from '../../core/EventBus/EventBus.js';

const HEADER_HEIGHT = 500;
let tabCounter = 0;
export const webContentViews: { [id: number]: WebContentsView } = {};
export let activeTabId: number = 1;

/**
 * Extend the BrowserWindow type to include our custom content view methods.
 */
interface ContentView {
  addChildView(view: WebContentsView): void;
  removeChildView(view: WebContentsView): void;
}

interface CustomBrowserWindow extends BrowserWindow {
  getContentView(): ContentView;
}

/**
 * Creates a new WebContentsView for the given extension file and returns its unique tab id.
 * @param extensionPath The file path to load in the new tab.
 * @param mainWindow The main BrowserWindow (CustomBrowserWindow).
 * @returns The unique tab id.
 */
export function createWebContentView(extensionPath: string, mainWindow: BrowserWindow): number {
  const customWindow = mainWindow as CustomBrowserWindow;
  tabCounter++;
  const tabId = tabCounter;

  const webView = new WebContentsView({
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // Load the extension file into the webView.
  webView.webContents.loadFile(extensionPath)
    .catch((err) => console.error("Failed loading the web content view:", err));

  // Get the content bounds from the main window.
  const { width, height } = mainWindow.getContentBounds();
  const bounds: Rectangle = (tabId === activeTabId)
    ? { x: 0, y: HEADER_HEIGHT, width, height: height - HEADER_HEIGHT - 100 }
    : { x: 0, y: HEADER_HEIGHT, width: 0, height: 0 };

  webView.setBounds(bounds);
  webContentViews[tabId] = webView;

  // Add the new view to the main window's content view container.
  try {
    customWindow.getContentView().addChildView(webView);
  } catch (err) {
    console.error("Failed to add child view:", err);
  }

  // Emit event after the new tab is created.
  EventBus.emit('tab-created', { tabId, extensionPath });
  return tabId;
}

/**
 * Closes the WebContentsView associated with the given tab id.
 * @param tabId The id of the tab to close.
 * @param mainWindow The main BrowserWindow.
 */
export function closeWebContentView(tabId: number, mainWindow: BrowserWindow): void {
  const customWindow = mainWindow as CustomBrowserWindow;
  const webView = webContentViews[tabId];
  if (webView) {
    try {
      customWindow.getContentView().removeChildView(webView);
    } catch (err) {
      console.warn("Error removing child view:", err);
    }
    // Close the webContents.
    webView.webContents.close();
    delete webContentViews[tabId];
    // Emit event after closing the tab.
    EventBus.emit('tab-closed', { tabId });
  } else {
    console.log(`No tab with id ${tabId} found.`);
  }
}

/**
 * Switches to the specified tab by removing all child views from the content container
 * and re-adding only the active tab's view with proper bounds.
 * @param tabId The tab id to switch to.
 * @param mainWindow The main BrowserWindow.
 */
export function switchToTab(tabId: number, mainWindow: BrowserWindow): void {
  activeTabId = tabId;
  const customWindow = mainWindow as CustomBrowserWindow;
  const { width, height } = mainWindow.getContentBounds();
  const contentView = customWindow.getContentView();

  // Remove all child views from the content view.
  Object.values(webContentViews).forEach((view: WebContentsView) => {
    try {
      contentView.removeChildView(view);
    } catch (err) {
      console.warn('Error removing child view:', err);
    }
  });

  // Re-add only the active view with the correct bounds.
  const activeView = webContentViews[activeTabId];
  if (activeView) {
    contentView.addChildView(activeView);
    const activeBounds: Rectangle = { x: 0, y: HEADER_HEIGHT, width, height: height - HEADER_HEIGHT };
    activeView.setBounds(activeBounds);
    activeView.webContents.focus();
    // Emit event after switching tabs.
    EventBus.emit('tab-switched', { tabId });
  } else {
    console.warn(`No view found for active tab id: ${activeTabId}`);
  }
}
