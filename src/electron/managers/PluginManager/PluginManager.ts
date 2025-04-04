import {
  Plugin,
  getAllPlugins,
  insertPlugin,
  getPluginByIdQuery,
  deletePluginQuery,
} from '../DatabaseManager/DatabaseManager.js';

export function getAllPluginsList(): Promise<Plugin[]> {
  return getAllPlugins();
}

export function getPluginById(id: number): Promise<Plugin | null> {
  return getPluginByIdQuery(id);
}

export function deletePlugin(id: number): Promise<void> {
  return deletePluginQuery(id);
}

export function uploadPlugin(plugin: Plugin): Promise<void> {
  return insertPlugin(plugin).then(() => {});
}

// Placeholder — add download logic if needed
export function downloadPluginFromUrl(url: string): Promise<void> {
  console.log('🔽 Download plugin from URL:', url);
  return Promise.resolve();
}

export function downloadPluginFromGithub(githubUrl: string): Promise<void> {
  console.log('🔽 Download plugin from GitHub:', githubUrl);
  return Promise.resolve();
}
