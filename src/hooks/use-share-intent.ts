import { processDocument } from '@/src/services/documentProcessor';
import { getAutoParseEnabled } from '@/src/services/settingsStorage';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { addShareIntentListener, getSharedContent } from '../../modules/share-intent';

export const useShareIntent = () => {
    const router = useRouter();

    useEffect(() => {
        const handleSharedContent = async (contentPath: string) => {
            if (!contentPath) return;

            try {
                // Ensure paths are proper URIs
                const safeContentPath = contentPath.startsWith('file://') ? contentPath : 'file://' + contentPath;
                const fileName = contentPath.split('/').pop() || 'shared_file';
                const newPath = (FileSystem as any).documentDirectory + fileName;

                // Copy file instead of move
                await FileSystem.copyAsync({
                    from: safeContentPath,
                    to: newPath,
                });

                try {
                    await FileSystem.deleteAsync(safeContentPath, { idempotent: true });
                } catch (e) { /* Ignore */ }

                const autoParseEnabled = await getAutoParseEnabled();

                // Call Shared Processor
                await processDocument(newPath, fileName, autoParseEnabled);

                // Assuming we want to ensure the user sees the timeline
                // router.replace('/(tabs)'); 

            } catch (e) {
                console.error('Error handling shared content:', e);
            }
        };

        const initialContent = getSharedContent();
        if (initialContent) handleSharedContent(initialContent);

        const subscription = addShareIntentListener((event) => {
            if (event.content) handleSharedContent(event.content);
        });

        return () => subscription.remove();
    }, []);
};
