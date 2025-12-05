const { withAndroidManifest, withMainActivity, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = "com.drnightmare.projectatlas";

// 1. ShareReceiverActivity Kotlin Code
const SHARE_RECEIVER_ACTIVITY_CODE = `package ${PACKAGE_NAME}

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class ShareReceiverActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val mainIntent = Intent(this, MainActivity::class.java).apply {
      action = intent.action
      type = intent.type // Fix for "setDataAndType" crash if data is null but type isn't
      // CRITICAL: Use setDataAndType to avoid clearing one when setting the other
      if (intent.data != null) {
          setDataAndType(intent.data, intent.type)
      }

      clipData = intent.clipData
      intent.extras?.let { putExtras(it) }

      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

    startActivity(mainIntent)
    finish()
  }
}
`;

// 2. Add ShareReceiverActivity.kt file
const withShareReceiverActivity = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const { modRequest } = config;
            const packagePath = PACKAGE_NAME.replace(/\\./g, '/');
            const destDir = path.join(modRequest.platformProjectRoot, 'app/src/main/java', packagePath);

            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            const filePath = path.join(destDir, 'ShareReceiverActivity.kt');
            fs.writeFileSync(filePath, SHARE_RECEIVER_ACTIVITY_CODE);

            return config;
        },
    ]);
};

// 3. Update AndroidManifest.xml
const withShareManifest = (config) => {
    return withAndroidManifest(config, (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

        // Add ShareReceiverActivity
        mainApplication.activity.push({
            $: {
                'android:name': '.ShareReceiverActivity',
                'android:theme': '@android:style/Theme.Translucent.NoTitleBar',
                'android:exported': 'true',
                'android:noHistory': 'true',
                'android:excludeFromRecents': 'true',
            },
            'intent-filter': [
                {
                    action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
                    data: [{ $: { 'android:mimeType': '*/*' } }],
                    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
                },
            ],
        });

        return config;
    });
};

// 4. Update MainActivity to handle onNewIntent
const withMainActivityNewIntent = (config) => {
    return withMainActivity(config, (config) => {
        let contents = config.modResults.contents;

        // Check if onNewIntent is already present
        if (!contents.includes('onNewIntent')) {
            // Need to insert it into the class.
            // Assuming simplified insertion at end of class or specific marker.
            // For standard Expo MainActivity (ReactActivityDelegate), we usually find the closing brace of the class.

            // Standard kotlin MainActivity
            if (contents.includes('class MainActivity : ReactActivity()')) {
                const onNewIntentBlock = `
  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }
`;
                // Insert before the last closing brace
                const lastBraceIndex = contents.lastIndexOf('}');
                if (lastBraceIndex !== -1) {
                    contents = contents.slice(0, lastBraceIndex) + onNewIntentBlock + contents.slice(lastBraceIndex);
                }
            }
        }

        config.modResults.contents = contents;
        return config;
    });
}


const withShareTrampoline = (config) => {
    config = withShareReceiverActivity(config);
    config = withShareManifest(config);
    config = withMainActivityNewIntent(config);
    return config;
};

module.exports = withShareTrampoline;
