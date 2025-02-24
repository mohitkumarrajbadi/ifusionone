import { BrowserWindow, WebContentsView } from 'electron';
import { getPreloadPath } from '../pathResolver.js';

const HEADER_HEIGHT = 40;
let tabCounter = 0;
export const webContentViews: { [id: number]: WebContentsView } = {};
export let activeTabId: number = 1;

/**
 * Creates a new WebContentsView for the given extension file and returns its tab id.
 * @param extensionPath The file path to load in the new tab.
 * @param mainWindow The main BrowserWindow.
 * @returns The unique tab id.
 */
export function createWebContentView(extensionPath: string, mainWindow: BrowserWindow): number {
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
  
  // Add view to main window’s content view.
  (mainWindow as any).getContentView()?.addChildView(webView);

  webView.webContents
    .loadFile(extensionPath)
    .catch((err) => console.log("Failed loading the web content view: " + err));

  const { width, height } = mainWindow.getContentBounds();
  // Show view if active; otherwise hide it.
  const bounds = tabId === activeTabId
    ? { x: 0, y: HEADER_HEIGHT, width, height: height - HEADER_HEIGHT }
    : { x: 0, y: HEADER_HEIGHT, width: 0, height: 0 };
  webView.setBounds(bounds);

  webContentViews[tabId] = webView;
  console.log(`Tab ${tabId} added with content from ${extensionPath}`);
  return tabId;
}

/**
 * Closes the WebContentsView associated with the given tab id.
 * @param tabId The id of the tab to close.
 * @param mainWindow The main BrowserWindow.
 */
export function closeWebContentView(tabId: number, mainWindow: BrowserWindow): void {
  const webView = webContentViews[tabId];
  if (webView) {
    (mainWindow as any).getContentView()?.removeChildView(webView);
    (webView.webContents as any).close();
    delete webContentViews[tabId];
    console.log(`Tab ${tabId} closed.`);
  } else {
    console.log(`No tab with id ${tabId} found.`);
  }
}

/**
 * Switches to the specified tab by removing all child views from the content view
 * and re-adding only the active tab's view with proper bounds.
 * @param tabId The tab id to switch to.
 * @param mainWindow The main BrowserWindow.
 */
export function switchToTab(tabId: number, mainWindow: BrowserWindow): void {
  console.debug('--- switchToTab START ---');
  console.debug('Incoming tabId:', tabId);
  console.debug('Current activeTabId (before update):', activeTabId);
  
  // Update the active tab id.
  activeTabId = tabId;
  console.debug('Updated activeTabId:', activeTabId);
  
  const { width, height } = mainWindow.getContentBounds();
  console.debug('Main window bounds:', { width, height });
  
  const contentView = (mainWindow as any).getContentView();
  console.debug('Existing tab ids:', Object.keys(webContentViews));
  
  // Remove all child views.
  Object.values(webContentViews).forEach((view: WebContentsView) => {
    try {
      contentView.removeChildView(view);
      console.debug('Removed a child view:', view);
    } catch (err) {
      console.warn('Error removing child view:', err);
    }
  });
  
  // Re-add only the active view.
  const activeView = webContentViews[activeTabId];
  if (activeView) {
    contentView.addChildView(activeView);
    const activeBounds = { x: 0, y: HEADER_HEIGHT, width, height: height - HEADER_HEIGHT };
    activeView.setBounds(activeBounds);
    activeView.webContents.focus();
    console.debug(`Tab ${activeTabId} is now active. Setting bounds:`, activeBounds);
  } else {
    console.warn(`No view found for active tab id: ${activeTabId}`);
  }
  
  console.debug('--- switchToTab END ---');
}
