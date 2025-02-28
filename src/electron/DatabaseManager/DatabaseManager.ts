import path from 'path';
import sqlite3 from 'sqlite3';
import { app } from 'electron';

// Define the path where the database will be stored (userData is writable)
const dbPath = path.join(app.getPath('userData'), 'mydb.sqlite');

// Open (or create) the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Database stored at:', dbPath);
  }
});

/**
 * Create the plugin table if it doesn't exist.
 */
export function createPluginTable(): void {
  const sql = `
    CREATE TABLE IF NOT EXISTS plugin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plugin_name TEXT,
      plugin_description TEXT,
      github_url TEXT,
      created_by TEXT,
      plugin_logo_path TEXT,
      installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.run(sql, (err) => {
    if (err) console.error('Error creating plugin table:', err.message);
    else console.log('Plugin table created successfully!');
  });
}


export interface Plugin {
  id?: number; // optional when inserting a new record
  plugin_name: string;
  plugin_description: string;
  github_url: string;
  created_by: string;
  plugin_logo_path: string;
  installed_at?: string; // ISO timestamp string; optional if using DEFAULT CURRENT_TIMESTAMP
}


export function insertPlugin(): Promise<number> {

    const plugin = <Plugin>{};
    plugin.plugin_name = 'codeeditor'
    plugin.plugin_description = 'This is one of best Code Editor Ever'
    plugin.github_url = ''
    plugin.created_by = 'ifusion team'
    plugin.plugin_logo_path = 'assest/logo.png'


  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO plugin (plugin_name, plugin_description, github_url, created_by, plugin_logo_path, installed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.run(
      sql,
      [
        plugin.plugin_name,
        plugin.plugin_description,
        plugin.github_url,
        plugin.created_by,
        plugin.plugin_logo_path,
        plugin.installed_at || new Date().toISOString()
      ],
      function (err) {
        if (err) {
          console.error('Error inserting plugin:', err.message);
          reject(err);
        } else {
          console.log('Plugin inserted with ID:', this.lastID);
          resolve(this.lastID);
        }
      }
    );
  });
}


export function getAllPlugins(): Promise<Plugin[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM plugin', (err, rows) => {
        if (err) {
          console.error('Error retrieving plugins:', err.message);
          reject(err);
        } else {
            resolve(rows as Plugin[]); 
        }
      });
    });
  }