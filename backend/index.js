const User = require('./models/User')
const express = require("express");
const mongoose = require("mongoose");
const FlowMetrics = require("./models/FlowMetrics"); // Path to your Mongoose model
const CodeAnalysis = require("./models/CodeAnalysis");
const jwt = require("jsonwebtoken");


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

app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "User with this email or username already exists" 
      });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      `$2b!D@G%yJk9Lq1P*sWz8^3RfH#nT0UvX&CxA7MEo`,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Signin Route
app.post("/api/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      `$2b!D@G%yJk9Lq1P*sWz8^3RfH#nT0UvX&CxA7MEo`,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: "Login successful",
      token, // Send the token
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Error during signin:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Modified verify endpoint to use token-based authentication
app.post("/api/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token,`$2b!D@G%yJk9Lq1P*sWz8^3RfH#nT0UvX&CxA7MEo`);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Token verified",
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(401).json({ message: "Invalid token" });
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
