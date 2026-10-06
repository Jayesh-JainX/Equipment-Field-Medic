const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Equipment Field Medic Backend',
    hfModel: process.env.HF_MODEL || 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected (using fallback mode)',
    timestamp: new Date().toISOString()
  });
});

// Root Route for Vercel deployment health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Equipment Field Medic Backend API',
    healthCheck: '/api/health'
  });
});

// Register Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/diagnose', require('./routes/diagnose'));
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/gear', require('./routes/gear'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Database Connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(`[DATABASE] Connected to MongoDB database successfully`);
  })
  .catch((err) => {
    console.warn(`[DATABASE] MongoDB connection warning: ${err.message}. App will operate with in-memory fallback.`);
  });

// Start Server locally when executed directly (Vercel serverless imports app module directly)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` 🛠️ EQUIPMENT FIELD MEDIC BACKEND SERVER RUNNING`);
    console.log(` 📡 Port: http://localhost:${PORT}`);
    console.log(` 🤖 HuggingFace Model: ${process.env.HF_MODEL || "meta-llama/Llama-4-Scout-17B-16E-Instruct"}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
