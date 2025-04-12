import path from 'path';
import sqlite3 from 'sqlite3';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'mydb.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Error opening database:', err.message);
  else console.log('✅ Database ready at:', dbPath);
});

export function runQuery(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: sqlite3.RunResult, err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function getQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function prepareInsert<T extends Record<string, unknown>>(table: string, obj: T) {
  const keys = Object.keys(obj);
  const values = keys.map((key) => obj[key]);
  const placeholders = keys.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  return { sql, values };
}

export default db;
