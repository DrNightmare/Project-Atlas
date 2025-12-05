const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const withShareIntent = (config) => {
    return withAndroidManifest(config, async (config) => {
        const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);

        const intentFilter = {
            action: [
                { $: { "android:name": "android.intent.action.SEND" } },
                // { $: { "android:name": "android.intent.action.SEND_MULTIPLE" } } // Uncomment if we support Multiple
            ],
            category: [
                { $: { "android:name": "android.intent.category.DEFAULT" } }
            ],
            data: [
                { $: { "android:mimeType": "image/*" } },
                { $: { "android:mimeType": "application/pdf" } },
                // { $: { "android:mimeType": "text/plain" } }
            ],
        };

        if (!mainActivity['intent-filter']) {
            mainActivity['intent-filter'] = [];
        }

        // Check if duplicate?
        // For now simple append.
        mainActivity['intent-filter'].push(intentFilter);

        // Ensure launchMode is singleTask to handle onNewIntent correctly
        mainActivity.$['android:launchMode'] = 'singleTask';

        return config;
    });
};

module.exports = withShareIntent;
