
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
    // If the intent is a file share (content schema), ignore routing
    // and let expo-share-intent handle the data.
    if (path.startsWith('content://') || path.startsWith('file://')) {
        // Return the current path or root to prevent a navigation error
        // sending to "/" keeps us on the current screen usually or goes to home.
        return "/";
    }
    return path;
}
