import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('travel_docs.db');

export interface Document {
  id: number;
  uri: string;
  title: string;
  docDate: string;
  type: string;
  owner?: string;
  createdAt: string;
  processing: number; // 0 = false, 1 = true
}

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uri TEXT NOT NULL,
      title TEXT NOT NULL,
      docDate TEXT NOT NULL,
      type TEXT NOT NULL,
      owner TEXT,
      createdAt TEXT NOT NULL,
      processing INTEGER DEFAULT 0
    );
  `);

  // Migration: add owner column if missing
  try { db.execSync(`ALTER TABLE documents ADD COLUMN owner TEXT;`); } catch (e) { }
  // Migration: add processing column if missing
  try { db.execSync(`ALTER TABLE documents ADD COLUMN processing INTEGER DEFAULT 0;`); } catch (e) { }
};

export const addDocument = (
  uri: string,
  title: string,
  docDate: string,
  type: string,
  owner?: string,
  processing: number = 0
) => {
  const createdAt = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO documents (uri, title, docDate, type, owner, createdAt, processing) VALUES (?, ?, ?, ?, ?, ?, ?)',
    uri,
    title,
    docDate,
    type,
    owner || null,
    createdAt,
    processing
  );
  return result.lastInsertRowId;
};

export const getDocuments = (): Document[] => {
  return db.getAllSync<Document>('SELECT * FROM documents ORDER BY docDate ASC');
};

export const deleteDocument = (id: number) => {
  db.runSync('DELETE FROM documents WHERE id = ?', id);
};

export const updateDocument = (
  id: number,
  title: string,
  docDate: string,
  type: string,
  owner?: string,
  processing?: number
) => {
  db.runSync(
    'UPDATE documents SET title = ?, docDate = ?, type = ?, owner = ?, processing = ? WHERE id = ?',
    title,
    docDate,
    type,
    owner || null,
    processing ?? 0,
    id
  );
};
