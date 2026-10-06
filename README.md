# Equipment Field Medic ⛰️🏕️

Equipment Field Medic is a hands-free Wilderness Gear Diagnosis and Repair Assistant built for backpackers, hikers, and mountaineers.

When your gear breaks miles away from civilization, you want to keep your hands on your gear, not scrolling on your phone screen. Equipment Field Medic uses standard camera snapshots to accurately diagnose failures (using open-weight Llama Vision models) and walks you through emergency field repair using Text-to-Speech narration and Hands-Free Voice Commands.

## Key Features

- **Hands-Free Operation**: Say "Next Step", "Previous Step", or "Dim Screen" via Web Speech API built right into the browser.
- **Vision-Assisted Diagnostics**: Harnesses Hugging Face models like `meta-llama/Llama-4-Scout-17B-[16E]-Instruct` (or intelligent fallbacks) to identify broken components and suggest repairs using ONLY the tools currently packed in your Gear Locker.
- **Stealth Battery Saver**: Dims the screen natively with high-contrast OLED black themes to preserve vital battery life when dealing with lengthy field repairs.
- **Offline Reliability Mode**: Complete backend database persistence when online, with graceful memory-based local fallback when disconnected.

## Project Structure

This repository contains two main subsystems:

- `/backend`: Node.js, Express, MongoDB REST API. Integrates with Hugging Face for the Vision Text Generation capabilities, and handles user authentication & saved protocols.
- `/frontend`: Next.js 15+ React application. Fully styled for rugged tactical usage with TailwindCSS and includes the device camera bindings and speech recognition logic.

## Getting Started

### 1. Run the Backend API

Navigate to the `backend` folder and start the server:

```bash
cd backend
npm install
npm start
```

The server will start on `http://localhost:5000`. Set up your `.env` there (MongoDB URI, JWT secret, Hugging Face Token) for full features.

### 2. Run the Frontend App

Navigate to the `frontend` folder and start the development server:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to access the Equipment Field Medic application.

Built for heavy outdoor utility and open-source contribution!
.
