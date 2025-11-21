# Project Atlas - AI-Powered Travel Document Manager

A local-first React Native mobile app for managing travel documents with AI-powered parsing using Google Gemini.

## Features

- 📄 **Document Upload**: Support for images and PDFs
- 🤖 **AI Parsing**: Automatic extraction of title, date, type, and owner using Google Gemini 2.0 Flash
- 💾 **Local Storage**: All documents stored locally using SQLite and Expo FileSystem
- 🔍 **Full-Screen Viewer**: Zoomable and pannable image viewer
- 🗑️ **Multi-Select Delete**: Long-press to select and delete multiple documents
- 🔄 **Reprocess**: Re-run AI parsing on existing documents
- 👤 **Owner Tracking**: Automatically extracts passenger/guest names
- ⏰ **Smart Date Display**: Context-aware date/time formatting based on document type

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Database**: SQLite (expo-sqlite)
- **File Storage**: Expo FileSystem
- **AI**: Google Gemini 2.0 Flash API
- **Gestures**: React Native Gesture Handler & Reanimated
- **Date Formatting**: date-fns

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Project Atlas"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   
   Create a `.env` file in the project root:
   ```bash
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
   
   > ⚠️ **Important**: Never commit your `.env` file. It's already added to `.gitignore`.

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/emulator**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
Project Atlas/
├── app/                          # Expo Router pages
│   ├── (tabs)/
│   │   └── index.tsx            # Main timeline screen
│   └── document-view.tsx        # Full-screen document viewer
├── src/
│   ├── components/
│   │   └── DocumentCard.tsx     # Timeline card component
│   └── services/
│       ├── database.ts          # SQLite operations
│       ├── fileStorage.ts       # File system operations
│       └── geminiParser.ts      # AI parsing logic
└── .env                         # API keys (not committed)
```

## Usage

### Adding Documents
1. Tap the **Add** button in the top right
2. Select an image or PDF from your device
3. Wait for AI to analyze and extract metadata
4. Document appears in the timeline

### Viewing Documents
- **Tap** a document card to view full-screen
- **Pinch** to zoom
- **Pan** to move around when zoomed
- **Double-tap** to zoom 2x or reset

### Managing Documents
- **Long-press** to enter selection mode
- **Tap** multiple documents to select
- **Delete**: Remove selected documents
- **Reprocess**: Re-run AI parsing on selected documents

## Database Schema

```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uri TEXT NOT NULL,           -- Local file path
  title TEXT NOT NULL,         -- AI-extracted title
  docDate TEXT NOT NULL,       -- ISO 8601 date/time
  type TEXT NOT NULL,          -- Flight, Hotel, Receipt, Other
  owner TEXT,                  -- Passenger/guest name
  createdAt TEXT NOT NULL      -- Upload timestamp
);
```

## AI Parsing

The app uses Google Gemini 2.0 Flash to extract:
- **Title**: Descriptive title (e.g., "Flight to Mumbai")
- **Date**: Event date/time in ISO 8601 format
- **Type**: Document category (Flight, Hotel, Receipt, Other)
- **Owner**: Person's name (passenger, guest, customer)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | Yes |

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

## Troubleshooting

### "GEMINI_API_KEY is not set" error
- Ensure `.env` file exists in project root
- Verify `EXPO_PUBLIC_GEMINI_API_KEY` is set correctly
- Restart the Expo dev server

### Database migration errors
- The app automatically migrates the database schema
- If issues persist, clear app data and reinstall

### Image not loading
- Ensure file permissions are granted
- Check that the file path is valid

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Expo](https://expo.dev) for the amazing framework
- [Google Gemini](https://ai.google.dev) for AI capabilities
- [React Native](https://reactnative.dev) community
