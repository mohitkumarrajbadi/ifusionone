import React, { useState, useEffect, useCallback } from 'react';
import { MdDelete, MdOpenInBrowser } from "react-icons/md";
import './Favourites.css';
import { useTabs } from '../utils/TabsContext';

interface Plugin {
  id: number;
  plugin_name: string;
  plugin_description: string;
  // You can add other properties if needed.
}

const Favourites: React.FC = () => {
  const [pluginList, setPluginList] = useState<Plugin[]>([]);
  const { addTab } = useTabs();

  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const plugins: Plugin[] = await window.electron.getAllPlugins();
        console.log("Plugin List:", plugins);
        setPluginList(plugins);
      } catch (error) {
        console.error("Error fetching plugins:", error);
      }
    };

    fetchPlugins();
  }, []);

  const handleRemove = useCallback((pluginId: number) => {
    // TODO: Implement removal functionality here.
    console.log(`Remove plugin with ID: ${pluginId}`);
  }, []);

  const handleOpenPlugin = useCallback((pluginName: string) => {
    // Using the Electron API to add a new tab.
    addTab(pluginName);
  }, [addTab]);

  return (
    <div className="favourites-container">
      <h2>Favourites</h2>
      <div className="plugin-list">
        {pluginList.length > 0 ? (
          pluginList.map((plugin) => (
            <div className="plugin-card" key={plugin.id}>
              <div className="plugin-header">
                <h2>{plugin.plugin_name}</h2>
              </div>
              <div className="plugin-body">
                <p>{plugin.plugin_description}</p>
              </div>
              <div className="plugin-footer">
                <button onClick={() => handleRemove(plugin.id)} className="delete-button">
                  <MdDelete />
                </button>
                <button onClick={() => handleOpenPlugin(plugin.plugin_name)} className="open-button">
                  Open <MdOpenInBrowser />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-plugins">No plugins available</p>
        )}
      </div>
    </div>
  );
};

export default Favourites;
