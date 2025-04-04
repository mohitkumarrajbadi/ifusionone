import React, { useState, useEffect, useCallback } from 'react';
import {
    MdDelete,
    MdOpenInBrowser,
    MdDownload,
    MdStar,
    MdVerified,
    MdErrorOutline, // Icon for errors
    MdLink, // Generic link icon
} from 'react-icons/md'; // General Material Design Icons
import { FaGithub, FaNpm } from 'react-icons/fa'; // Specific icons for GitHub/NPM
import './Favourites.css'; // Ensure this CSS file is updated
import { useTabs } from '../utils/TabsContext'; // Your existing Tabs context
// Use the detailed Plugin interface provided
export interface Plugin {
    plugin_id?: string; // Use string ID as per the interface
    plugin_name: string;
    plugin_description?: string;
    github_url?: string;
    npm_package_url?: string;
    plugin_logo_path?: string; // Path or URL to the logo
    plugin_version?: string;
    tags?: string; // Assuming comma-separated or space-separated string
    created_by?: string;
    verified_by_admin?: boolean;
    downloads?: number;
    rating?: number; // Assuming a scale (e.g., 0-5)
    installed_at?: string; // Date string (consider formatting)
}

// --- Electron API Definitions (for type safety) ---
// It's good practice to define the expected Electron API shape
declare global {
    interface Window {
        electron: {
            getAllPlugins: () => Promise<Plugin[]>;
            removePluginFromFavourites: (pluginId: string) => Promise<void>; // Assuming it returns void on success
            // Add other Electron APIs you might expose here
        };
    }
}
// --- End Electron API Definitions ---


const Favourites: React.FC = () => {
    const [pluginList, setPluginList] = useState<Plugin[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state
    const [error, setError] = useState<string | null>(null); // Error state
    const { addTab } = useTabs();

    // Function to fetch favourite plugins
    const fetchFavouritePlugins = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Ensure the electron API is available
            if (!window.electron || typeof window.electron.getAllPlugins !== 'function') {
                throw new Error("Electron API (getAllPlugins) not found on window object.");
            }
            const plugins: Plugin[] = await window.electron.getAllPlugins();
            console.log("Favourite Plugins:", plugins);
            setPluginList(plugins);
        } catch (err) {
            console.error("Error fetching favourite plugins:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while fetching favourites.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch plugins on component mount
    useEffect(() => {
        fetchFavouritePlugins();
    }, [fetchFavouritePlugins]);

    // Handle removing a plugin from favourites
    const handleRemove = useCallback(async (pluginId: string | undefined) => {
        if (!pluginId) {
            console.error("Cannot remove plugin: ID is missing.");
            // Optionally: show a user-facing error message
            return;
        }

        // Optional: Ask for confirmation
        // if (!window.confirm("Are you sure you want to remove this plugin from favourites?")) {
        //   return;
        // }

        try {
             // Ensure the electron API is available
            if (!window.electron || typeof window.electron.removePluginFromFavourites !== 'function') {
                throw new Error("Electron API (removePluginFromFavourites) not found on window object.");
            }
            console.log(`Attempting to remove plugin with ID: ${pluginId}`);
            await window.electron.removePluginFromFavourites(pluginId);

            // Update the UI by removing the plugin from the local state
            setPluginList((prevList) =>
                prevList.filter((plugin) => plugin.plugin_id !== pluginId)
            );
            console.log(`Successfully removed plugin with ID: ${pluginId}`);
            // Optionally: show a success notification
        } catch (err) {
            console.error(`Error removing plugin with ID ${pluginId}:`, err);
            // Optionally: show a user-facing error message
            alert(`Failed to remove plugin: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }, []); // No dependencies needed if it only uses `setPluginList`

    // Handle opening a plugin (likely in a new tab within your app)
    const handleOpenPlugin = useCallback((pluginName: string, pluginId?: string) => {
        // You might want to pass more info than just the name,
        // e.g., the ID or the full plugin object, depending on what `addTab` needs.
        console.log(`Opening plugin: ${pluginName} (ID: ${pluginId})`);
        addTab(pluginName, { pluginId }); // Example: passing ID as extra data
    }, [addTab]);

    // Helper to format date strings (optional)
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString(undefined, { // Use user's locale
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) {
            return dateString; // Return original if parsing fails
        }
    }

    // Helper to render tags
    const renderTags = (tagsString: string | undefined) => {
        if (!tagsString) return null;
        const tags = tagsString.split(/[, ]+/).filter(Boolean); // Split by comma or space, remove empty
        if (tags.length === 0) return null;
        return (
            <div className="plugin-tags">
                {tags.map((tag, index) => (
                    <span key={index} className="plugin-tag">{tag}</span>
                ))}
            </div>
        );
    };

    // --- Render Logic ---

    if (isLoading) {
        return <div className="favourites-container"><p>Loading favourites...</p></div>;
    }

    if (error) {
        return (
            <div className="favourites-container error-message">
                <MdErrorOutline size={24} />
                <p>Error loading favourites: {error}</p>
                <button onClick={fetchFavouritePlugins}>Try Again</button> {/* Add a retry button */}
            </div>
        );
    }

    return (
        <div className="favourites-container">
            <h2>Favourites</h2>
            <div className="plugin-list">
                {pluginList.length > 0 ? (
                    pluginList.map((plugin) => (
                        <div className="plugin-card" key={plugin.plugin_id || plugin.plugin_name}> {/* Use plugin_id if available */}
                            <div className="plugin-header">
                                {/* <img
                                    src={`../../../plugins/${plugin.plugin_name}/assets/logo.png`} // Provide a default logo path
                                    alt={`${plugin.plugin_name} logo`}
                                    className="plugin-logo"
                                    onError={(e) => { (e.target as HTMLImageElement).src = `../../../plugins/${plugin.plugin_name}/assets/logo.png`; }} // Fallback on error
                                /> */}
                                <div className="plugin-title-area">
                                    <h3>{plugin.plugin_name}</h3>
                                    {plugin.plugin_version && (
                                        <span className="plugin-version">v{plugin.plugin_version}</span>
                                    )}
                                     {/* {plugin.verified_by_admin && (
                                        <span className="plugin-verified" title="Verified by Admin">
                                            <MdVerified /> Verified
                                        </span>
                                    )} */}
                                </div>
                            </div>

                            <div className="plugin-body">
                                {plugin.plugin_description && (
                                    <p className="plugin-description">{plugin.plugin_description}</p>
                                )}
                                {plugin.created_by && (
                                     <p className="plugin-author">Author: {plugin.created_by}</p>
                                )}
                                {renderTags(plugin.tags)}
                            </div>

                            <div className="plugin-stats">
                                {plugin.downloads !== undefined && (
                                    <span title="Downloads">
                                        <MdDownload /> {plugin.downloads.toLocaleString()}
                                    </span>
                                )}
                                {plugin.rating !== undefined && (
                                     <span title="Rating">
                                        <MdStar /> {plugin.rating.toFixed(1)}/5
                                    </span>
                                )}
                                {plugin.installed_at && (
                                     <span className="installed-date" title={`Installed on ${formatDate(plugin.installed_at)}`}>
                                         Installed: {formatDate(plugin.installed_at)}
                                     </span>
                                )}
                            </div>

                             <div className="plugin-links">
                                {plugin.github_url && (
                                    <a href={plugin.github_url} target="_blank" rel="noopener noreferrer" title="GitHub Repository">
                                        <FaGithub /> GitHub
                                    </a>
                                )}
                                 {plugin.npm_package_url && (
                                    <a href={plugin.npm_package_url} target="_blank" rel="noopener noreferrer" title="NPM Package">
                                        <FaNpm /> NPM
                                    </a>
                                )}
                                {/* You could add a generic link if neither GitHub/NPM is present but another URL is */}
                             </div>

                            <div className="plugin-footer">
                                <button
                                    onClick={() => handleRemove(plugin.plugin_id)}
                                    className="delete-button"
                                    title="Remove from Favourites"
                                    disabled={!plugin.plugin_id} // Disable if ID is missing
                                >
                                    <MdDelete /> Remove
                                </button>
                                <button
                                    onClick={() => handleOpenPlugin(plugin.plugin_name, plugin.plugin_id)}
                                    className="open-button"
                                    title="Open Plugin"
                                >
                                    Open <MdOpenInBrowser />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-plugins">You haven't added any favourite plugins yet.</p>
                )}
            </div>
        </div>
    );
};

export default Favourites;

// The detailed Plugin interface is already defined above within the component file.
// You can keep the export at the end if you need to use this interface elsewhere,
// but it's not strictly necessary if only used within Favourites.tsx.
// export { Plugin }; // Optional export if needed elsewhere