import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface PickedDocument {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
}

export const useDocumentPicker = () => {
    const pickDocument = async (): Promise<PickedDocument | null> => {
        return new Promise((resolve) => {
            Alert.alert(
                'Add Document',
                'Choose how you want to add a document',
                [
                    {
                        text: 'Take Photo',
                        onPress: async () => {
                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                quality: 0.8,
                            });

                            if (!result.canceled && result.assets[0]) {
                                const asset = result.assets[0];
                                resolve({
                                    uri: asset.uri,
                                    name: `Photo_${new Date().getTime()}.jpg`,
                                    mimeType: 'image/jpeg',
                                    size: asset.fileSize,
                                });
                            } else {
                                resolve(null);
                            }
                        },
                    },
                    {
                        text: 'Choose File',
                        onPress: async () => {
                            const result = await DocumentPicker.getDocumentAsync({
                                type: ['application/pdf', 'image/*'],
                                copyToCacheDirectory: true,
                            });

                            if (!result.canceled && result.assets[0]) {
                                const asset = result.assets[0];
                                resolve({
                                    uri: asset.uri,
                                    name: asset.name,
                                    mimeType: asset.mimeType || 'application/octet-stream',
                                    size: asset.size,
                                });
                            } else {
                                resolve(null);
                            }
                        },
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(null),
                    },
                ]
            );
        });
    };

    return { pickDocument };
};
