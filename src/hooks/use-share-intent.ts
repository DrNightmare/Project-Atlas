import { processDocument } from '@/src/services/documentProcessor';
import { getAutoParseEnabled } from '@/src/services/settingsStorage';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useShareIntent as useExpoShareIntent } from 'expo-share-intent';
import { useEffect } from 'react';

export const useShareIntent = () => {
    const router = useRouter();
    const { hasShareIntent, shareIntent, resetShareIntent } = useExpoShareIntent();

    useEffect(() => {
        const handleSharedContent = async () => {
            if (!hasShareIntent || !shareIntent.files || shareIntent.files.length === 0) return;

            const file = shareIntent.files[0];
            // expo-share-intent usually provides path, mimeType, fileName
            const contentPath = file.path;

            if (!contentPath) return;

            try {
                // Ensure paths are proper URIs
                const safeContentPath = contentPath.startsWith('file://') ? contentPath : 'file://' + contentPath;
                const fileName = file.fileName || contentPath.split('/').pop() || 'shared_file';
                const newPath = (FileSystem as any).documentDirectory + fileName;

                // Copy file instead of move
                await FileSystem.copyAsync({
                    from: safeContentPath,
                    to: newPath,
                });

                // Reset intent immediately after processing to prevent duplicate handling
                resetShareIntent();

                const autoParseEnabled = await getAutoParseEnabled();

                // Call Shared Processor
                await processDocument(newPath, fileName, autoParseEnabled);

            } catch (e) {
                console.error('Error handling shared content:', e);
            }
        };

        handleSharedContent();
    }, [hasShareIntent, shareIntent, resetShareIntent]);
};
