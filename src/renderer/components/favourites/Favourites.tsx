import React, { useState, useEffect } from 'react';
import { MdDelete, MdOpenInBrowser } from "react-icons/md";
import './Favourites.css';
import { useTabs } from '../utils/tabUtils';

const Favourites = () => {
  const [pluginList, setPluginList] = useState([]);
    const { tabs, activeTab, addTab, closeTab, switchTab, reorderTabs } = useTabs();
  
  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const plugins = await window.electron.getAllPlugins();
        console.log("Plugin List:", plugins);
        setPluginList(plugins);
      } catch (error) {
        console.error("Error fetching plugins:", error);
      }
    };

    fetchPlugins();
  }, []);

  const handleRemove = (pluginId: number) => {
    // TODO: Implement the removal functionality.
    console.log(`Remove plugin with ID: ${pluginId}`);
  };

  const handleOpenPlugin = (pluginName: string) => {
    // Using the Electron API to add a new tab (you can later replace 'testing' with pluginName).
    // window.electron.addTab(pluginName);
    addTab(pluginName);
  };

  return (
    <div className="favourites-container">
      <h2>Favourites</h2>
      <div className="plugin-list">
        {pluginList.length > 0 ? (
          pluginList.map((plugin, index) => (
            <div className="plugin-card" key={index}>
              <div className="plugin-header">
                <h2>{plugin.plugin_name}</h2>
              </div>
              <div className="plugin-body">
                <p>{plugin.plugin_description}</p>
              </div>
              <div className="plugin-footer">
                <button onClick={() => handleRemove(plugin.id)} className='delete-button'><MdDelete /></button>
                <button onClick={() => handleOpenPlugin(plugin.plugin_name)} className='open-button'>Open <MdOpenInBrowser /></button>
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
