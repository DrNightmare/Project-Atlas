# Project Atlas - AI-Powered Travel Document Manager

A React Native mobile application built with Expo that stores travel documents locally and extracts metadata using the Google Gemini 2.0 Flash API.

## Features
- Document upload supporting images and PDFs.
- Automatic AI parsing of title, date, type, and owner.
- Local storage using SQLite and Expo FileSystem.
- Full‑screen document viewer with pinch‑to‑zoom and pan.
- Multi‑select delete and reprocess capabilities.
- Owner extraction and context‑aware date display.

## Tech Stack
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file‑based routing)
- **Database**: SQLite via expo-sqlite
- **File Storage**: Expo FileSystem
- **AI**: Google Gemini 2.0 Flash API
- **Gestures**: react-native-gesture-handler & react-native-reanimated
- **Date Formatting**: date-fns

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Google Gemini API key (see https://aistudio.google.com/app/apikey)

## Setup
1. Clone the repository
   ```bash
   git clone <repository-url>
   cd "Project Atlas"
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root with your API key
   ```bash
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server
   ```bash
   npx expo start
   ```
5. Run on a device or emulator (press `a` for Android, `i` for iOS, or scan the QR code with Expo Go).

## Project Structure
```
Project Atlas/
├── app/                     # Expo Router pages
│   ├── (tabs)/
│   │   └── index.tsx       # Main timeline screen
│   └── document-view.tsx   # Full‑screen viewer
├── src/
│   ├── components/
│   │   └── DocumentCard.tsx
│   └── services/
│       ├── database.ts    # SQLite operations
│       ├── fileStorage.ts # File system utilities
│       └── geminiParser.ts# AI parsing logic
└── .env                    # API keys (ignored by git)
```

## Usage
### Adding Documents
1. Tap the **Add** button in the header.
2. Select an image or PDF.
3. The file is saved locally and a placeholder entry appears immediately.
4. AI parsing runs in the background; the entry updates when metadata is available.

### Viewing Documents
- Tap a document card to open the full‑screen viewer.
- Pinch to zoom and drag to pan.
- Double‑tap toggles zoom level.

### Managing Documents
- Long‑press a card to enter selection mode.
- Tap additional cards to select multiple items.
- Use **Delete** to remove selected documents.
- Use **Reprocess** to run AI parsing again on selected documents.

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
`processing` is `0` for idle and `1` while parsing is in progress.

## AI Parsing
The Gemini API extracts:
- **Title** – descriptive document title.
- **Date** – event date/time in ISO‑8601 format.
- **Type** – category such as Flight, Hotel, Receipt, or Other.
- **Owner** – passenger or guest name.

## Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | Yes |

## Development
### Testing
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
- **API key not set**: Verify `.env` contains `EXPO_PUBLIC_GEMINI_API_KEY` and restart the dev server.
- **Database migration errors**: The app performs migrations automatically; if problems persist, clear app data and reinstall.
- **Image not loading**: Ensure file permissions are granted and the file path is valid.

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add feature"`).
4. Push the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## License
This project is licensed under the MIT License.

## Acknowledgments
- Expo for the development framework.
- Google Gemini for AI capabilities.
- The React Native community.
