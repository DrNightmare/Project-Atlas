import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { DocumentPickerModal } from '../components/DocumentPickerModal';

export interface PickedDocument {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
}

export const useDocumentPicker = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [resolver, setResolver] = useState<((value: PickedDocument | null) => void) | null>(null);

    const pickDocument = async (): Promise<PickedDocument | null> => {
        return new Promise((resolve) => {
            setResolver(() => resolve);
            setModalVisible(true);
        });
    };

    const handleTakePhoto = async () => {
        setModalVisible(false);
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            resolver?.({
                uri: asset.uri,
                name: `Photo_${new Date().getTime()}.jpg`,
                mimeType: 'image/jpeg',
                size: asset.fileSize,
            });
        } else {
            resolver?.(null);
        }
    };

    const handleChooseFile = async () => {
        setModalVisible(false);
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            resolver?.({
                uri: asset.uri,
                name: asset.name,
                mimeType: asset.mimeType || 'application/octet-stream',
                size: asset.size,
            });
        } else {
            resolver?.(null);
        }
    };

    const handleCancel = () => {
        setModalVisible(false);
        resolver?.(null);
    };

    const PickerModal = () => (
        <DocumentPickerModal
            visible={modalVisible}
            onTakePhoto={handleTakePhoto}
            onChooseFile={handleChooseFile}
            onCancel={handleCancel}
        />
    );

    return { pickDocument, PickerModal };
};
