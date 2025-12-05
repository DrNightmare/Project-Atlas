import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

export const useSelectionMode = () => {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }

            // Auto-exit/enter selection mode based on count
            if (newSet.size === 0) {
                setSelectionMode(false);
            } else {
                setSelectionMode(true);
            }

            return newSet;
        });
    }, []);

    const resetSelection = useCallback(() => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    }, []);

    const confirmDelete = useCallback((onDelete: () => void | Promise<void>, itemType: string = 'item') => {
        Alert.alert(
            'Delete Items',
            `Are you sure you want to delete ${selectedIds.size} ${itemType}(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await onDelete();
                        resetSelection();
                    },
                },
            ]
        );
    }, [selectedIds, resetSelection]);

    return {
        selectionMode,
        selectedIds,
        toggleSelection,
        resetSelection,
        confirmDelete,
        setSelectionMode // Exposed for manual triggering if needed (e.g. initial long press)
    };
};
