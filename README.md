# Atlas

**Your Smart Travel Companion.**

Atlas solves the chaos of scattered travel documents. Instead of digging through emails, WhatsApp chats, and file managers at the check-in counter, Atlas organizes everything into a single, intelligent timeline.

### The Problem
Travel involves juggling dozens of files—flight tickets, visa grants, hotel confirmations, and activity vouchers—scattered across email threads and messaging apps. Cloud storage folders are unstructured, and searching for "ticket.pdf" on spotty airport Wi-Fi induces unnecessary panic. You need an assistant that knows *what* your documents are and *when* you need them.

### Key Features
*   **Smart Parsing**: Powered by Google Gemini AI, Atlas reads your PDFs and images to extract dates, times, locations, and booking references. It automatically categorizes a confusing PDF into a clean "Flight" or "Hotel" card.
*   **Chronological Timeline**: Visualize your entire journey in a linear flow. Your flight ticket appears right before your hotel check-in, ensuring the relevant document is always at the top of the list without you searching for it.
*   **Trip Management**: Documents are automatically grouped into Trips based on their dates. Whether it's a weekend getaway or a month-long expedition, Atlas bundles them so you can see the big picture at a glance.
*   **Seamless Import**: Built deeply into the OS, you can share files directly from WhatsApp, Gmail, or your browser straight to Atlas. It handles the import, copy, and cleanup in the background.
*   **Identity Storage**: A dedicated, secure vault for Passports, Visas, and IDs. Easily access document numbers and expiry dates for those repetitive immigration forms.
*   **Offline First**: Built for travel. All data is stored locally on your device using SQLite. It works instantly on an airplane or in a remote area with zero loading times and complete privacy.

### Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Create a `.env` file with your Gemini API key:
    ```
    EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
    ```

3.  **Run the App**
    ```bash
    # For Android (Production-like build recommended for native features like Share Intent)
    npx expo run:android
    ```
