// TabsContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Tab = {
  id: number;
  title: string;
  // You can add other properties as needed.
};

type TabsContextType = {
  tabs: Tab[];
  activeTab: number | null;
  addTab: (title: string) => void;
  closeTab: (id: number) => void;
  switchTab: (id: number) => void;
  reorderTabs: (sourceId: number, targetId: number) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with the default Home tab (id: 0)
  const [tabs, setTabs] = useState<Tab[]>([{ id: 0, title: 'Home' }]);
  const [activeTab, setActiveTab] = useState<number | null>(0);
  // Next new tab id starts at 1 (since Home uses id 0)
  const [nextId, setNextId] = useState<number>(1);

  const addTab = (title: string) => {
    const newTab: Tab = { id: nextId, title };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(nextId);
    setNextId((prev) => prev + 1);
    window.electron.addTab(title);
  };

  const closeTab = (id: number) => {
    // Prevent closing the Home tab
    if (id === 0) return;
    setTabs((prev) => prev.filter((tab) => tab.id !== id));
    // If the closed tab was active, choose another one (for example, default to Home)
    if (activeTab === id) {
      // If there are any tabs left, default to the Home tab (id 0)
      setActiveTab(0);
    }
  };

  const switchTab = (id: number) => {
    setActiveTab(id);
    window.electron.switchTab(id);
  };

  const reorderTabs = (sourceId: number, targetId: number) => {
    setTabs((prevTabs) => {
      const sourceIndex = prevTabs.findIndex((tab) => tab.id === sourceId);
      const targetIndex = prevTabs.findIndex((tab) => tab.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return prevTabs;
      const updatedTabs = [...prevTabs];
      const [removed] = updatedTabs.splice(sourceIndex, 1);
      updatedTabs.splice(targetIndex, 0, removed);
      return updatedTabs;
    });
  };

  return (
    <TabsContext.Provider
      value={{ tabs, activeTab, addTab, closeTab, switchTab, reorderTabs }}
    >
      {children}
    </TabsContext.Provider>
  );
};

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("useTabs must be used within a TabsProvider");
  }
  return context;
};
