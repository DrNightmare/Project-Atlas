# Project Atlas - AI-Powered Travel Document Manager

A sleek, modern React Native mobile application built with Expo that intelligently manages your travel documents using AI-powered metadata extraction. Currently uses Google Gemini Flash API for parsing.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Google Gemini API key (get one at https://aistudio.google.com/app/apikey)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Project Atlas"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key** (Optional - can also be set in-app)
   
   Create a `.env` file in the project root:
   ```bash
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npx expo start --clear
   ```

5. **Run on a device or emulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## Usage

### First-Time Setup
1. Launch the app
2. On the onboarding screen, tap "Get Free API Key" to obtain a Gemini API key
3. Paste your API key and tap "Get Started"
4. You're ready to add documents!

### Adding Documents
1. Tap the **+** button in the header
2. Select an image or PDF from your device
3. The file is saved locally and appears immediately with a processing indicator
4. AI parsing runs in the background and updates the entry automatically
5. If multiple items are detected, separate cards are created for each

### Viewing Documents
- Tap any document card to open the full-screen viewer
- **Pinch** to zoom in/out
- **Drag** to pan around zoomed documents
- **Double-tap** to toggle between fit and zoomed views
- PDFs are rendered with native support

### Managing Documents
- **Long-press** any card to enter selection mode
- **Tap** additional cards to select multiple items
- Use the **Refresh** icon to reprocess selected documents
- Use the **Trash** icon to delete selected documents
- Tap the **X** to exit selection mode

### API Key Management
- Tap the **Settings** icon (gear) in the header
- View your current API key (masked for security)
- Update or test your API key
- Clear the key to return to onboarding

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `EXPO_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | No* | None |

*Can be configured in-app via Settings screen

### Building for Production

**Android:**
```bash
npx expo build:android
```

**iOS:**
```bash
npx expo build:ios
```

### Using EAS Build (Recommended)
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## Security

- API keys are stored using `expo-secure-store` (encrypted on-device storage)
- Keys are never transmitted except to Google's Gemini API
- Environment variables are only used for development convenience
- In-app keys take precedence over environment variables

## Roadmap

Potential future enhancements:
- Cloud sync and backup
- Sharing documents with others
- Calendar integration
- Notification reminders
- Advanced search and filtering
- Custom document categories
- Multi-language support
