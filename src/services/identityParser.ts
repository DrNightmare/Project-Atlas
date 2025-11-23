import * as ExpoFileSystem from 'expo-file-system/legacy';
import { getApiKey } from './apiKeyStorage';
import { ApiKeyMissingError } from './geminiParser';

export interface ParsedIdentityData {
    title: string;
    type: 'Passport' | 'Visa' | 'Aadhaar' | 'Driver License' | 'PAN Card' | 'Other';
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    owner?: string;
}

const safeParseDate = (dateStr: any): string | undefined => {
    if (!dateStr) return undefined;
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date from Gemini:', dateStr);
            return undefined;
        }
        return date.toISOString();
    } catch (e) {
        console.warn('Date parsing error:', e);
        return undefined;
    }
};

export const parseIdentityDocumentWithGemini = async (uri: string): Promise<ParsedIdentityData> => {
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

        // 2. Construct Payload with specialized prompt for identity documents
        const payload = {
            contents: [{
                parts: [
                    { text: "Analyze this identity/credential document. Extract the following fields in strict JSON format:\n- 'title': A descriptive title (e.g., 'Indian Passport', 'US Visa', 'Aadhaar Card', 'Driver License')\n- 'type': One of: Passport, Visa, Aadhaar, Driver License, PAN Card, Other\n- 'documentNumber': The document/ID number (passport number, visa number, Aadhaar number, license number, etc.). If not found, return null.\n- 'issueDate': The issue/from date in ISO 8601 format. If not found, return null.\n- 'expiryDate': The expiry/valid until date in ISO 8601 format. If not found or if document doesn't expire (e.g., Aadhaar), return null.\n- 'owner': The person's name this document belongs to. Format in title case (e.g., 'Arvind P'), remove titles like Mr/Mrs/Ms. If not found, return null.\n\nReturn a single JSON object (not an array).\nDo not include markdown formatting like ```json." },
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
            throw new Error(data.error?.message || 'Failed to parse identity document');
        }

        // 4. Parse Response
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error('No response from Gemini');

        // Clean up potential markdown code blocks
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        return {
            title: parsed.title || 'Untitled Identity Document',
            type: (parsed.type as any) || 'Other',
            documentNumber: parsed.documentNumber || undefined,
            issueDate: safeParseDate(parsed.issueDate),
            expiryDate: safeParseDate(parsed.expiryDate),
            owner: parsed.owner || undefined,
        };

    } catch (error) {
        console.error('Identity Document Parsing Error:', error);

        // Re-throw ApiKeyMissingError
        if (error instanceof ApiKeyMissingError) {
            throw error;
        }

        // Fallback
        return {
            title: 'Scanned Identity Document (Error)',
            type: 'Other',
        };
    }
};
