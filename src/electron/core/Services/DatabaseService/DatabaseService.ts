import { v4 as uuidv4 } from 'uuid';
import db, { runQuery, getQuery, prepareInsert } from './DatabaseManager.js';
import { Plugin } from '../ServiceUtils/utils.js'

export function createPluginTable(): void {
  const sql = `
    CREATE TABLE IF NOT EXISTS plugin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plugin_id TEXT UNIQUE NOT NULL,
      plugin_name TEXT NOT NULL,
      plugin_description TEXT,
      github_url TEXT,
      npm_package_url TEXT,
      plugin_logo_path TEXT,
      plugin_version TEXT,
      tags TEXT,
      created_by TEXT,
      verified_by_admin BOOLEAN DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.run(sql, (err) => {
    if (err) console.error('❌ Failed to create table:', err.message);
    else console.log('✅ Plugin table ensured.');
  });
}

export async function insertPlugin(plugin: Omit<Partial<Plugin>, 'plugin_id'> & { plugin_name: string }): Promise<number> {
  const pluginWithDefaults: Plugin = {
    plugin_id: uuidv4(),
    plugin_name: plugin.plugin_name,
    plugin_description: plugin.plugin_description ?? '',
    github_url: plugin.github_url ?? '',
    npm_package_url: plugin.npm_package_url ?? '',
    plugin_logo_path: plugin.plugin_logo_path ?? '',
    plugin_version: plugin.plugin_version ?? '1.0.0',
    tags: plugin.tags ?? '',
    created_by: plugin.created_by ?? '',
    verified_by_admin: plugin.verified_by_admin ?? false,
    downloads: plugin.downloads ?? 0,
    rating: plugin.rating ?? 0,
    installed_at: plugin.installed_at ?? new Date().toISOString(),
  };

  const { sql, values } = prepareInsert('plugin', pluginWithDefaults);
  const result = await runQuery(sql, values);
  return result.lastID;
}

export function getAllPlugins(): Promise<Plugin[]> {
  return getQuery<Plugin>('SELECT * FROM plugin ORDER BY installed_at DESC');
}

export function getPluginByIdQuery(id: number): Promise<Plugin | null> {
  return getQuery<Plugin>('SELECT * FROM plugin WHERE id = ?', [id])
    .then(rows => rows[0] ?? null);
}

export function getPluginByUUID(plugin_id: string): Promise<Plugin | null> {
  return getQuery<Plugin>('SELECT * FROM plugin WHERE plugin_id = ?', [plugin_id])
    .then(rows => rows[0] ?? null);
}

export function deletePluginQuery(id: number): Promise<void> {
  return runQuery('DELETE FROM plugin WHERE id = ?', [id]).then(() => { });
}

export function runSqlCommand<T = unknown>(sql: string, params: unknown[] = []): Promise<T[] | { lastID: number; changes: number }> {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) {
    return getQuery<T>(sql, params);
  } else {
    return runQuery(sql, params);
  }
}
