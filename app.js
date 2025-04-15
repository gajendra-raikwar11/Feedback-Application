// const express = require("express");
// const app = express();
// const path = require("path");
// const cookieParser = require('cookie-parser');
// const session = require("express-session");
// const flash = require('connect-flash');
// const mongoose = require('mongoose'); // Added mongoose import
// require("dotenv").config();

// // Import routes
// const indexRouter = require("./routes/indexRouter");
// const adminDashboard = require("./routes/adminRouter");
// const facultyRouter = require("./routes/facultyRouter");
// const studentRouter=require("./routes/studentRouter");

// // View engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// // Session configuration - using SESSION_SECRET from .env
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'fallback-secret-key',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { 
//     secure: process.env.NODE_ENV === 'production', // Secure in production only
//     maxAge: 3600000 // 1 hour session expiry
//   }  
// }));

// // Flash messages
// app.use(flash());

// // Make flash messages available in all views
// app.use((req, res, next) => {
//   res.locals.messages = req.flash();
//   next();
// });

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URL, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Routes
// app.use("/", indexRouter);
// app.use("/student",studentRouter)
// app.use("/admin", adminDashboard);
// app.use("/faculty", facultyRouter);

// // Error handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });

// // Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}...`);
// });
const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require('cookie-parser');
const session = require("express-session");
const MongoStore = require('connect-mongo'); // Add this import
const flash = require('connect-flash');
const mongoose = require('mongoose');
require("dotenv").config();

// Import routes
const indexRouter = require("./routes/indexRouter");
const adminDashboard = require("./routes/adminRouter");
const facultyRouter = require("./routes/facultyRouter");
const studentRouter = require("./routes/studentRouter");

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB first
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Session configuration with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false, // Changed to false to save only when modified
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL, // Use the same MongoDB connection
    ttl: 24 * 60 * 60, // Store sessions for 24 hours (in seconds)
    autoRemove: 'native' // Use MongoDB's TTL index for cleanup
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Secure in production only
    maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  }  
}));

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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});