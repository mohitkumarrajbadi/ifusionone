import path from 'path';
import sqlite3 from 'sqlite3';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export interface Plugin {
  plugin_id?: string;
  plugin_name: string;
  plugin_description?: string;
  github_url?: string;
  npm_package_url?: string;
  plugin_logo_path?: string;
  plugin_version?: string;
  tags?: string;
  created_by?: string;
  verified_by_admin?: boolean;
  downloads?: number;
  rating?: number;
  installed_at?: string;
}

// Database path
const dbPath = path.join(app.getPath('userData'), 'mydb.sqlite');

// Open SQLite DB
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Error opening database:', err.message);
  else console.log('✅ Database ready at:', dbPath);
});

// Utility to run insert/update/delete
function runQuery(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Utility to run select queries
function getQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// Create the plugin table
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

// Utility to dynamically prepare insert SQL
function prepareInsert<T>(table: string, obj: T) {
  const keys = Object.keys(obj);
  const values = Object.values(obj);
  const placeholders = keys.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  return { sql, values };
}

// Insert a plugin dynamically using Plugin interface
export async function insertPlugin(plugin: Plugin): Promise<number> {
  const pluginWithDefaults: Plugin = {
    plugin_id: plugin.plugin_id || uuidv4(),
    plugin_name: plugin.plugin_name,
    plugin_description: plugin.plugin_description || '',
    github_url: plugin.github_url || '',
    npm_package_url: plugin.npm_package_url || '',
    plugin_logo_path: plugin.plugin_logo_path || '',
    plugin_version: plugin.plugin_version || '1.0.0',
    tags: plugin.tags || '',
    created_by: plugin.created_by || '',
    verified_by_admin: plugin.verified_by_admin ?? false,
    downloads: plugin.downloads ?? 0,
    rating: plugin.rating ?? 0,
    installed_at: plugin.installed_at || new Date().toISOString(),
  };

  const { sql, values } = prepareInsert('plugin', pluginWithDefaults);
  const result = await runQuery(sql, values);
  return result.lastID;
}

// Get all plugins
export function getAllPlugins(): Promise<Plugin[]> {
  return getQuery<Plugin>('SELECT * FROM plugin ORDER BY installed_at DESC');
}

// Get plugin by auto-increment ID
export function getPluginByIdQuery(id: number): Promise<Plugin | null> {
  return getQuery<Plugin>('SELECT * FROM plugin WHERE id = ?', [id]).then(rows => rows[0] || null);
}

// Get plugin by plugin_id (UUID)
export function getPluginByUUID(plugin_id: string): Promise<Plugin | null> {
  return getQuery<Plugin>('SELECT * FROM plugin WHERE plugin_id = ?', [plugin_id]).then(rows => rows[0] || null);
}

// Delete plugin by auto-increment ID
export function deletePluginQuery(id: number): Promise<void> {
  return runQuery('DELETE FROM plugin WHERE id = ?', [id]).then(() => { });
}

// Run any SQL (SELECT or non-SELECT)
export function runSqlCommand(sql: string, params: any[] = []): Promise<any> {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) {
    return getQuery(sql, params);
  } else {
    return runQuery(sql, params);
  }
}
