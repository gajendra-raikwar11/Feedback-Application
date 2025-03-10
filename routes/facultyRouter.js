// facultyRouter.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { Faculty, validateFacultyLogin } = require("../models/facultySchema");

// Path to the JSON file with initial faculty data
const FACULTY_JSON_PATH = path.join(__dirname, "../data/facultyDataFile.json");

// Helper function to read faculty data from JSON file
const readFacultyJSON = () => {
  try {
    const data = fs.readFileSync(FACULTY_JSON_PATH, "utf8");
    // Make sure we're parsing the JSON correctly and it returns an array
    const parsedData = JSON.parse(data);
    
    // Check if parsedData is an array, if not, return an empty array
    if (!Array.isArray(parsedData)) {
      console.error("Error: Faculty JSON data is not an array:", parsedData);
      return [];
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error reading faculty JSON file:", error);
    // Create the file with an empty array if it doesn't exist or has invalid JSON
    try {
      fs.writeFileSync(FACULTY_JSON_PATH, JSON.stringify([], null, 2), "utf8");
    } catch (writeError) {
      console.error("Error creating empty faculty JSON file:", writeError);
    }
    return [];
  }
};

// Helper function to write faculty data to JSON file
const writeFacultyJSON = (data) => {
  try {
    // Ensure data is an array before writing
    const dataToWrite = Array.isArray(data) ? data : [];
    fs.writeFileSync(FACULTY_JSON_PATH, JSON.stringify(dataToWrite, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing to faculty JSON file:", error);
    return false;
  }
};

// Render faculty login page
router.get("/login", (req, res) => {
  res.render("facultyLogin", { messages: req.flash ? req.flash() : {} });
});

// Handle faculty login form submission
router.post("/login", async (req, res) => {
  const { email, idNumber, password, rememberMe, deviceInfo } = req.body;
  
  // Determine which login method was used (email or ID)
  const loginIdentifier = email || idNumber;
  
  // Validate that we have a login identifier and password
  if (!loginIdentifier) {
    req.flash && req.flash("error", "Email or ID number is required");
    return res.redirect("/faculty/login");
  }
  
  if (!password) {
    req.flash && req.flash("error", "Password is required");
    return res.redirect("/faculty/login");
  }

  try {
    // First, try to find the faculty in MongoDB
    let faculty = await Faculty.findOne({
      $or: [{ email: loginIdentifier }, { empId: loginIdentifier }],
    });

    // If faculty not found in MongoDB, check the JSON file
    if (!faculty) {
      const facultyData = readFacultyJSON();
      
      // Debug output to check what facultyData contains
      console.log("Faculty data from JSON:", facultyData);
      
      // Make sure facultyData is an array before using find
      if (!Array.isArray(facultyData)) {
        console.error("Error: facultyData is not an array after reading JSON");
        req.flash && req.flash("error", "System error. Please contact administrator.");
        return res.redirect("/faculty/login");
      }

      const jsonFaculty = facultyData.find(
        (f) => f.email === loginIdentifier || f.empId === loginIdentifier
      );

      // If found in JSON, create a new entry in MongoDB
      if (jsonFaculty) {
        // Check password from JSON (assuming it's plaintext in JSON)
        if (jsonFaculty.password !== password) {
          req.flash && req.flash("error", "Invalid credentials");
          return res.redirect("/faculty/login");
        }

        // Create new faculty in MongoDB
        faculty = new Faculty({
          empId: jsonFaculty.empId,
          name: jsonFaculty.name,
          department: jsonFaculty.department,
          email: jsonFaculty.email,
          phone: jsonFaculty.phone,
          subjects: jsonFaculty.subjects,
          password: password, // This will be hashed by the pre-save hook
        });

        await faculty.save();

        // Set session data if using sessions
        if (req.session) {
          req.session.faculty = {
            id: faculty._id,
            empId: faculty.empId,
            name: faculty.name,
            email: faculty.email,
            department: faculty.department
          };
          
          if (rememberMe && req.session.cookie) {
            // Set a longer cookie expiration if "Remember Me" is checked
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          }
        }

        // Log device info if provided
        if (deviceInfo) {
          console.log(`Login successful for ${faculty.name} (${faculty.empId}) from device: ${deviceInfo}`);
        }

        // Redirect to faculty dashboard
        return res.redirect("/faculty/dashboard");
      } else {
        req.flash && req.flash("error", "Faculty not found");
        return res.redirect("/faculty/login");
      }
    } else {
      // Faculty found in MongoDB, validate password
      const isMatch = await bcrypt.compare(password, faculty.password);
      if (!isMatch) {
        req.flash && req.flash("error", "Invalid credentials");
        return res.redirect("/faculty/login");
      }

      // Set session data if using sessions
      if (req.session) {
        req.session.faculty = {
          id: faculty._id,
          empId: faculty.empId,
          name: faculty.name,
          email: faculty.email,
          department: faculty.department
        };
        
        if (rememberMe && req.session.cookie) {
          // Set a longer cookie expiration if "Remember Me" is checked
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }
      }

      // Log device info if provided
      if (deviceInfo) {
        console.log(`Login successful for ${faculty.name} (${faculty.empId}) from device: ${deviceInfo}`);
      }

      // Redirect to faculty dashboard
      return res.redirect("/faculty/dashboard");
    }
  } catch (error) {
    console.error("Login error:", error);
    req.flash && req.flash("error", "Server error. Please try again later.");
    return res.redirect("/faculty/login");
  }
});

// Other routes remain the same...

// Dummy dashboard route
router.get("/dashboard", (req, res) => {
  // Check if faculty is logged in
  if (!req.session || !req.session.faculty) {
    return res.redirect("/faculty/login");
  }
  
  // Render dashboard with faculty info
  res.render("facultyDashboard", {
    faculty: req.session.faculty
  });
});

// Logout route
router.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect("/faculty/login");
    });
  } else {
    res.redirect("/faculty/login");
  }
});

module.exports = router;