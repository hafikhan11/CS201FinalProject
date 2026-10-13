# DKU GeoGuesser

## Requirements

Install these once:

| | macOS | Windows |
|---|---|---|
| **Node.js** (LTS) | https://nodejs.org | https://nodejs.org |
| **Java JDK 22 or newer** (e.g. Temurin 25) | https://adoptium.net | https://adoptium.net |

Check they're installed by running `node -v` and `java -version` in a terminal. The Java version must be 22 or higher.

## Run on macOS

1. Open **Terminal** and go to the project folder:
   ```bash
   cd path/to/DKUGuesser
   ```
2. First time only, install dependencies:
   ```bash
   npm run install:all
   ```
3. Start the game:
   ```bash
   npm run dev
   ```
4. Open **http://localhost:5173** in your browser.

## Run on Windows

1. Open the project folder in File Explorer, click the address bar, type `cmd` and press **Enter**. A Command Prompt opens in that folder.
2. First time only, install dependencies:
   ```
   npm run install:all
   ```
3. Start the game:
   ```
   npm run dev
   ```
4. Open **http://localhost:5173** in your browser.

## While it's running

| Page | Address |
|---|---|
| Game | http://localhost:5173 |
| Admin panel (add, edit, delete rounds) | http://localhost:5173/admin |

To stop the game, press **Ctrl + C** in the terminal window.

## Troubleshooting

- **`java` is not recognized / version is below 22**: install a newer JDK from https://adoptium.net, then open a new terminal window.
- **`npm` is not recognized**: install Node.js from https://nodejs.org, then open a new terminal window.
- **Port already in use**: another copy of the game is still running. Close that terminal window, or press Ctrl + C in it, then run `npm run dev` again.
- **"No rounds available"**: add rounds in the admin panel.
