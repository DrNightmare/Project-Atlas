import * as ExpoFileSystem from 'expo-file-system/legacy';
import { getApiKey } from './apiKeyStorage';

export interface ParsedData {
    title: string;
    date: string;
    type: 'Flight' | 'Hotel' | 'Receipt' | 'Other';
    owner?: string;
}

// Custom error for missing API key
export class ApiKeyMissingError extends Error {
    constructor(message: string = 'API key not found. Please configure your Gemini API key in Settings.') {
        super(message);
        this.name = 'ApiKeyMissingError';
    }
}

// Test the API key by listing models (lighter weight than generating content)
export const testApiKey = async (apiKey: string): Promise<boolean> => {
    try {
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(GEMINI_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return response.ok;
    } catch (error) {
        console.error('API Key Test Failed:', error);
        return false;
    }
};

const safeParseDate = (dateStr: any): string => {
    if (!dateStr) return new Date().toISOString();
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date from Gemini:', dateStr);
            return new Date().toISOString();
        }
        return date.toISOString();
    } catch (e) {
        console.warn('Date parsing error:', e);
        return new Date().toISOString();
    }
};

export const parseDocumentWithGemini = async (uri: string): Promise<ParsedData[]> => {
    try {
        // 0. Get API key from secure storage
        const apiKey = await getApiKey();
        if (!apiKey) {
            throw new ApiKeyMissingError();
        }

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // 1. Read file as Base64
        const base64 = await ExpoFileSystem.readAsStringAsync(uri, {
            encoding: ExpoFileSystem.EncodingType.Base64,
        });

        // 1.5. Detect file type and set MIME type
        const isPdf = uri.toLowerCase().endsWith('.pdf');
        const mimeType = isPdf ? 'application/pdf' : 'image/jpeg';

        // 2. Construct Payload
        const payload = {
            contents: [{
                parts: [
                    { text: "Analyze this travel document. Extract the following fields in strict JSON format:\n- 'title': A short descriptive title (e.g., 'Flight to Mumbai', 'Hotel Booking - Taj')\n- 'date': The most relevant date and time in ISO 8601 format (e.g., flight departure time, hotel check-in time, transaction time). If no date is found, return null.\n- 'type': One of: Flight, Hotel, Receipt, Other\n- 'owner': The person's name this document belongs to (passenger name, guest name, customer name). Format the name in title case (e.g., 'Arvind P'), remove titles like Mr/Mrs/Ms, and replace slashes with spaces. If no name is found, return null.\n\nIf multiple distinct documents or receipts are visible in the file, return a JSON ARRAY of objects, one for each item. If only one is found, you can return a single object or an array of one object.\n\nDo not include markdown formatting like ```json." },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64
                        }
                    }
                ]
            }]
        };

        // 3. Call API
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data);
            throw new Error(data.error?.message || 'Failed to parse document');
        }

        // 4. Parse Response
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error('No response from Gemini');

        // Clean up potential markdown code blocks if the model ignores instruction
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        // Normalise to array
        const items = Array.isArray(parsed) ? parsed : [parsed];

        return items.map((docData: any) => ({
            title: docData.title || 'Untitled Document',
            date: safeParseDate(docData.date),
            type: docData.type || 'Other',
            owner: docData.owner || undefined,
        }));

    } catch (error) {
        console.error('Parsing Error:', error);

        // Re-throw ApiKeyMissingError so the UI can handle it
        if (error instanceof ApiKeyMissingError) {
            throw error;
        }

        // Fallback to mock data for other errors
        return [{
            title: 'Scanned Document (Error)',
            date: new Date().toISOString(),
            type: 'Other',
        }];
    }
};
