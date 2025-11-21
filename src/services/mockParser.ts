export interface ParsedData {
    title: string;
    date: string;
    type: 'Flight' | 'Hotel' | 'Receipt' | 'Other';
}

const TYPES = ['Flight', 'Hotel', 'Receipt', 'Other'] as const;

export const parseDocument = async (uri: string): Promise<ParsedData> => {
    // Simulate network/processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const randomType = TYPES[Math.floor(Math.random() * TYPES.length)];
    // Random date within last ~4 months
    const randomDate = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString();

    return {
        title: `${randomType} Document ${Math.floor(Math.random() * 1000)}`,
        date: randomDate,
        type: randomType
    };
};
