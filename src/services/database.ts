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
  tripId?: number;
}

export interface Trip {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
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
  // Migration: add tripId column if missing
  try { db.execSync(`ALTER TABLE documents ADD COLUMN tripId INTEGER;`); } catch (e) { }

  // Create trips table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

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

      createdAt TEXT NOT NULL,
      processing INTEGER DEFAULT 0
    );
  `);

  // Migration: add processing column if missing
  try { db.execSync(`ALTER TABLE identity_documents ADD COLUMN processing INTEGER DEFAULT 0;`); } catch (e) { }
};

export const addDocument = (
  uri: string,
  title: string,
  docDate: string,
  type: string,
  subType?: string,
  owner?: string,
  processing: number = 0,
  tripId?: number
) => {
  const createdAt = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO documents (uri, title, docDate, type, subType, owner, createdAt, processing, tripId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    uri,
    title,
    docDate,
    type,
    subType || null,
    owner || null,
    createdAt,
    processing,
    tripId || null
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
  processing?: number,
  tripId?: number
) => {
  db.runSync(
    'UPDATE documents SET title = ?, docDate = ?, type = ?, subType = ?, owner = ?, processing = ?, tripId = ? WHERE id = ?',
    title,
    docDate,
    type,
    subType || null,
    owner || null,
    processing ?? 0,
    tripId || null,
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

  owner?: string,
  processing: number = 0
) => {
  const createdAt = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO identity_documents (uri, title, type, documentNumber, issueDate, expiryDate, owner, createdAt, processing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    uri,
    title,
    type,
    documentNumber || null,
    issueDate || null,
    expiryDate || null,
    owner || null,

    createdAt,
    processing
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

  owner?: string,
  processing?: number
) => {
  db.runSync(
    'UPDATE identity_documents SET title = ?, type = ?, documentNumber = ?, issueDate = ?, expiryDate = ?, owner = ?, processing = ? WHERE id = ?',
    title,
    type,
    documentNumber || null,
    issueDate || null,
    expiryDate || null,
    owner || null,
    processing ?? 0,
    id
  );
};

export const deleteIdentityDocument = (id: number) => {
  db.runSync('DELETE FROM identity_documents WHERE id = ?', id);
};

// Trips CRUD
export const addTrip = (
  title: string,
  startDate: string,
  endDate: string
) => {
  const createdAt = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO trips (title, startDate, endDate, createdAt) VALUES (?, ?, ?, ?)',
    title,
    startDate,
    endDate,
    createdAt
  );
  return result.lastInsertRowId;
};

export const getTrips = (): Trip[] => {
  return db.getAllSync<Trip>('SELECT * FROM trips ORDER BY startDate DESC');
};

export const getTripById = (id: number): Trip | null => {
  return db.getFirstSync<Trip>('SELECT * FROM trips WHERE id = ?', id);
};

export const updateTrip = (
  id: number,
  title: string,
  startDate: string,
  endDate: string
) => {
  db.runSync(
    'UPDATE trips SET title = ?, startDate = ?, endDate = ? WHERE id = ?',
    title,
    startDate,
    endDate,
    id
  );
};

export const deleteTrip = (id: number) => {
  // Optional: Set tripId to null for documents in this trip? Or delete them?
  // For now, let's just unlink them (set tripId to null)
  db.runSync('UPDATE documents SET tripId = NULL WHERE tripId = ?', id);
  db.runSync('DELETE FROM trips WHERE id = ?', id);
};

export const getDocumentsByTripId = (tripId: number): Document[] => {
  return db.getAllSync<Document>('SELECT * FROM documents WHERE tripId = ? ORDER BY docDate ASC', tripId);
};
