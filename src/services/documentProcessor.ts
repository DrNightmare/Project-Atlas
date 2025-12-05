import { addDocument, updateDocument } from './database';
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

        // 5. Update Original Document
        const firstItem = parsedDataArray[0];
        updateDocument(
            docId,
            firstItem.title,
            firstItem.date,
            firstItem.type,
            firstItem.subType,
            firstItem.owner,
            0, // Processing complete
            tripId
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
                    tripId
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
