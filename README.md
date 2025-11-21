# Project Atlas - AI-Powered Travel Document Manager

A sleek, modern React Native mobile application built with Expo that intelligently manages your travel documents using AI-powered metadata extraction.

## Features

### Document Management
- **Upload & Store**: Support for images (JPEG, PNG) and PDF documents
- **AI-Powered Parsing**: Automatic extraction of title, date, type, and owner using Google Gemini 2.0 Flash
- **Multi-Document Detection**: Automatically detects and creates separate entries for multiple items in a single file
- **Local Storage**: All documents stored securely on your device using SQLite and Expo FileSystem
- **Optimistic UI**: Instant feedback with background processing for smooth user experience

### Smart Organization
- **Timeline View**: Documents organized into "Upcoming" and "Past" sections
- **Chronological Sorting**: Upcoming events sorted nearest-first, past events newest-first
- **Type-Specific Icons**: Visual indicators for Flights, Hotels, Receipts, and other document types
- **Owner Display**: Shows document owner with formatted names
- **Processing Indicators**: Real-time status updates during AI parsing

### Document Viewing
- **Full-Screen Viewer**: Immersive document viewing experience
- **Pinch-to-Zoom**: Smooth zoom controls with gesture support
- **Pan & Navigate**: Drag to explore zoomed documents
- **PDF Support**: Native PDF rendering with WebView fallback
- **Double-Tap Zoom**: Quick zoom toggle for convenience

### Batch Operations
- **Multi-Select Mode**: Long-press to enter selection mode
- **Bulk Delete**: Remove multiple documents at once
- **Batch Reprocess**: Re-run AI parsing on selected documents
- **Visual Selection**: Clear indicators for selected items

### API Key Management
- **Onboarding Flow**: Guided setup for first-time users
- **Settings Screen**: Manage API key with secure storage
- **Test Key Function**: Validate API key before saving
- **Environment Variable Support**: Auto-populate from `.env` file
- **Secure Storage**: API keys stored using expo-secure-store
- **Key Visibility Toggle**: Show/hide API key in settings

### Modern UI/UX
- **Sleek Design**: Minimal, modern interface with consistent theming
- **Dark Mode Ready**: Theme system with customizable colors
- **Smooth Animations**: Polished interactions and transitions
- **Responsive Layout**: Adapts to different screen sizes
- **Type-Specific Accents**: Color-coded document types
- **Toast Notifications**: Non-intrusive feedback messages

## Tech Stack

- **Framework**: React Native with Expo SDK
- **Navigation**: Expo Router (file-based routing)
- **Database**: SQLite via expo-sqlite
- **File Storage**: Expo FileSystem (legacy)
- **Secure Storage**: expo-secure-store
- **AI**: Google Gemini 2.0 Flash API
- **Gestures**: react-native-gesture-handler & react-native-reanimated
- **Date Formatting**: date-fns
- **PDF Viewing**: react-native-webview with PDF.js
- **Icons**: @expo/vector-icons (Ionicons)

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

## Project Structure

```
Project Atlas/
├── app/                        # Expo Router pages
│   ├── (tabs)/
│   │   └── index.tsx          # Main timeline screen
│   ├── document-view.tsx      # Full-screen document viewer
│   ├── settings.tsx           # API key management
│   ├── onboarding.tsx         # First-time setup
│   └── index.tsx              # Entry point & routing logic
├── src/
│   ├── components/
│   │   └── DocumentCard.tsx   # Document card component
│   ├── services/
│   │   ├── database.ts        # SQLite operations
│   │   ├── fileStorage.ts     # File system utilities
│   │   ├── geminiParser.ts    # AI parsing logic
│   │   └── apiKeyStorage.ts   # Secure key storage
│   └── theme.ts               # Design system tokens
└── .env                       # API keys (git-ignored)
```

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

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uri TEXT NOT NULL,
  title TEXT NOT NULL,
  docDate TEXT NOT NULL,
  type TEXT NOT NULL,
  owner TEXT,
  createdAt TEXT NOT NULL,
  processing INTEGER DEFAULT 0
);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `uri`: Local file path
- `title`: Document title (AI-extracted or placeholder)
- `docDate`: Event date/time in ISO-8601 format
- `type`: Document category (Flight, Hotel, Receipt, Other)
- `owner`: Person's name associated with the document
- `createdAt`: Timestamp when document was added
- `processing`: 0 = idle, 1 = AI parsing in progress

## AI Parsing

The Gemini 2.0 Flash API extracts:

- **Title**: Descriptive document title (e.g., "Flight to Mumbai", "Hotel Booking - Taj")
- **Date**: Most relevant date/time in ISO-8601 format (departure time, check-in, transaction date)
- **Type**: Category classification (Flight, Hotel, Receipt, Other)
- **Owner**: Passenger/guest/customer name in title case (e.g., "Arvind P")

### Multi-Document Detection
If multiple distinct items are found in a single file (e.g., multiple receipts), the parser returns an array and the app creates separate entries for each item.

### Error Handling
- **Missing API Key**: Shows alert with "Go to Settings" button
- **Parsing Failures**: Falls back to placeholder data
- **Network Errors**: Gracefully handled with user feedback

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `EXPO_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | No* | None |

*Can be configured in-app via Settings screen

## Design System

The app uses a consistent theme defined in `src/theme.ts`:

### Colors
- **Primary**: #007AFF (iOS blue)
- **Success**: #34C759 (green)
- **Error**: #FF3B30 (red)
- **Text**: #000000 (black)
- **Background**: #F2F2F7 (light gray)

### Typography
- **H1**: 32px, bold
- **H2**: 24px, bold
- **Body**: 16px, regular
- **Small**: 14px, regular

### Spacing
- XS: 4px, S: 8px, M: 12px, L: 16px, XL: 24px

## Development

### Running Tests
```bash
npm test
```

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

## Troubleshooting

### API Key Issues
- **"API key not found"**: Configure your key in Settings or add to `.env`
- **"API Key validation failed"**: Verify your key at https://aistudio.google.com/app/apikey
- **Environment variable not working**: Restart the dev server after editing `.env`

### Database Issues
- **Migration errors**: The app auto-migrates; if issues persist, clear app data
- **Duplicate entries**: Check for multiple parsed items from a single document

### File/Image Issues
- **Image not loading**: Verify file permissions and valid file path
- **PDF not rendering**: Ensure react-native-webview is properly installed

### Performance
- **Slow parsing**: Gemini API response time varies; processing indicator shows status
- **App crashes**: Check console for errors and ensure all dependencies are installed

## API Key Security

- API keys are stored using `expo-secure-store` (encrypted on-device storage)
- Keys are never transmitted except to Google's Gemini API
- Environment variables are only used for development convenience
- In-app keys take precedence over environment variables

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow existing naming conventions
- Use the theme system for styling
- Add comments for complex logic

## License

This project is licensed under the MIT License.

## Acknowledgments

- **Expo** for the excellent development framework
- **Google Gemini** for powerful AI capabilities
- **React Native** community for amazing tools and libraries
- **Ionicons** for beautiful icon set

## Roadmap

Potential future enhancements:
- Cloud sync and backup
- Sharing documents with others
- Calendar integration
- Notification reminders
- Export to PDF/CSV
- Advanced search and filtering
- Custom document categories
- Multi-language support
