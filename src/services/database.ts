import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('travel_docs.db');

export interface Document {
  id: number;
  uri: string;
  title: string;
  docDate: string;
  type: 'Transport' | 'Stay' | 'Activity' | 'Receipt' | 'Other';
  subType?: string;
  owner?: string;
  createdAt: string;
  processing: number; // 0 = false, 1 = true
}

export interface IdentityDocument {
  id: number;
  uri: string;
  title: string;
  type: 'Passport' | 'Visa' | 'Aadhaar' | 'Driver License' | 'PAN Card' | 'Other';
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
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
      subType TEXT,
      owner TEXT,
      createdAt TEXT NOT NULL,
      processing INTEGER DEFAULT 0
    );
  `);

  // Migration: add owner column if missing
  try { db.execSync(`ALTER TABLE documents ADD COLUMN owner TEXT;`); } catch (e) { }
  // Migration: add processing column if missing
  try { db.execSync(`ALTER TABLE documents ADD COLUMN processing INTEGER DEFAULT 0;`); } catch (e) { }
  // Migration: add subType column if missing
  try { db.execSync(`ALTER TABLE documents ADD COLUMN subType TEXT;`); } catch (e) { }

  // Data Migration: Update old types to new categories
  try {
    db.runSync(`UPDATE documents SET subType = 'Flight', type = 'Transport' WHERE type = 'Flight'`);
    db.runSync(`UPDATE documents SET subType = 'Hotel', type = 'Stay' WHERE type = 'Hotel'`);
    db.runSync(`UPDATE documents SET subType = 'Event', type = 'Activity' WHERE type = 'Event'`);
  } catch (e) {
    console.warn('Migration failed or already applied', e);
  }

  // Create identity_documents table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS identity_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uri TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      documentNumber TEXT,
      issueDate TEXT,
      expiryDate TEXT,
      owner TEXT,
      createdAt TEXT NOT NULL
    );
  `);
};

export const addDocument = (
  uri: string,
  title: string,
  docDate: string,
  type: string,
  subType?: string,
  owner?: string,
  processing: number = 0
) => {
  const createdAt = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO documents (uri, title, docDate, type, subType, owner, createdAt, processing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    uri,
    title,
    docDate,
    type,
    subType || null,
    owner || null,
    createdAt,
    processing
  );
  return result.lastInsertRowId;
};

export const getDocuments = (): Document[] => {
  return db.getAllSync<Document>('SELECT * FROM documents ORDER BY docDate ASC');
};

export const getDocumentById = (id: number): Document | null => {
  return db.getFirstSync<Document>('SELECT * FROM documents WHERE id = ?', id);
};

export const deleteDocument = (id: number) => {
  db.runSync('DELETE FROM documents WHERE id = ?', id);
};

export const updateDocument = (
  id: number,
  title: string,
  docDate: string,
  type: string,
  subType?: string,
  owner?: string,
  processing?: number
) => {
  db.runSync(
    'UPDATE documents SET title = ?, docDate = ?, type = ?, subType = ?, owner = ?, processing = ? WHERE id = ?',
    title,
    docDate,
    type,
    subType || null,
    owner || null,
    processing ?? 0,
    id
  );
};

// Identity Documents CRUD
export const addIdentityDocument = (
  uri: string,
  title: string,
  type: string,
  documentNumber?: string,
  issueDate?: string,
  expiryDate?: string,
  owner?: string
) => {
  const createdAt = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO identity_documents (uri, title, type, documentNumber, issueDate, expiryDate, owner, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    uri,
    title,
    type,
    documentNumber || null,
    issueDate || null,
    expiryDate || null,
    owner || null,
    createdAt
  );
  return result.lastInsertRowId;
};

export const getIdentityDocuments = (): IdentityDocument[] => {
  return db.getAllSync<IdentityDocument>('SELECT * FROM identity_documents ORDER BY createdAt DESC');
};

export const getIdentityDocumentById = (id: number): IdentityDocument | null => {
  return db.getFirstSync<IdentityDocument>('SELECT * FROM identity_documents WHERE id = ?', id);
};

export const updateIdentityDocument = (
  id: number,
  title: string,
  type: string,
  documentNumber?: string,
  issueDate?: string,
  expiryDate?: string,
  owner?: string
) => {
  db.runSync(
    'UPDATE identity_documents SET title = ?, type = ?, documentNumber = ?, issueDate = ?, expiryDate = ?, owner = ? WHERE id = ?',
    title,
    type,
    documentNumber || null,
    issueDate || null,
    expiryDate || null,
    owner || null,
    id
  );
};

export const deleteIdentityDocument = (id: number) => {
  db.runSync('DELETE FROM identity_documents WHERE id = ?', id);
};
