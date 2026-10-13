import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';
import { migrations } from './migrations.js';

export type DB = Database.Database;

export function openDatabase(file = path.join(config.dataDir, 'internships.db')): DB {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db: DB) {
  const current = db.pragma('user_version', { simple: true }) as number;
  migrations.slice(current).forEach((sql, i) => {
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${current + i + 1}`);
    })();
  });
}

let instance: DB | undefined;

export function db(): DB {
  instance ??= openDatabase();
  return instance;
}

export function useDatabase(database: DB) {
  instance = database;
}
