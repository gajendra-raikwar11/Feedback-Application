// facultyRouter.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { Faculty, validateFacultyLogin } = require("../models/facultySchema");
const { FeedbackForm, validateFeedbackForm } = require('../models/feedbackForm');
const { Student, validateStudent } = require("../models/studentSchema");

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
      $or: [{ email: loginIdentifier }, { idNumber: loginIdentifier }],
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
        (f) => f.email === loginIdentifier || f.idNumber === loginIdentifier
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
          idNumber: jsonFaculty.idNumber,
          name: jsonFaculty.name,
          branch: jsonFaculty.branch,
          email: jsonFaculty.email,
          subjects: jsonFaculty.subjects,
          sections: jsonFaculty.sections,
          feedbackForms: jsonFaculty.feedbackForms || [],
          role: jsonFaculty.role,
          password: password, // This will be hashed by the pre-save hook
        });

        await faculty.save();

        // Set session data if using sessions
        if (req.session) {
          req.session.faculty = {
            id: faculty._id,
            idNumber: faculty.idNumber,
            name: faculty.name,
            email: faculty.email,
            branch: faculty.branch,
          };
          
          if (rememberMe && req.session.cookie) {
            // Set a longer cookie expiration if "Remember Me" is checked
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          }
        }

        // Log device info if provided
        if (deviceInfo) {
          console.log(`Login successful for ${faculty.name} (${faculty.idNumber}) from device: ${deviceInfo}`);
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
          idNumber: faculty.idNumber,
          name: faculty.name,
          email: faculty.email,
          branch: faculty.branch,
        };
        
        if (rememberMe && req.session.cookie) {
          // Set a longer cookie expiration if "Remember Me" is checked
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }
      }

      // Log device info if provided
      if (deviceInfo) {
        console.log(`Login successful for ${faculty.name} (${faculty.idNumber}) from device: ${deviceInfo}`);
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
// router.get("/dashboard", (req, res) => {
//   // Check if faculty is logged in
//   if (!req.session || !req.session.faculty) {
//     return res.redirect("/faculty/login");
//   }
  
//   // Render dashboard with faculty info
//   res.render("facultyDashboard", {
//     faculty: req.session.faculty
//   });
// });

router.get("/dashboard", async (req, res) => {
  try {
    // Check if faculty is logged in
    if (!req.session || !req.session.faculty) {
      return res.redirect("/faculty/login");
    }
    
    const facultyId = req.session.faculty._id;
    const faculty = req.session.faculty;
    
    // Find all forms where this faculty is assigned
    const assignedForms = await FeedbackForm.find({
      facultyAssigned: facultyId
    }).select('title formType sectionsAssigned deadline semester status');
    
    // Get unique sections from all forms assigned to this faculty
    const facultySections = [...new Set(
      assignedForms.flatMap(form => form.sectionsAssigned)
    )];
    
    // Find all students in these sections
    const sectionStudents = await Student.find({
      section: { $in: facultySections }
    }).select('name enrollmentNumber email branch section semester feedbackGiven');
    
    // For each student, check if they have submitted feedback for forms assigned to this faculty
    const studentsWithFeedbackStatus = await Promise.all(
      sectionStudents.map(async (student) => {
        // Check each form if student has given feedback
        const studentFeedbackStatus = await Promise.all(
          assignedForms.map(async (form) => {
            // Check if student's section is in this form's assigned sections
            if (!form.sectionsAssigned.includes(student.section)) {
              return { formId: form._id, submitted: false };
            }
            
            const hasSubmitted = student.feedbackGiven.some(
              feedbackId => feedbackId.toString() === form._id.toString()
            );
            
            return { formId: form._id, submitted: hasSubmitted };
          })
        );
        
        // Calculate attendance percentage (mock data - in a real app, fetch from attendance database)
        // For demo purposes, generate a random attendance between 55% and 95%
        const attendance = Math.floor(Math.random() * (95 - 55 + 1) + 55);
        
        return {
          id: student._id,
          name: student.name,
          rollNumber: student.enrollmentNumber,
          section: student.section,
          semester: student.semester,
          email: student.email,
          branch: student.branch,
          feedbackStatus: studentFeedbackStatus,
          // Check if student has submitted feedback for at least one form
          submitted: studentFeedbackStatus.some(status => status.submitted),
          attendance: attendance
        };
      })
    );
    
    // Get feedback analytics (mock data - in a real app, fetch from database)
    // This should come from actual feedback responses in a production app
    const feedbackAnalytics = {
      all: {
        ratings: {
          'Course Content': 4.2,
          'Teaching Method': 3.9,
          'Faculty Engagement': 4.5,
          'Learning Resources': 3.7,
          'Assessment Methods': 4.0
        },
        categories: {
          'Excellent': 30,
          'Good': 40,
          'Average': 20,
          'Poor': 10
        }
      },
      // In a real app, this would be populated from the database
      students: {},
      attendance: {
        excellent: {
          ratings: {
            'Course Content': 4.6,
            'Teaching Method': 4.3,
            'Faculty Engagement': 4.7,
            'Learning Resources': 4.0,
            'Assessment Methods': 4.2
          },
          categories: {
            'Excellent': 45,
            'Good': 40,
            'Average': 10,
            'Poor': 5
          }
        },
        good: {
          ratings: {
            'Course Content': 4.3,
            'Teaching Method': 4.0,
            'Faculty Engagement': 4.5,
            'Learning Resources': 3.8,
            'Assessment Methods': 4.0
          },
          categories: {
            'Excellent': 35,
            'Good': 45,
            'Average': 15,
            'Poor': 5
          }
        },
        average: {
          ratings: {
            'Course Content': 4.0,
            'Teaching Method': 3.7,
            'Faculty Engagement': 4.2,
            'Learning Resources': 3.5,
            'Assessment Methods': 3.7
          },
          categories: {
            'Excellent': 25,
            'Good': 40,
            'Average': 25,
            'Poor': 10
          }
        },
        poor: {
          ratings: {
            'Course Content': 3.5,
            'Teaching Method': 3.3,
            'Faculty Engagement': 3.8,
            'Learning Resources': 3.0,
            'Assessment Methods': 3.2
          },
          categories: {
            'Excellent': 15,
            'Good': 35,
            'Average': 35,
            'Poor': 15
          }
        }
      }
    };
    
    // In a real application, fetch actual feedback data for each student
    // For now, mock data for students who have submitted feedback
    studentsWithFeedbackStatus.forEach(student => {
      if (student.submitted) {
        feedbackAnalytics.students[student.id] = {
          ratings: {
            'Course Content': (Math.random() * (4.8 - 3.5) + 3.5).toFixed(1),
            'Teaching Method': (Math.random() * (4.5 - 3.3) + 3.3).toFixed(1),
            'Faculty Engagement': (Math.random() * (4.9 - 3.7) + 3.7).toFixed(1),
            'Learning Resources': (Math.random() * (4.2 - 3.0) + 3.0).toFixed(1),
            'Assessment Methods': (Math.random() * (4.3 - 3.2) + 3.2).toFixed(1)
          },
          categories: {
            'Excellent': Math.floor(Math.random() * (50 - 15) + 15),
            'Good': Math.floor(Math.random() * (50 - 15) + 15),
            'Average': Math.floor(Math.random() * (30 - 5) + 5),
            'Poor': Math.floor(Math.random() * (20 - 0) + 0)
          }
        };
      }
    });
    
    // Render dashboard with all data
    res.render("facultyDashboard", {
      faculty: faculty,
      students: studentsWithFeedbackStatus,
      forms: assignedForms,
      feedbackData: JSON.stringify(feedbackAnalytics)
    });
    
  } catch (error) {
    console.error("Error in faculty dashboard:", error);
    res.status(500).render("error", { 
      message: "Error loading dashboard", 
      error: error 
    });
  }
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


router.get('/students', (req, res) => {
  // Just render the static HTML page

 res.render("faculty-students");
});

module.exports = router;