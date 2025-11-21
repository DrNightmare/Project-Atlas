import * as ExpoFileSystem from 'expo-file-system/legacy';

const GEMINI_API_KEY = 'AIzaSyAtG98EaM6svIUMoC2e26yTaCcPksxncx8'; // TODO: Replace with actual key
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface ParsedData {
    title: string;
    date: string;
    type: 'Flight' | 'Hotel' | 'Receipt' | 'Other';
    owner?: string;
}

export const parseDocumentWithGemini = async (uri: string): Promise<ParsedData> => {
    try {
        // 1. Read file as Base64
        const base64 = await ExpoFileSystem.readAsStringAsync(uri, {
            encoding: ExpoFileSystem.EncodingType.Base64,
        });

        // 2. Construct Payload
        const payload = {
            contents: [{
                parts: [
                    { text: "Analyze this travel document. Extract the following fields in strict JSON format:\n- 'title': A short descriptive title (e.g., 'Flight to Mumbai', 'Hotel Booking - Taj')\n- 'date': The most relevant date and time in ISO 8601 format (e.g., flight departure time, hotel check-in time, transaction time). If no date is found, return null.\n- 'type': One of: Flight, Hotel, Receipt, Other\n- 'owner': The person's name this document belongs to (passenger name, guest name, customer name). If no name is found, return null.\n\nDo not include markdown formatting like ```json." },
                    {
                        inline_data: {
                            mime_type: "image/jpeg", // Assuming JPEG for simplicity, can detect from URI
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

        return {
            title: parsed.title || 'Untitled Document',
            date: parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString(),
            type: parsed.type || 'Other',
            owner: parsed.owner || undefined,
        };

    } catch (error) {
        console.error('Parsing Error:', error);
        // Fallback to mock data or error
        return {
            title: 'Scanned Document (Error)',
            date: new Date().toISOString(),
            type: 'Other',
        };
    }
};
