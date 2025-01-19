const Team = require('./models/Team')
const User = require('./models/User')
const express = require("express");
const mongoose = require("mongoose");
const FlowMetrics = require("./models/FlowMetrics"); // Path to your Mongoose model
const CodeAnalysis = require("./models/CodeAnalysis");
const jwt = require("jsonwebtoken");
const cors = require("cors"); 


const app = express();
app.use(express.json());
app.use(cors());
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

// Create a new team
app.post("/api/teams", async (req, res) => {
  const { name, creatorId } = req.body;

  if (!name || !creatorId) {
    return res.status(400).json({ message: "Team name and creator username are required." });
  }

  try {
    const newTeam = new Team({ name, creator: creatorId, members: [creatorId] });
    await newTeam.save();
    res.status(201).json({ message: "Team created successfully", team: newTeam });
  } catch (err) {
    res.status(500).json({ message: "Failed to create team", error: err.message });
  }
});

app.post("/api/teams/add", async (req, res) => {
  const { teamName, username, userId } = req.body;

  if (!teamName || !username || !userId) {
    return res.status(400).json({ message: "Team name, username, and user ID are required" });
  }

  try {
    // Find the team
    const team = await Team.findOne({ name: teamName });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the user is the creator of the team
    if (team.creator.toString() !== userId) {
      return res.status(403).json({ message: "Only the creator can add members to the team" });
    }

    // Find the user to be added
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is already a member of the team
    if (team.members.includes(user._id)) {
      return res.status(400).json({ message: "User is already a member of this team" });
    }

    // Add the user to the team
    team.members.push(user._id);
    await team.save();
    res.status(200).json({ message: "User added to the team", team });
  } catch (err) {
    res.status(500).json({ message: "Failed to add user to the team", error: err.message });
  }
});

// Remove a member from a team
app.post("/api/teams/remove", async (req, res) => {
  const { teamName, username, userId } = req.body;

  if (!teamName || !username || !userId) {
    return res.status(400).json({ message: "Team name, username, and user ID are required" });
  }

  try {
    // Find the team
    const team = await Team.findOne({ name: teamName });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the user is the creator of the team
    if (team.creator.toString() !== userId) {
      return res.status(403).json({ message: "Only the creator can remove members from the team" });
    }

    // Find the user to be removed
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the user from the team
    team.members = team.members.filter(memberId => memberId.toString() !== user._id.toString());
    await team.save();
    res.status(200).json({ message: "User removed from the team", team });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove user from the team", error: err.message });
  }
});


// Get team details (including members)
app.get("/api/teams", async (req, res) => {
  const { teamName } = req.body;

  if (!teamName) {
    return res.status(400).json({ message: "Team name is required" });
  }

  try {
    const team = await Team.findOne({ name: teamName }).populate('members', 'username email');
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({ team });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch team", error: err.message });
  }
});

app.post("/api/user-teams", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Find all teams where the user is a member
    const teams = await Team.find({ members: userId }).populate('members', 'username email');

    if (teams.length === 0) {
      return res.status(404).json({ message: "User is not a member of any team" });
    }

    res.status(200).json({ teams });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch teams", error: err.message });
  }
});

app.get('/api/focus-scores', async (req, res) => {
  const { userId } = req.query;

  try {
    // Fetch all records for the given userId
    const userMetrics = await FlowMetrics.find({ userId });

    if (!userMetrics.length) {
      return res.status(404).json({ message: 'No records found for the specified userId.' });
    }

    // Calculate the average focus score
    const totalFocusScore = userMetrics.reduce((sum, metric) => sum + metric.focusScore, 0);
    const averageFocusScore = totalFocusScore / userMetrics.length;

    return res.status(200).json({
      userId,
      averageFocusScore
    });
  } catch (error) {
    console.error('Error fetching focus scores:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/quality-scores', async (req, res) => {
  const { userId } = req.query;

  try {
    // Fetch all records for the given userId
    const userMetrics = await CodeAnalysis.find({ userId });

    console.log('userMetrics:', userMetrics);

    if (!userMetrics.length) {
      return res.status(404).json({ message: 'No records found for the specified userId.' });
    }

    // Initialize variables to calculate the averages
    let totalReadability = 0;
    let totalMaintainability = 0;
    let totalModularity = 0;
    let totalDocumentation = 0;
    let totalErrorHandling = 0;
    let totalDuplication = 0;

    // Loop through the records and sum up each quality attribute
    userMetrics.forEach(metric => {
      totalReadability += metric.quality.readability || 0;
      totalMaintainability += metric.quality.maintainability || 0;
      totalModularity += metric.quality.modularity || 0;
      totalDocumentation += metric.quality.documentation || 0;
      totalErrorHandling += metric.quality.errorHandling || 0;
      totalDuplication += metric.quality.duplication || 0;
    });

    // Calculate the average for each quality attribute
    const avgReadability = totalReadability / userMetrics.length;
    const avgMaintainability = totalMaintainability / userMetrics.length;
    const avgModularity = totalModularity / userMetrics.length;
    const avgDocumentation = totalDocumentation / userMetrics.length;
    const avgErrorHandling = totalErrorHandling / userMetrics.length;
    const avgDuplication = totalDuplication / userMetrics.length;

    // Calculate the final average quality score by averaging the individual averages
    const finalAverageQualityScore = (avgReadability + avgMaintainability + avgModularity + avgDocumentation + avgErrorHandling + avgDuplication) / 6;

    return res.status(200).json({
      userId,
      avgReadability,
      avgMaintainability,
      avgModularity,
      avgDocumentation,
      avgErrorHandling,
      avgDuplication,
      finalAverageQualityScore,
    });
  } catch (error) {
    console.error('Error fetching quality scores:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/error-analysis', async (req, res) => {
  const { userId } = req.query;
  
  try {
    // Create start and end of the current date using moment
    const startDate = moment().startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    // Find all analyses for the user on the current date
    const analyses = await CodeAnalysis.find({
      userId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });

    if (!analyses.length) {
      return res.status(404).json({
        message: 'No analyses found for today.'
      });
    }

    // Initialize variables for error calculations
    let totalTypeErrorRisk = 0;
    let totalReferenceErrorRisk = 0;
    let totalSyntaxErrorRisk = 0;
    let errorTypeCounts = {
      TypeError: 0,
      ReferenceError: 0,
      SyntaxError: 0,
      Unknown: 0
    };

    // Calculate totals and count error types
    analyses.forEach(analysis => {
      totalTypeErrorRisk += analysis.errors.typeErrorRisk || 0;
      totalReferenceErrorRisk += analysis.errors.referenceErrorRisk || 0;
      totalSyntaxErrorRisk += analysis.errors.syntaxErrorRisk || 0;
      
      // Count most likely error types
      const mostLikelyError = analysis.errors.mostLikelyError || 'Unknown';
      errorTypeCounts[mostLikelyError]++;
    });

    // Calculate averages
    const totalAnalyses = analyses.length;
    const response = {
      date: moment().format('YYYY-MM-DD'),
      userId,
      totalAnalyses,
      averageErrors: {
        typeErrorRisk: totalTypeErrorRisk / totalAnalyses,
        referenceErrorRisk: totalReferenceErrorRisk / totalAnalyses,
        syntaxErrorRisk: totalSyntaxErrorRisk / totalAnalyses
      },
      errorTypeDistribution: {
        TypeError: (errorTypeCounts.TypeError / totalAnalyses) * 100,
        ReferenceError: (errorTypeCounts.ReferenceError / totalAnalyses) * 100,
        SyntaxError: (errorTypeCounts.SyntaxError / totalAnalyses) * 100,
        Unknown: (errorTypeCounts.Unknown / totalAnalyses) * 100
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching error analysis:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

app.get('/api/code-languages', async (req, res) => {
  const { userId } = req.query;

  try {
    // Fetch all records for the given userId
    const userMetrics = await CodeAnalysis.find({ userId });

    if (!userMetrics.length) {
      return res.status(404).json({ message: 'No records found for the specified userId.' });
    }

    // Create an object to count the occurrences of each language
    const languageCount = {};

    // Loop through the user metrics and count the occurrences of each language
    userMetrics.forEach(metric => {
      const language = metric.language;
      if (language) {
        if (languageCount[language]) {
          languageCount[language]++;
        } else {
          languageCount[language] = 1;
        }
      }
    });

    // Convert the languageCount object to an array of [language, count] pairs
    const languageArray = Object.entries(languageCount);

    // Sort the languages by the count in descending order
    const sortedLanguages = languageArray.sort((a, b) => b[1] - a[1]);

    // Prepare the response with the top 4 sorted languages
    const topLanguages = sortedLanguages.slice(0, 4).map(([language, count]) => ({
      language,
      usageCount: count
    }));

    return res.status(200).json({
      userId,
      topLanguages,
    });
  } catch (error) {
    console.error('Error fetching code languages:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.post("/api/latest_error_summary", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    // Query the latest document for the userId
    const latestData = await FlowMetrics.findOne(
      { userId: userId },
      null, // No specific fields excluded
      { sort: { timestamp: -1 } } // Sort by timestamp in descending order
    );

    if (!latestData) {
      return res.status(404).json({ message: "No data found for the specified user ID." });
    }

    // Map the result to include the complete errorSummary
    const result = {
      _id: latestData._id,
      timestamp: latestData.timestamp,
      errorSummary: latestData.errorSummary || {}, // Return the complete errorSummary
    };

    // Return the response
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching latest error summary:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});





const moment = require('moment');  // You may need to install moment.js using 'npm install moment'

app.get('/api/session-duration', async (req, res) => {
  const { userId } = req.query;

  try {
    // Get the start and end of today (midnight to now)
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    // Fetch all records for the given userId where the timestamp is within today's range
    const userMetrics = await FlowMetrics.find({
      userId,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!userMetrics.length) {
      return res.status(404).json({ message: 'No records found for today.' });
    }

    // Calculate the total session duration (assuming you are using 'sessionDuration' field or 'focusScore')
    const totalSessionDuration = userMetrics.reduce((sum, metric) => sum + metric.sessionDuration, 0);
    const averageSessionDuration = totalSessionDuration / userMetrics.length;

    return res.status(200).json({
      userId,
      averageSessionDuration
    });
  } catch (error) {
    console.error('Error fetching session durations:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


app.get('/api/productivity-status', async (req, res) => {
  const { userId } = req.query;

  try {
    // Get the start and end of the past week (7 days ago to now)
    const startOfWeek = moment().subtract(7, 'days').startOf('day').toDate();
    const endOfWeek = moment().endOf('day').toDate();

    // Fetch all records for the given userId where the timestamp is within the past week
    const userMetrics = await FlowMetrics.find({
      userId,
      timestamp: { $gte: startOfWeek, $lte: endOfWeek }
    });

    if (!userMetrics.length) {
      return res.status(404).json({ message: 'No records found for the past week.' });
    }

    // Define productivity thresholds (these can be adjusted)
    const { high, medium, low } = {high:80,medium:60,low:40};

 

    // Create a map to store the counts for each status
    const statusCounts = {
      "Flow State 🚀": 0,
      "In The Zone 💪": 0,
      "Focused 🎯": 0,
      "Getting Started 🌱": 0,
    };

    // Loop through the records and categorize each based on the focus score
    userMetrics.forEach(metric => {
      let status;
      if (metric.focusScore >= high) {
        status = "Flow State 🚀";
      } else if (metric.focusScore >= medium) {
        status = "In The Zone 💪";
      } else if (metric.focusScore >= low) {
        status = "Focused 🎯";
      } else {
        status = "Getting Started 🌱";
      }

      // Increment the corresponding status count
      statusCounts[status]++;
    });

    // Find the status with the highest count
    const mostFrequentStatus = Object.keys(statusCounts).reduce((maxStatus, status) => {
      return statusCounts[status] > statusCounts[maxStatus] ? status : maxStatus;
    });

    return res.status(200).json({
      userId,
      mostFrequentStatus,
      statusCounts,
    });
  } catch (error) {
    console.error('Error fetching productivity status:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
