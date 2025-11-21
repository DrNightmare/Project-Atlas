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
      createdAt TEXT NOT NULL
    );
  `);

  // Migration: Add owner column if it doesn't exist
  try {
    db.execSync(`ALTER TABLE documents ADD COLUMN owner TEXT;`);
  } catch (e) {
    // Column already exists, ignore error
  }
};

export const addDocument = (uri: string, title: string, docDate: string, type: string, owner?: string) => {
  const createdAt = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO documents (uri, title, docDate, type, owner, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    uri, title, docDate, type, owner || null, createdAt
  );
  return result.lastInsertRowId;
};

export const getDocuments = (): Document[] => {
  return db.getAllSync<Document>('SELECT * FROM documents ORDER BY docDate DESC');
};

export const deleteDocument = (id: number) => {
  db.runSync('DELETE FROM documents WHERE id = ?', id);
};

export const updateDocument = (id: number, title: string, docDate: string, type: string, owner?: string) => {
  db.runSync(
    'UPDATE documents SET title = ?, docDate = ?, type = ?, owner = ? WHERE id = ?',
    title, docDate, type, owner || null, id
  );
};
