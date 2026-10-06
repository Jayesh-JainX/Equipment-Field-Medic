# Equipment Field Medic — Backend API

This is the backend server for the Equipment Field Medic application, built with Node.js, Express, and MongoDB.

## Features

- **MongoDB Models (Mongoose)**: Manages `User`, `GearItem`, and `RepairLog` schemas.
- **Graceful Offline Fallback**: If the MongoDB URI is unreachable or missing, the server automatically defaults to an in-memory cache mode to remain operational.
- **JWT Authentication**: Secure user registration and login workflows (`/api/auth`).
- **Vision & Text AI Engine**: Uses `@huggingface/inference` and the `.chatCompletion` API to analyze gear breakage (`/api/diagnose`). It can take images + text and utilizes advanced Instruct models (like `Llama-4-Scout` or `Llama-3.2-11B-Vision-Instruct`). It strictly enforces a structured JSON response schema mapping the repair protocol.
- **Intelligent Fallback Engine**: If no `HF_TOKEN` is provided, a comprehensive algorithmic vision fallback matches the damage explicitly via logic parsing to supply rich step-by-step guidance.

## Quick Start Configuration

Add a `.env` file at the root of `/backend`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/equipment_field_medic
JWT_SECRET=your_super_secret_jwt_key
HF_TOKEN=hf_your_huggingface_api_token
HF_MODEL=meta-llama/Llama-4-Scout-17B-16E-Instruct
```

## Running the Server

```bash
npm install
# Start production / persistent server
npm start
# Start development watcher
npm run dev
```

The node server runs efficiently at `http://localhost:5000`.
