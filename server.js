const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dual-mode DB Connection: Cloud Atlas + Resilient Fallback
if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('<username>')) {
    mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
        .then(() => console.log('⚡ MongoDB Atlas Cloud Connected Successfully'))
        .catch(err => console.log('⚠️ MongoDB Connection Note (Running In-Memory Fallback):', err.message));
} else {
    console.log('ℹ️ Running in Memory-Log Fallback Mode (Ready for Atlas URI)');
}

app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Autonomous Green Cloud Platform running at: http://localhost:${PORT}`);
});