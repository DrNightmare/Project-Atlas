import * as ExpoFileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const DOCS_DIR = (ExpoFileSystem.documentDirectory ?? '') + 'docs/';

export const initFileStorage = async () => {
    const dirInfo = await ExpoFileSystem.getInfoAsync(DOCS_DIR);
    if (!dirInfo.exists) {
        await ExpoFileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
    }
};

export const saveFile = async (uri: string, fileName?: string): Promise<string> => {
    let filename = fileName;
    if (!filename) {
        filename = uri.split('/').pop();
    }
    if (!filename) throw new Error('Invalid URI');

    // Ensure unique filename
    const newPath = DOCS_DIR + Date.now() + '_' + filename;
    await ExpoFileSystem.copyAsync({
        from: uri,
        to: newPath
    });
    return newPath;
};

export const deleteFile = async (uri: string) => {
    await ExpoFileSystem.deleteAsync(uri, { idempotent: true });
};

export const openFile = async (uri: string) => {
    try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(uri, {
                mimeType: uri.endsWith('.pdf') ? 'application/pdf' : 'image/*',
                dialogTitle: 'Open with',
                UTI: uri.endsWith('.pdf') ? 'com.adobe.pdf' : 'public.image'
            });
        } else {
            throw new Error('Sharing is not available on this device');
        }
    } catch (e) {
        console.error('Failed to open file', e);
        throw e;
    }
};
