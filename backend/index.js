const express = require("express");
const mongoose = require("mongoose");
const FlowMetrics = require("./models/FlowMetrics"); // Path to your Mongoose model
const CodeAnalysis = require("./models/CodeAnalysis");

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://mangarajanmol666:test123@cluster0.yq1bt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API endpoint to save session data
app.post("/api/save-session", async (req, res) => {
  try {
    const sessionData = req.body; // Data sent from the frontend
    const flowMetrics = new FlowMetrics(sessionData); // Create a new document
    const savedSession = await flowMetrics.save(); // Save to MongoDB
    res.status(201).json({ message: "Session saved", sessionId: savedSession._id });
  } catch (err) {
    console.error("Error saving session data:", err);
    res.status(500).json({ message: "Failed to save session data", error: err.message });
  }
});

// In your Express route handler
app.post('/api/analysis', async (req, res) => {
  console.log('Received request body:', req.body);
  
  try {
    const codeAnalysis = new CodeAnalysis(req.body);
    
    // Detailed validation
    const validationError = codeAnalysis.validateSync();
    if (validationError) {
      console.log('Validation error details:', validationError.errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.keys(validationError.errors).map(key => ({
          field: key,
          message: validationError.errors[key].message
        }))
      });
    }
    
    const savedAnalysis = await codeAnalysis.save();
    res.json(savedAnalysis);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message,
      details: error.errors || {}
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
