import { useState, useCallback } from 'react';

// Export the Tab interface so it can be shared across your components.
export interface Tab {
  id: number;
  title: string;
}

/**
 * Calculates a new tab, calls the Electron API to add the tab,
 * and then switches to the new tab.
 *
 * @param tabs - The current array of tabs.
 * @param tabContent - A string indicating the type of content to load (e.g., 'codeeditor', plugin name, etc.).
 * @returns A Promise that resolves with the new tab and updated tabs array.
 */
export async function addTabUtil(
  tabs: Tab[],
  tabContent: string
): Promise<{ newTab: Tab; newTabs: Tab[]; newActiveTabId: number }> {
  const newId = tabs.length ? Math.max(...tabs.map((tab) => tab.id)) + 1 : 0;
  const newTab: Tab = { id: newId, title: `Tab ${newId}` };
  const newTabs = [...tabs, newTab];
  await window.electron.addTab(tabContent);
  await window.electron.switchTab(newId);
  return { newTab, newTabs, newActiveTabId: newId };
}

/**
 * Closes the tab with the specified id.
 *
 * @param tabs - The current array of tabs.
 * @param activeTab - The currently active tab id.
 * @param id - The id of the tab to close.
 * @returns A Promise that resolves with the updated tabs array and new active tab id.
 */
export async function closeTabUtil(
  tabs: Tab[],
  activeTab: number,
  id: number
): Promise<{ newTabs: Tab[]; newActiveTab: number }> {
  if (id === 0 || tabs.length === 1) {
    return { newTabs: tabs, newActiveTab: activeTab };
  }
  const newTabs = tabs.filter((tab) => tab.id !== id);
  let newActiveTab = activeTab;
  if (activeTab === id) {
    newActiveTab = newTabs.length > 0 ? newTabs[0].id : 0;
    await window.electron.switchTab(newActiveTab);
  }
  await window.electron.closeTab(id);
  return { newTabs, newActiveTab };
}

/**
 * Calls Electron to switch to the specified tab id.
 *
 * @param id - The id of the tab to switch to.
 */
export async function handleTabClickUtil(id: number): Promise<void> {
  await window.electron.switchTab(id);
}

/**
 * Reorders the tabs by moving the dragged tab to the drop location.
 *
 * @param tabs - The current array of tabs.
 * @param draggedTabId - The id of the dragged tab.
 * @param dropTabId - The id of the tab where the dragged tab was dropped.
 * @returns The reordered array of tabs.
 */
export function reorderTabsUtil(
  tabs: Tab[],
  draggedTabId: number,
  dropTabId: number
): Tab[] {
  const draggedIndex = tabs.findIndex((tab) => tab.id === draggedTabId);
  const dropIndex = tabs.findIndex((tab) => tab.id === dropTabId);
  if (draggedIndex < 0 || dropIndex < 0) return tabs;
  const updatedTabs = [...tabs];
  const [removed] = updatedTabs.splice(draggedIndex, 1);
  updatedTabs.splice(dropIndex, 0, removed);
  return updatedTabs;
}

/**
 * Custom hook to manage tabs state.
 *
 * @param initialTabs - Optionally, provide an initial set of tabs.
 * @returns An object containing the tabs state, activeTab state, and functions to manipulate them.
 */
export function useTabs(initialTabs: Tab[] = [{ id: 0, title: 'Home' }]) {
  const [tabs, setTabs] = useState<Tab[]>(initialTabs);
  const [activeTab, setActiveTab] = useState<number>(initialTabs[0]?.id ?? 0);

  const addTab = useCallback(
    async (tabContent: string) => {
      const result = await addTabUtil(tabs, tabContent);
      setTabs(result.newTabs);
      setActiveTab(result.newActiveTabId);
    },
    [tabs]
  );

  const closeTab = useCallback(
    async (id: number) => {
      const result = await closeTabUtil(tabs, activeTab, id);
      setTabs(result.newTabs);
      setActiveTab(result.newActiveTab);
    },
    [tabs, activeTab]
  );

  const switchTab = useCallback(async (id: number) => {
    setActiveTab(id);
    await handleTabClickUtil(id);
  }, []);

  const reorderTabs = useCallback(
    (draggedTabId: number, dropTabId: number) => {
      const updatedTabs = reorderTabsUtil(tabs, draggedTabId, dropTabId);
      setTabs(updatedTabs);
    },
    [tabs]
  );

  return {
    tabs,
    activeTab,
    setTabs,
    setActiveTab,
    addTab,
    closeTab,
    switchTab,
    reorderTabs,
  };
}
