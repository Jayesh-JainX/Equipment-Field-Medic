# Equipment Field Medic — Frontend Client

The frontend interface for Field Medic, built to be a robust, tactical, hands-free field companion app for wilderness survival.

## Tech Stack

- **Framework**: Next.js (App Router) + React
- **Styling**: Tailwind CSS v4 (inline theme definitions)
- **Icons**: Lucide React
- **Browser APIs**: `MediaDevices` (Camera capture), `SpeechSynthesis` (TTS Dictation), and `webkitSpeechRecognition` (Hands-free commands).

## Core Capabilities

1. **CameraMedic Component**: Captures `.jpg` or `.png` feeds right from mobile or desktop environment cameras to pass to the Vision LLM via the REST API.
2. **VoiceRepairAssistant Component**: A highly resilient accessibility engine that reads repair steps aloud via the SpeechSynthesis API. It constantly listens for "Next Step", "Previous Step", or "Dim Screen" via SpeechRecognition to advance states without touch interaction.
3. **GearLocker**: A digital toolkit tracking specific supplies (like Duct Tape or Super Glue). These supplies are appended to the AI prompt limiting the generation to ONLY what you actually have on your person.
4. **Stealth Battery Dim**: Strips colors, kills background images, and converts the theme to a low brightness AMOLED true-black to drastically minimize device power drainage during freezing conditions.

## Running the Frontend Client

```bash
npm install
npm run dev
```

Explore the mobile-responsive interface out-of-the-box at `http://localhost:3000`.
