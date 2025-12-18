import * as DocumentPicker from 'expo-document-picker';
import * as ExpoFileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
    addDocument,
    addIdentityDocument,
    addTrip,
    Document,
    getDocuments,
    getIdentityDocuments,
    getTrips,
    IdentityDocument,
    Trip
} from './database';
import { saveFile } from './fileStorage';

const BACKUP_FILE_NAME = 'atlas_backup.atlas';

interface BackupData {
    version: number;
    timestamp: string;
    trips: Trip[];
    documents: (Document & { base64?: string })[];
    identityDocuments: (IdentityDocument & { base64?: string })[];
}

export const exportBackup = async () => {
    try {
        const trips = getTrips();
        const documents = getDocuments();
        const identityDocuments = getIdentityDocuments();

        const backupDocuments = await Promise.all(documents.map(async (doc) => {
            try {
                const base64 = await ExpoFileSystem.readAsStringAsync(doc.uri, {
                    encoding: ExpoFileSystem.EncodingType.Base64,
                });
                return { ...doc, base64 };
            } catch (e) {
                console.warn(`Failed to read file for doc ${doc.id}: ${doc.uri}`, e);
                return { ...doc }; // Export metadata even if file fails
            }
        }));

        const backupIdentityDocs = await Promise.all(identityDocuments.map(async (doc) => {
            try {
                const base64 = await ExpoFileSystem.readAsStringAsync(doc.uri, {
                    encoding: ExpoFileSystem.EncodingType.Base64,
                });
                return { ...doc, base64 };
            } catch (e) {
                console.warn(`Failed to read file for identity doc ${doc.id}: ${doc.uri}`, e);
                return { ...doc };
            }
        }));

        const backupData: BackupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            trips,
            documents: backupDocuments,
            identityDocuments: backupIdentityDocs,
        };

        const backupContent = JSON.stringify(backupData);
        const backupUri = ExpoFileSystem.cacheDirectory + BACKUP_FILE_NAME;

        await ExpoFileSystem.writeAsStringAsync(backupUri, backupContent);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(backupUri, {
                mimeType: 'application/json',
                dialogTitle: 'Export Backup',
                UTI: 'public.json'
            });
        } else {
            throw new Error('Sharing is not available');
        }

    } catch (error) {
        console.error('Backup failed', error);
        throw error;
    }
};

export const importBackup = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*', // Allow all since .atlas might not be recognized
            copyToCacheDirectory: true,
        });

        if (result.canceled) return { success: false, message: 'Canceled' };

        const fileUri = result.assets[0].uri;
        const content = await ExpoFileSystem.readAsStringAsync(fileUri);
        const data: BackupData = JSON.parse(content);

        if (!data.version || !data.documents) {
            throw new Error('Invalid backup file');
        }

        // Map old trip IDs to new ones
        const tripIdMap: Record<number, number> = {};

        // 1. Restore Trips
        for (const trip of data.trips) {
            const newId = addTrip(trip.title, trip.startDate, trip.endDate);
            tripIdMap[trip.id] = Number(newId);
        }

        // 2. Restore Documents
        for (const doc of data.documents) {
            let finalUri = doc.uri;
            if (doc.base64) {
                // Determine a safe filename
                const originalName = doc.uri.split('/').pop() || 'document';
                const tempUri = ExpoFileSystem.cacheDirectory + originalName;
                await ExpoFileSystem.writeAsStringAsync(tempUri, doc.base64, {
                    encoding: ExpoFileSystem.EncodingType.Base64,
                });
                finalUri = await saveFile(tempUri, originalName);
            }

            addDocument(
                finalUri,
                doc.title,
                doc.docDate,
                doc.type,
                doc.subType,
                doc.owner,
                0, // processing = false
                doc.tripId ? tripIdMap[doc.tripId] : undefined
            );
        }

        // 3. Restore Identity Documents
        for (const idDoc of data.identityDocuments) {
            let finalUri = idDoc.uri;
            if (idDoc.base64) {
                const originalName = idDoc.uri.split('/').pop() || 'identity';
                const tempUri = ExpoFileSystem.cacheDirectory + originalName;
                await ExpoFileSystem.writeAsStringAsync(tempUri, idDoc.base64, {
                    encoding: ExpoFileSystem.EncodingType.Base64,
                });
                finalUri = await saveFile(tempUri, originalName);
            }

            addIdentityDocument(
                finalUri,
                idDoc.title,
                idDoc.type,
                idDoc.documentNumber,
                idDoc.issueDate,
                idDoc.expiryDate,
                idDoc.owner,
                0 // processing = false
            );
        }

        return { success: true, message: 'Restore complete' };

    } catch (error) {
        console.error('Import failed', error);
        throw error;
    }
};
