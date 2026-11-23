# RecipEase

## 1. Overview
RecipEase is an AI-powered smart kitchen assistant mobile application that helps users track recipes, substitute missing ingredients dynamically, scale portions, and reduce food waste by discovering meals based on available pantry ingredients. This project is developed for the Mobile Application Development final project.

## 2. Tech Stack & Architecture
- **Framework:** React Native (Expo SDK 58 / `expo@latest`)
- **Runtime:** React 19.3.0 & React Native 0.88.1
- **Language:** JavaScript / ES6+
- **Navigation:** React Navigation v7 (`@react-navigation/native`, `@react-navigation/native-stack`)
- **State Management:** React Context API (`RecipeContext`) & Hooks (`useState`, `useMemo`, `useContext`)
- **Tunneling:** `@expo/ngrok` for cross-network mobile development
- **Platforms:** Android, iOS, and Web

## 3. Key Features
- **Hands-Free Voice-Controlled Cooking Assistant:** Step-by-step guided cooking mode with real-time voice recognition. Users can advance steps hands-free while their hands are messy using voice triggers like *"geç"*, *"sıradaki"*, *"sonraki"*, *"geri"*, or listen to steps aloud (*"adımı oku"*).
- **Culinary Stage Visualizer:** Every preparation step is visually illustrated with authentic stage imagery, stage badges (e.g. *Kneading & Rolling*, *Sautéing*, *Oven Baking*), and Pro-Chef culinary tips.
- **Recipe Discovery & Live Bilingual Search:** Real-time search across titles, cuisines, and all ingredients with Turkish-English synonym mapping.
- **Dynamic Portion Scaling:** Automatically recalculate ingredient amounts and calories dynamically when adjusting serving portions (`-` / `+`).
- **Interactive Smart Substitutions:** One-tap smart alternative recommendations for ingredients (e.g. Greek yogurt for heavy cream, tamari for soy sauce, maple syrup for honey) with instant revert option.
- **AI Vision Scanner & Pantry Matching (Simulation):** Simulated pantry photo scanner that identifies available ingredients and matches them to recipes sorted by match percentage.
- **Favorites System:** Save and manage favorite recipes with one-tap heart buttons.
- **Universal Unit Localization:** Interactive toggle between Metric (g, ml, kg) and Imperial (oz, lbs, cups) measurement systems across all screens.

## 4. UI Screens
1. **Home Screen:** Greeting, search bar, cuisine category tabs, featured recipe cards, and heart toggles.
2. **Recipe Detail Screen:** Hero image, interactive portion selector, dynamic calorie counter, smart substitution triggers, dynamic measurement units, and step-by-step checklist.
3. **Favorites Screen:** Saved recipes list with empty state and direct navigation to details.
4. **AI Scan Screen:** Pantry camera simulation with detected ingredient tags and ranked matching recipes.
5. **Profile Screen:** User profile info, interactive Metric/Imperial system switch, language, and dietary preferences.

## 5. Setup & Run Instructions
1. Clone the repository: 
   ```bash
   git clone https://github.com/DilaraMUMCU/RecipEase.git
   ```
2. Navigate to the project directory:
   ```bash
   cd RecipEase/RecipEase
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   - **For Mobile (Expo Go on different Wi-Fi / networks):**
     ```bash
     npx expo start --tunnel ngrok -c
     # or simply:
     npm run tunnel
     ```
   - **For Mobile (same Wi-Fi network):**
     ```bash
     npx expo start -c
     ```
   - **For Web Browser:**
     ```bash
     npm run web
     ```
5. Scan the QR code with the **Expo Go** app on your physical device, or run on an emulator/browser.

## 6. Screenshots
*(Screenshots will be added here upon UI completion)*

## 7. Commit Count
*(To be updated before final submission)*
