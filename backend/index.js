const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Add this
const authRoutes = require('./routes/authRoutes');


const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your React app's origin
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
// Add to your routes


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});