const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo"); // Add this import
const flash = require("connect-flash");
const mongoose = require("mongoose");
require("dotenv").config();
const { craftEnhancedPrompts, parseAndStructureResponse } = require("./shared/promptUtils");
const axios = require("axios");

// Import routes
const indexRouter = require("./routes/indexRouter");
const adminDashboard = require("./routes/adminRouter");
const facultyRouter = require("./routes/facultyRouter");
const studentRouter = require("./routes/studentRouter");

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Serve static files from public and shared directories
app.use(express.static(path.join(__dirname, "public")));
app.use("/shared", express.static(path.join(__dirname, "shared")));

// Connect to MongoDB first
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Session configuration with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false, // Changed to false to save only when modified
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL, // Use the same MongoDB connection
      ttl: 24 * 60 * 60, // Store sessions for 24 hours (in seconds)
      autoRemove: "native", // Use MongoDB's TTL index for cleanup
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // Secure in production only
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
  })
);

// Flash messages
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Routes
app.use("/", indexRouter);
app.use("/student", studentRouter);
app.use("/admin", adminDashboard);
app.use("/faculty", facultyRouter);

app.post("/api/feedback-questions", async (req, res) => {
  const {
    topic,
    audience,
    numQuestions,
    questionDepth,
    goal,
    questionType,
    mcqOptions,
    model,
  } = req.body;

  if (!topic) {
    return res.status(400).json({
      error: "Topic is required",
      message: "Please provide a topic for feedback questions",
    });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Create enhanced prompt using the shared utility
    const prompt = craftEnhancedPrompts(topic, {
      audience,
      numQuestions: numQuestions || 5,
      questionDepth,
      goal,
      questionType,
      mcqOptions,
    });

    // Select Gemini model version
    const selectedModel = model || "gemini-1.5-pro";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await axios.post(
      geminiUrl,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
          topP: 0.95,
          topK: 40,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract text from Gemini response
    const rawContent = response.data.candidates[0].content.parts[0].text;
    const structuredQuestions = parseAndStructureResponse(
      rawContent,
      numQuestions || 5
    );

    // Add metadata to help client understand the response
    const result = {
      ...structuredQuestions,
      meta: {
        topic,
        generatedAt: new Date().toISOString(),
        model: selectedModel,
        requestParams: {
          audience,
          numQuestions,
          questionDepth,
          goal,
          questionType,
        },
      },
    };

    return res.json(result);
  } catch (error) {
    console.error(
      "Error generating feedback questions:",
      error.response ? error.response.data : error.message
    );

    // Provide more helpful error information
    const errorMessage = error.response
      ? `API Error: ${JSON.stringify(error.response.data)}`
      : `Server Error: ${error.message}`;

    return res.status(500).json({
      error: "Failed to generate feedback questions",
      message: errorMessage,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }
});
// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
