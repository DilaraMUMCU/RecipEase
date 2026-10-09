# RecipEase

## 1. Overview
RecipEase is an AI-powered smart kitchen assistant that helps users track recipes, substitute missing ingredients, and reduce food waste by offering meals based on the ingredients they currently have. This project is a Minimum Viable Product (MVP) developed for the Mobile Application Development final project.

## 2. Tech Stack & Architecture
- **Framework:** React Native (Expo)
- **Language:** JavaScript / ES6
- **State Management:** React Hooks (`useState`, `useEffect`)
- **Data Persistence:** AsyncStorage / Local JSON storage
- **Navigation:** React Navigation
- **Architecture:** Component-based modular UI

## 3. Key Features
- **Recipe Discovery:** Browse and search for various recipes.
- **Smart Substitution Engine (Simulation):** Get alternative ingredient suggestions for missing items.
- **Dynamic Portion Scaling:** Automatically recalculate ingredient amounts based on serving size.
- **Inventory-Based Suggestions:** Input available ingredients to discover matching recipes (simulating the AI image processing feature).
- **Settings & Localization:** Toggle between Metric and Imperial measurement systems.

## 4. UI Screens
1. **Home Screen:** Recipe lists, categories, and search functionality.
2. **Recipe Detail Screen:** Ingredients list, step-by-step instructions, and portion adjustment.
3. **Smart Inventory Screen:** User input for available ingredients to get recipe matches.
4. **Profile & Settings:** Measurement preferences and app settings.

## 5. Setup & Run Instructions
1. Clone the repository: 
   ```bash
   git clone https://github.com/DilaraMUMCU/RecipEase.git
   ```
2. Navigate to the project directory:
   ```bash
   cd RecipEase
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npx expo start
   ```
5. Scan the QR code with the Expo Go app on your physical device, or run it on an iOS/Android emulator.

## 6. Screenshots
*(Screenshots will be added here upon UI completion)*

## 7. Commit Count
*(To be updated before the final submission)*