import { ToastAndroid } from 'react-native';
import { addDocument, getTrips, updateDocument } from './database';
import { documentsChanged } from './events';
import { ApiKeyMissingError, parseDocumentWithGemini } from './geminiParser';

export interface ProcessResult {
    docId: number;
    parsedItems?: any[];
    error?: any;
}

export const processDocument = async (
    uri: string,
    fileName: string,
    autoParseEnabled: boolean,
    tripId?: number
): Promise<ProcessResult> => {
    // 1. Determine Type
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const placeholderType = isPdf ? 'PDF' : 'Image';

    // 2. Add Initial Document (Processing = 1 if auto-parse enabled)
    const docId = addDocument(
        uri,
        fileName,
        new Date().toISOString(),
        placeholderType,
        undefined,
        undefined,
        autoParseEnabled ? 1 : 0,
        tripId
    );

    // 3. Notify UI to show the new card
    documentsChanged.emit();

    if (!autoParseEnabled) {
        return { docId };
    }

    // 4. Parse in Background
    try {
        const parsedDataArray = await parseDocumentWithGemini(uri);

        // 5. Auto-tag Trip if not provided
        let finalTripId = tripId;
        const docDate = new Date(parsedDataArray[0].date);

        if (!finalTripId && !isNaN(docDate.getTime())) {
            const trips = getTrips();
            // Trips are already sorted by startDate DESC or we can sort them
            // The user asked for "chronological order" (oldest first?), usually matching logic iterates and takes the first specific box it fits in.
            // Let's sort oldest first for chronological iteration as requested.
            const sortedTrips = [...trips].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            for (const trip of sortedTrips) {
                const start = new Date(trip.startDate);
                const end = new Date(trip.endDate);

                // Set hours to 0 to compare dates only, or just use raw comparison if timestamps match
                // Assuming "within dates", broad comparison is safer.
                if (docDate >= start && docDate <= end) {
                    finalTripId = trip.id;
                    ToastAndroid.show(`Auto-added to trip: ${trip.title}`, ToastAndroid.SHORT);
                    break;
                }
            }
        }

        // 6. Update Original Document
        const firstItem = parsedDataArray[0];
        updateDocument(
            docId,
            firstItem.title,
            firstItem.date,
            firstItem.type,
            firstItem.subType,
            firstItem.owner,
            0, // Processing complete
            finalTripId
        );

        // 6. Add Extra Documents if any
        if (parsedDataArray.length > 1) {
            for (let i = 1; i < parsedDataArray.length; i++) {
                const item = parsedDataArray[i];
                addDocument(
                    uri,
                    item.title,
                    item.date,
                    item.type,
                    item.subType,
                    item.owner,
                    0, // Not processing
                    finalTripId
                );
            }
        }

        // 7. Notify UI again
        documentsChanged.emit();

        return { docId, parsedItems: parsedDataArray };

    } catch (e) {
        console.error('Processing failed', e);

        // Reset processing flag
        updateDocument(
            docId,
            fileName,
            new Date().toISOString(),
            placeholderType,
            undefined,
            undefined,
            0,
            tripId
        );

        documentsChanged.emit();

        if (e instanceof ApiKeyMissingError) {
            throw e;
        }

        return { docId, error: e };
    }
};
