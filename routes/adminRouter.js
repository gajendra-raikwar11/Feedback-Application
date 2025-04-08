const express = require('express');
const router = express.Router();

const { adminModel } = require("../models/adminSchema");
const validateAdmin = require("../middlewares/adminValidate");
const sendOTPByEmail = require('../config/NodeMailer');
const flash = require("express-flash");
const { Faculty, validateFaculty, validateFacultyLogin } = require("../models/facultySchema");
const { Student, validateStudent } = require("../models/studentSchema");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const { FeedbackForm, validateFeedbackForm } = require('../models/feedbackForm');
const { FeedbackResponse } = require("../models/feedbackResponse");


// Define lockout parameters
const MAX_ATTEMPTS = 3; // Maximum login attempts
const LOCK_TIME = 5 * 60 * 1000; // Lock duration in milliseconds (5 min)

// Development-only admin creation endpoint
if (typeof process.env.NODE_ENV !== "undefined" && process.env.NODE_ENV === "development") {
    router.get("/create", async (req, res) => {
        try {
            // Define the admin details
            const admins = [
                {
                    name: "Dhruv",
                    email: "dhruvmaheswari23@gmail.com",
                    mobile: "9876543210",
                    department: "CSE",
                    password: "admin123",
                    image: "https://media.istockphoto.com/id/116192438/photo/one-indian-it-software-engineer-white-collar-worker-computer-people.webp?a=1&b=1&s=612x612&w=0&k=20&c=yCT6pKSUFtfymcCnUzx6SeSqS8yrWLDeVYZH8mOcJ3c=",
                },
                {
                    name: "Gajendra",
                    email: "gajendra.raikwar.11@gmail.com",
                    mobile: "8319573364",
                    department: "CSE",
                    password: "g",  // Ensure strong password in production
                    image: "https://media.istockphoto.com/id/1180298940/photo/portrait-of-a-medical-director-at-the-hospital.webp?a=1&b=1&s=612x612&w=0&k=20&c=AlcItcOsUzlhnQqY-qMXSco1r5eS3o_BlTR5M4KT3LU=",
                },
            ];

            const results = [];
            for (const adminData of admins) {
                // Check if the admin already exists
                const existingAdmin = await adminModel.findOne({ email: adminData.email });
                if (existingAdmin) {
                    results.push({ email: adminData.email, status: "Already exists" });
                    continue;
                }

                // Hash the password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(adminData.password, salt);

                // Create and save the admin
                const newAdmin = new adminModel({
                    name: adminData.name,
                    email: adminData.email,
                    mobile: adminData.mobile,
                    department: adminData.department,
                    password: hashedPassword,
                    image: adminData.image,
                });

                await newAdmin.save();
                console.log(newAdmin);

                results.push({ email: adminData.email, status: "Created successfully" });
            }

            // Return a response for the batch creation of admins
            res.status(200).send({ message: "Admins processed", results });
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    });
}

// Render login page
router.get('/', (req, res) => {
    res.render("adminLogin", { messages: req.flash() });
});

// Admin login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find admin by email
        let validAdmin = await adminModel.findOne({ email: email });

        if (!validAdmin) {
            req.flash('error', 'Admin not found');
            return res.redirect('/adminLogin');
        }

        // Check if account is locked
        if (validAdmin.lockUntil && validAdmin.lockUntil > Date.now()) {
            let remainingTime = Math.ceil((validAdmin.lockUntil - Date.now()) / 60000);
            req.flash('error', `Account locked. Try again in ${remainingTime} minute(s).`);
            return res.redirect('/adminLogin');
        }

        // Validate password
        let valid = await bcrypt.compare(password, validAdmin.password);

        if (valid) {
            // Reset failed attempts and unlock account
            validAdmin.failedAttempts = 0;
            validAdmin.lockUntil = null;
            await validAdmin.save();

            // Generate JWT token
            let token = jwt.sign({ email: email, id: validAdmin._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.cookie("adminToken", token, { httpOnly: true });

            // Store admin data in session
            req.session.admin = {
                id: validAdmin._id,
                name: validAdmin.name,
                email: validAdmin.email,
                department: validAdmin.department,
                image: validAdmin.image
            };
           
            req.flash('success', 'Login successful!');
            return res.redirect('/admin/adminHome');
        } else {
            // Increase failed attempts count
            validAdmin.failedAttempts = (validAdmin.failedAttempts || 0) + 1;

            if (validAdmin.failedAttempts >= MAX_ATTEMPTS) {
                validAdmin.lockUntil = Date.now() + LOCK_TIME; // Lock the account
                await validAdmin.save();
                req.flash('error', 'Account locked. Try again in 5 minutes.');
                return res.redirect('/adminLogin');
            }

            await validAdmin.save();
            req.flash('error', `Login failed. ${MAX_ATTEMPTS - validAdmin.failedAttempts} attempts left.`);
            return res.redirect('/adminLogin');
        }
    } catch (error) {
        console.error("Login error:", error);
        req.flash('error', 'Internal Server Error. Please try again.');
        return res.redirect('/adminLogin');
    }
});

// Logout Route
router.get('/logout', validateAdmin, (req, res) => {
    // Clear the session
    req.session.destroy();
    
    // Clear the JWT token cookie
    res.clearCookie('adminToken');
    
    // Redirect to login page
    res.redirect('/adminLogin');
});

// Route to fetch feedback data for charts
// router.get("/getFeedbackData", validateAdmin, async (req, res) => {
//     try {
//         // Get filter parameters
//         const { facultyID, section, formID } = req.query;
        
//         // Build query based on filters
//         let query = {};
//         if (facultyID && facultyID !== "All") query.facultyID = facultyID;
//         if (section && section !== "All") query.section = section;
//         if (formID && formID !== "All") query.formID = formID;
        
//         // Fetch feedback responses based on your model structure
//         const feedbackResponses = await FeedbackResponse.find(query)
//             .populate('formID')
//             .populate('facultyID')
//             .populate('studentID');
        
//         // Fetch questions to map IDs to text
//         const questions = await Question.find();
//         const questionMap = {};
//         questions.forEach(question => {
//             questionMap[question._id] = question.text || "Unknown Question";
//         });
        
//         // Process the responses for charts
//         const processedData = processFeedbackData(feedbackResponses, questionMap);
        
//         res.json(processedData);
//     } catch (error) {
//         console.error("Error fetching feedback data:", error);
//         res.status(500).json({ error: "Failed to fetch feedback data" });
//     }
// });
const processFeedbackData = (feedbackResponses, questionMap) => {
    let questionWiseData = {};

    feedbackResponses.forEach(response => {
        response.answers.forEach(answer => {
            const questionText = questionMap[answer.questionID] || "Unknown Question";

            if (!questionWiseData[questionText]) {
                questionWiseData[questionText] = { options: {}, totalRating: 0, ratingCount: 0 };
            }

            // Count responseOptions
            if (answer.responseOptions && answer.responseOptions.length > 0) {
                answer.responseOptions.forEach(option => {
                    questionWiseData[questionText].options[option] =
                        (questionWiseData[questionText].options[option] || 0) + 1;
                });
            }

            // Calculate responseRating average
            if (answer.responseRating !== null) {
                questionWiseData[questionText].totalRating += answer.responseRating;
                questionWiseData[questionText].ratingCount += 1;
            }
        });
    });

    // Final processed data format
    let processedData = Object.entries(questionWiseData).map(([question, data]) => ({
        question,
        options: data.options,
        avgRating: data.ratingCount > 0 ? (data.totalRating / data.ratingCount).toFixed(2) : null,
    }));

    return processedData;
};

// Admin Home Page Route - Added auth middleware
// router.get("/adminHome", validateAdmin, async (req, res) => {
//     try {
//         const subjectFilter = req.query.subject; // Get subject from query params
//         let faculties;
//         const students = await Student.find(); // Fetch students from DB
//         const uniqueSections = [...new Set(students.map(student => student.section))];

//         if (subjectFilter && subjectFilter !== "All") {
//             faculties = await Faculty.find({ subjects: subjectFilter }); // Filter faculties by subject
//         } else {
//             faculties = await Faculty.find(); // Get all faculties
//         }

//         let uniqueSubjects = [...new Set(faculties.flatMap(fac => fac.subjects))];

//         // Fetch forms data from Form model
//         const forms = await FeedbackForm.find();

//         const adminData = req.session.admin;
//         // Determine the current path dynamically
//         const currentPath = req.path;

//         res.render("adminHome", { 
//             currentPath, 
//             adminData, 
//             uniqueSubjects, 
//             faculties, 
//             students, 
//             uniqueSections,
//             forms // Send forms data to the EJS template
//         });
//     } catch (e) {
//         console.error(e);
//         res.status(500).send("Server Error");
//     }
// });

// router.get("/adminHome", validateAdmin, async (req, res) => {
//     try {
//       const subjectFilter = req.query.subject; // Get subject from query params
//       const formTypeFilter = req.query.formType || "Academic"; // Default to Academic if not specified
      
//       let faculties;
//       const students = await Student.find(); // Fetch students from DB
//       const uniqueSections = [...new Set(students.map(student => student.section))];
      
//       if (subjectFilter && subjectFilter !== "All") {
//         faculties = await Faculty.find({ subjects: subjectFilter }); // Filter faculties by subject
//       } else {
//         faculties = await Faculty.find(); // Get all faculties
//       }
      
//       let uniqueSubjects = [...new Set(faculties.flatMap(fac => fac.subjects))];
      
//       // Fetch forms data from Form model
//       const forms = await FeedbackForm.find();
      
//       // Fetch feedback responses based on form type
//       const feedbackResponses = await FeedbackResponse.find({ formType: formTypeFilter });
      
//       // Group responses by section titles
//       const sectionData = {};
      
//       // Process feedback responses
//       feedbackResponses.forEach(response => {
//         response.sectionAverages.forEach(section => {
//           if (!sectionData[section.sectionTitle]) {
//             sectionData[section.sectionTitle] = {
//               totalScore: 0,
//               count: 0,
//               average: 0,
//               questions: {}
//             };
//           }
          
//           sectionData[section.sectionTitle].totalScore += section.averageScore;
//           sectionData[section.sectionTitle].count++;
//         });
        
//         // Process individual questions
//         response.answers.forEach(answer => {
//           if (answer.responseNumericValue !== null) {
//             if (!sectionData[answer.sectionTitle].questions[answer.questionText]) {
//               sectionData[answer.sectionTitle].questions[answer.questionText] = {
//                 totalScore: 0,
//                 count: 0,
//                 average: 0
//               };
//             }
            
//             sectionData[answer.sectionTitle].questions[answer.questionText].totalScore += answer.responseNumericValue;
//             sectionData[answer.sectionTitle].questions[answer.questionText].count++;
//           }
//         });
//       });
      
//       // Calculate averages for sections and questions
//       Object.keys(sectionData).forEach(sectionTitle => {
//         const section = sectionData[sectionTitle];
//         if (section.count > 0) {
//           section.average = parseFloat((section.totalScore / section.count).toFixed(2));
//         }
        
//         // Calculate question averages
//         Object.keys(section.questions).forEach(questionText => {
//           const question = section.questions[questionText];
//           if (question.count > 0) {
//             question.average = parseFloat((question.totalScore / question.count).toFixed(2));
//           }
//         });
//       });
      
//       // Get faculty-specific data if requested
//       let facultyData = null;
//       if (req.query.facultyId) {
//         const facultyResponses = await FeedbackResponse.find({ 
//           formType: formTypeFilter,
//           facultyID: req.query.facultyId
//         });
        
//         // Process faculty-specific data (similar to above)
//         // ...
//       }
      
//       // Get response metadata
//       const responseMetadata = {
//         totalResponses: feedbackResponses.length,
//         formTypes: ["Academic", "Institutional", "Training"],
//         currentFormType: formTypeFilter,
//         lastUpdated: feedbackResponses.length > 0 ? 
//                     new Date(Math.max(...feedbackResponses.map(r => r.updatedAt))) : 
//                     new Date()
//       };
      
//       const adminData = req.session.admin;
//       const currentPath = req.path;
      
//       res.render("adminHome", { 
//         currentPath, 
//         adminData, 
//         uniqueSubjects, 
//         faculties, 
//         students, 
//         uniqueSections, 
//         forms,
//         feedbackData: {
//           sectionData,
//           facultyData,
//           responseMetadata
//         }
//       });
//     } catch (e) {
//       console.error(e);
//       res.status(500).send("Server Error");
//     }
//   });
router.get("/adminHome", validateAdmin, async (req, res) => {
    try {
      const subjectFilter = req.query.subject; // Get subject from query params
      const formTypeFilter = req.query.formType || "Academic"; // Default to Academic if not specified
      const facultyFilter = req.query.faculty; // Get faculty filter from query params
  
      let faculties;
      const students = await Student.find(); // Fetch students from DB
      const uniqueSections = [...new Set(students.map(student => student.section))];
  
      if (subjectFilter && subjectFilter !== "All") {
        faculties = await Faculty.find({ subjects: subjectFilter }); // Filter faculties by subject
      } else {
        faculties = await Faculty.find(); // Get all faculties
      }
  
      let uniqueSubjects = [...new Set(faculties.flatMap(fac => fac.subjects))];
  
      // Fetch forms data from Form model
      const forms = await FeedbackForm.find();
  
      // Fetch feedback responses based on form type and potentially faculty
      let feedbackQuery = { formType: formTypeFilter };
      
      // Add faculty filter if present
      if (facultyFilter) {
        feedbackQuery.facultyID = facultyFilter;
      }
      
      // Add subject filter if present
      if (subjectFilter && subjectFilter !== "All") {
        feedbackQuery.subject = subjectFilter;
      }
      
      const feedbackResponses = await FeedbackResponse.find(feedbackQuery);
  
      // Process the feedback data for charts
      const feedbackData = processDataForCharts(feedbackResponses, formTypeFilter);
  
      const adminData = req.session.admin;
      const currentPath = req.path;
      
      // Determine if there's a selected faculty
      const selectedFaculty = facultyFilter || '';
  
      // Render the page with all necessary data
      res.render("adminHome", {
        currentPath,
        adminData,
        uniqueSubjects,
        faculties,
        students,
        uniqueSections,
        forms,
        subjectFilter,
        selectedFaculty,
        feedbackData
      });
  
    } catch (e) {
      console.error("Error in adminHome route:", e);
      res.status(500).send("Server Error");
    }
  });
  
  /**
   * Process feedback response data into the format needed for charts
   * @param {Array} feedbackResponses - Array of feedback response documents
   * @param {String} formType - Type of feedback form
   * @returns {Object} Formatted data for charts
   */
  function processDataForCharts(feedbackResponses, formType) {
    // Initialize the section data structure
    const sectionData = {};
    
    // Process each feedback response
    feedbackResponses.forEach(response => {
      // Process answers from this response
      response.answers.forEach(answer => {
        if (answer.responseNumericValue !== null) {
          // Initialize section if it doesn't exist
          if (!sectionData[answer.sectionTitle]) {
            sectionData[answer.sectionTitle] = {
              questions: {},
              labels: [],
              values: []
            };
          }
          
          // Process question data
          if (!sectionData[answer.sectionTitle].questions[answer.questionText]) {
            sectionData[answer.sectionTitle].questions[answer.questionText] = {
              totalScore: 0,
              count: 0,
              average: 0
            };
          }
          
          sectionData[answer.sectionTitle].questions[answer.questionText].totalScore += answer.responseNumericValue;
          sectionData[answer.sectionTitle].questions[answer.questionText].count++;
        }
      });
    });
    
    // Calculate averages and prepare chart data
    Object.keys(sectionData).forEach(sectionTitle => {
      const section = sectionData[sectionTitle];
      
      // Calculate averages for each question
      Object.keys(section.questions).forEach(questionText => {
        const question = section.questions[questionText];
        if (question.count > 0) {
          question.average = parseFloat((question.totalScore / question.count).toFixed(2));
        }
        
        // Add to labels and values arrays for charts
        section.labels.push(questionText);
        section.values.push(question.average);
      });
    });
    
    // Calculate section averages for the summary table
    const sectionAverages = Object.keys(sectionData).map(sectionTitle => {
      const section = sectionData[sectionTitle];
      const questionValues = Object.values(section.questions);
      const totalAverage = questionValues.reduce((sum, q) => sum + q.average, 0) / questionValues.length;
      
      return {
        sectionTitle,
        averageScore: parseFloat(totalAverage.toFixed(2))
      };
    });
    
    // Build response metadata
    const responseMetadata = {
      totalResponses: feedbackResponses.length,
      formTypes: ["Academic", "Institutional", "Training"],
      currentFormType: formType,
      lastUpdated: feedbackResponses.length > 0 ?
        new Date(Math.max(...feedbackResponses.map(r => r.updatedAt))) :
        new Date()
    };
    
    return {
      sectionData,
      sectionAverages,
      responseMetadata
    };
  }
  

// Admin Student Page Route - Added auth middleware
router.get("/adminStudentPage", validateAdmin, async (req, res) => {
    try {
      // Fetch all students from database
      const students = await Student.find();
      
      // Get admin data from session
      const adminData = req.session.admin;
      
      // Generate random colors for each student
      const studentsWithColors = students.map(student => ({
        ...student.toObject(), // Convert Mongoose document to plain object
        color: Math.floor(Math.random() * 16777215).toString(16) // Generate hex color
      }));
      
      // Extract unique sections and branches
      const uniqueSections = [...new Set(students.map(student => student.section))];
      const uniqueBranches = [...new Set(students.map(student => student.branch))];
      
      // Calculate semester distribution
      const semesterDistribution = students.reduce((acc, student) => {
        acc[student.semester] = (acc[student.semester] || 0) + 1;
        return acc;
      }, {});
      
      // Count logged in students
      const loggedInStudents = students.filter(student => student.isLoggedIn).length;
      
      // Get the current path for highlighting active sidebar link
      const currentPath = req.path;
      
      res.render("adminStudentPage", {
        currentPath,
        adminData,
        students: studentsWithColors,
        uniqueSections,
        uniqueBranches,
        totalStudents: students.length,
        semesterDistribution,
        loggedInStudents
      });
    } catch (e) {
      console.error(e);
      res.status(500).send("Server Error");
    }
  });
// Delete student by ID route
router.delete('/students/:studentIdToDelete', async (req, res) => {
    try {
      const studentIdToDelete = req.params.studentIdToDelete;
  
      // Find and delete the student from the database
      const student = await Student.findByIdAndDelete(studentIdToDelete);
  
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      res.json({ message: `Student with ID ${studentIdToDelete} deleted successfully` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
// Admin Faculty Page Route - Added auth middleware
router.get("/adminFaculty", validateAdmin, (req, res) => {
    const adminData = req.session.admin;
    const currentPath = req.path;
    res.render("facultyManagement", { currentPath, adminData });
});

// GET/POST route for form creation page
router.get('/adminHome/forms/create/:formType', async (req, res) => {
    try {
        let { formType } = req.params;
        
        // Convert to Title Case to match database schema
        formType = formType.charAt(0).toUpperCase() + formType.slice(1).toLowerCase();

        // Validate form type
        const validFormTypes = ["Academic", "Institutional", "Training"];
        if (!validFormTypes.includes(formType)) {
            return res.status(400).send("Invalid form type");
        }

        // Fetch faculty list
        const faculties = await Faculty.find({}, 'name _id department');
        
        // Get sections, semesters and subjects
        const sectionCategories = ["CSE-A", "CSE-B", "IT-A", "IT-B", "ECE-A", "ECE-B"];
        const semesterCategories = [1,2,3,4,5,6,7,8];
        
        // For academic forms, fetch subjects (you can replace this with actual subject fetching)
        const subjects = ["Data Structures", "Database Management", "Computer Networks", 
                         "Operating Systems", "Machine Learning", "Web Development"];

        res.render('CreateFeedbackForms', {
            formType,
            faculties,
            sectionCategories,
            semesterCategories,
            subjects,
            currentPath: req.path,
            adminData: req.session.admin || {} 
        });

    } catch (error) {
        console.error('Error loading form creation page:', error);
        res.status(500).send("Server error");
    }
});
router.post('/adminHome/forms/create/:formType', async (req, res) => {
    try {
        let { formType } = req.params;
        console.log(`\n🔹 Route hit: /adminHome/forms/create/${formType}`);

        // Convert formType to Title Case
        formType = formType.charAt(0).toUpperCase() + formType.slice(1).toLowerCase();
        console.log(`✅ Converted formType: ${formType}`);

        // Validate form type
        const validFormTypes = ["Academic", "Institutional", "Training"];
        if (!validFormTypes.includes(formType)) {
            console.error("❌ Invalid form type received");
            return res.status(400).json({ success: false, message: "Invalid form type" });
        }

        let formData = req.body;
        console.log("📥 Raw formData received:", formData);

        // Process facultyAssigned array
        if (Array.isArray(formData.facultyAssigned)) {
            formData.facultyAssigned = formData.facultyAssigned.map(String);
        } else {
            formData.facultyAssigned = [];
        }
        console.log("✅ Processed facultyAssigned:", formData.facultyAssigned);

        // Process sectionsAssigned array
        if (Array.isArray(formData.sectionsAssigned)) {
            formData.sectionsAssigned = formData.sectionsAssigned.map(String);
        } else {
            formData.sectionsAssigned = [];
        }
        console.log("✅ Processed sectionsAssigned:", formData.sectionsAssigned);

        // Process semesters
        if (!Array.isArray(formData.semesters) || formData.semesters.length === 0) {
            return res.status(400).json({ success: false, message: "Semesters are required" });
        }
        formData.semesters = formData.semesters.map(String);
        console.log("✅ Processed semesters:", formData.semesters);

        // Ensure createdBy exists
        if (!formData.createdBy && req.session.admin) {
            formData.createdBy = req.session.admin.id;
        }
        if (!formData.createdBy) {
            return res.status(400).json({ success: false, message: "createdBy is required" });
        }
        formData.createdBy = String(formData.createdBy);
        console.log("✅ Processed createdBy:", formData.createdBy);

        // Process sections from flattened form data
        const processedSections = [];
        
        // First, find all section indexes
        const sectionIndexes = new Set();
        Object.keys(formData).forEach(key => {
            const match = key.match(/^sections\[(\d+)\]/);
            if (match) {
                sectionIndexes.add(parseInt(match[1]));
            }
        });
        
        // Process each section
        Array.from(sectionIndexes).sort((a, b) => a - b).forEach(sectionIndex => {
            const section = {
                title: formData[`sections[${sectionIndex}][title]`] || '',
                description: formData[`sections[${sectionIndex}][description]`] || '',
                questions: []
            };
            
            // Find all question indexes for this section
            const questionIndexes = new Set();
            Object.keys(formData).forEach(key => {
                const match = key.match(new RegExp(`^sections\\[${sectionIndex}\\]\\[questions\\]\\[(\\d+)\\]`));
                if (match) {
                    questionIndexes.add(parseInt(match[1]));
                }
            });
            
            // Process each question
            Array.from(questionIndexes).sort((a, b) => a - b).forEach(questionIndex => {
                const questionPrefix = `sections[${sectionIndex}][questions][${questionIndex}]`;
                const question = {
                    questionText: formData[`${questionPrefix}[questionText]`] || '',
                    questionType: formData[`${questionPrefix}[questionType]`] || '',
                    required: formData[`${questionPrefix}[required]`] === 'true'
                };
                
                // Handle different question types and their options
                if (question.questionType === 'mcq' || question.questionType === 'dropdown' || 
                    question.questionType === 'rating' || question.questionType === 'yes_no') {
                    // Get options array
                    const optionsKey = `${questionPrefix}[options]`;
                    question.options = Array.isArray(formData[optionsKey]) ? 
                        formData[optionsKey] : 
                        (formData[optionsKey] ? [formData[optionsKey]] : []);
                } else if (question.questionType === 'grid') {
                    // Handle grid questions with rows and columns
                    question.gridOptions = {
                        rows: [],
                        columns: []
                    };
                    
                    // Get rows
                    const rowsKey = `${questionPrefix}[gridOptions][rows]`;
                    if (formData[rowsKey]) {
                        question.gridOptions.rows = Array.isArray(formData[rowsKey]) ? 
                            formData[rowsKey] : [formData[rowsKey]];
                    }
                    
                    // Get columns
                    const columnsKey = `${questionPrefix}[gridOptions][columns]`;
                    if (formData[columnsKey]) {
                        question.gridOptions.columns = Array.isArray(formData[columnsKey]) ? 
                            formData[columnsKey] : [formData[columnsKey]];
                    }
                }
                
                section.questions.push(question);
            });
            
            processedSections.push(section);
        });
        
        console.log("✅ Processed sections:", processedSections);

        // Create and save feedback form
        const newForm = new FeedbackForm({
            title: formData.title,
            formType,
            facultyAssigned: formData.facultyAssigned,
            subjects: formData.subjects || [],
            sectionsAssigned: formData.sectionsAssigned,
            semesters: formData.semesters,
            deadline: formData.deadline,
            createdBy: formData.createdBy,
            sections: processedSections,  // Use our processed sections
            status: formData.status || 'active'
        });
        
        console.log("📋 Form data ready to save:", newForm);
        await newForm.save();
        console.log("✅ Feedback form saved successfully");

        return res.status(201).json({ 
            success: true, 
            message: `${formType} feedback form created successfully`,
            redirect: '/admin/Total-Forms'
        });
    } catch (error) {
        console.error('❌ Error creating feedback form:', error);
        return res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
});

router.get('/Total-Forms', validateAdmin, async (req, res) => {
    try {
        // Fetch forms from database & populate faculty data
        const forms = await FeedbackForm.find({})
            .populate('facultyAssigned', 'name') // Fetch faculty names
            .lean();
        
        // Format the forms for display
        const formattedForms = forms.map(form => ({
            _id: form._id,
            title: form.title,
            formType: form.formType,
            startDate: form.deadline, // Using deadline as startDate
            endDate: form.deadline,   // Using deadline as endDate
            isActive: form.status === 'active',
            department: 'Information Technology', // Default department
            sections: form.sectionsAssigned.map(section => ({ title: section })), // Use actual section names
            facultyAssignments: form.facultyAssigned.map(faculty => ({ 
                facultyId: faculty._id, 
                facultyName: faculty.name // Get actual faculty name 
            })),
            classAssignments: [{
                classes: form.sectionsAssigned || []
            }],
            submissionCount: Math.floor(Math.random() * 100) // Random submission count for demo
        }));
        
        // Render the TotalForms page with formatted data
        res.render('TotalForms', { 
            forms: formattedForms,
            adminData: req.session.admin,
            currentPath: req.path
        });

    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).send('Error fetching forms');
    }
});

// DELETE - Delete a form
router.delete('/forms/:id', async (req, res) => {
    try {
      const formId = req.params.id;
      
      // Check if form exists
      const form = await FeedbackForm.findById(formId);
      if (!form) {
        return res.status(404).json({ success: false, message: 'Form not found' });
      }
      
      // Delete the form from the database
      await FeedbackForm.findByIdAndDelete(formId);
      
      // Also delete any related data (optional)
      // For example, if you have submissions or other data related to this form:
      // await Submission.deleteMany({ formId: formId });
      
      return res.json({ success: true, message: 'Form deleted successfully' });
    } catch (error) {
      console.error('Error deleting form:', error);
      return res.status(500).json({ success: false, message: 'Error deleting form' });
    }
});

// POST - Process bulk actions on forms
router.post('/forms/bulk-action', async (req, res) => {
    try {
      const { action, formIds } = req.body;
      
      if (!action || !formIds || !Array.isArray(formIds) || formIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
      }
      
      switch (action) {
        case 'delete':
          // Delete multiple forms
          await FeedbackForm.deleteMany({ _id: { $in: formIds } });
          break;
          
        case 'activate':
          // Activate multiple forms (set status to "open")
          await FeedbackForm.updateMany(
            { _id: { $in: formIds } },
            { $set: { status: "active" } }
          );
          break;
          
        case 'deactivate':
          // Deactivate multiple forms (set status to "closed")
          await FeedbackForm.updateMany(
            { _id: { $in: formIds } },
            { $set: { status: "closed" } }
          );
          break;
          
        default:
          return res.status(400).json({ success: false, message: 'Invalid action' });
      }
      
      return res.json({ success: true, message: `Forms ${action}d successfully` });
    } catch (error) {
      console.error(`Error processing bulk action:`, error);
      return res.status(500).json({ success: false, message: 'Error processing bulk action' });
    }
});

// Admin view form details
router.get('/forms/view/:formId', validateAdmin, async (req, res) => {
    try {
        const formId = req.params.formId;
        
        // Fetch form with populated fields
        const form = await FeedbackForm.findById(formId);
        
        if (!form) {
            req.flash('error', 'Form not found');
            return res.redirect('/admin/forms');
        }
        
        // Fetch faculty data if faculty is assigned
        let facultyData = [];
        if (form.facultyAssigned && form.facultyAssigned.length > 0) {
            facultyData = await Faculty.find({
                _id: { $in: form.facultyAssigned }
            }).select('name email department');
        }
        
        res.render('FormView', {
            title: 'Form Details',
            form: form,
            facultyData: facultyData,
            adminData:req.session.admin,
            currentPath:req.path
        });
    } catch (error) {
        console.error('Error viewing form details:', error);
        req.flash('error', 'An error occurred while fetching form details');
        res.redirect('/admin/forms');
    }
});

router.post('/forms/:id/update', async (req, res) => {
    try {
        const formId = req.params.id;
        // Fetch the existing form to verify it exists
        const existingForm = await FeedbackForm.findById(formId);
        if (!existingForm) {
            req.session.errorMessage = 'Feedback form not found';
            return res.redirect('/admin');
        }

        let formData = req.body;
        // Process facultyAssigned array
        if (Array.isArray(formData.facultyAssigned)) {
            formData.facultyAssigned = formData.facultyAssigned.map(String);
        } else if (formData.facultyAssigned) {
            formData.facultyAssigned = [String(formData.facultyAssigned)];
        } else {
            formData.facultyAssigned = [];
        }
        // Process sectionsAssigned array
        if (Array.isArray(formData.sectionsAssigned)) {
            formData.sectionsAssigned = formData.sectionsAssigned.map(String);
        } else if (formData.sectionsAssigned) {
            formData.sectionsAssigned = [String(formData.sectionsAssigned)];
        } else {
            formData.sectionsAssigned = [];
        }
        // Process semesters
        if (Array.isArray(formData.semesters)) {
            formData.semesters = formData.semesters.map(String);
        } else if (formData.semesters) {
            formData.semesters = [String(formData.semesters)];
        } else {
            formData.semesters = existingForm.semesters; // Keep existing if not provided
        }
        // Process sections - handle directly if they're already structured
        let processedSections = [];
        
        // Check if sections are already in structured format (not flattened)
        if (Array.isArray(formData.sections)) {
            processedSections = formData.sections.map(section => {
                // Process questions within each section
                const questions = Array.isArray(section.questions) 
                    ? section.questions.map(question => {
                        // Ensure required is boolean
                        const required = question.required === true || question.required === 'true';
                        
                        // Create base question object
                        const processedQuestion = {
                            questionText: question.questionText || '',
                            questionType: question.questionType || 'text',
                            required: required
                        };
                        
                        // Add options based on question type
                        if (['mcq', 'dropdown', 'rating', 'yes_no'].includes(question.questionType)) {
                            processedQuestion.options = Array.isArray(question.options) 
                                ? question.options 
                                : (question.options ? [question.options] : []);
                        } else if (question.questionType === 'grid') {
                            processedQuestion.gridOptions = {
                                rows: Array.isArray(question.gridOptions?.rows) 
                                    ? question.gridOptions.rows 
                                    : (question.gridOptions?.rows ? [question.gridOptions.rows] : []),
                                columns: Array.isArray(question.gridOptions?.columns) 
                                    ? question.gridOptions.columns 
                                    : (question.gridOptions?.columns ? [question.gridOptions.columns] : [])
                            };
                        }
                        
                        return processedQuestion;
                    }) 
                    : [];
                
                return {
                    title: section.title || '',
                    description: section.description || '',
                    questions: questions
                };
            });
        } else {
            // Fallback to the original flattened processing logic
            // First, find all section indexes
            const sectionIndexes = new Set();
            Object.keys(formData).forEach(key => {
                const match = key.match(/^sections\[(\d+)\]/);
                if (match) {
                    sectionIndexes.add(parseInt(match[1]));
                }
            });
            
            // Process each section
            Array.from(sectionIndexes).sort((a, b) => a - b).forEach(sectionIndex => {
                const section = {
                    title: formData[`sections[${sectionIndex}][title]`] || '',
                    description: formData[`sections[${sectionIndex}][description]`] || '',
                    questions: []
                };
                
                // Find all question indexes for this section
                const questionIndexes = new Set();
                Object.keys(formData).forEach(key => {
                    const match = key.match(new RegExp(`^sections\\[${sectionIndex}\\]\\[questions\\]\\[(\\d+)\\]`));
                    if (match) {
                        questionIndexes.add(parseInt(match[1]));
                    }
                });
                
                // Process each question
                Array.from(questionIndexes).sort((a, b) => a - b).forEach(questionIndex => {
                    const questionPrefix = `sections[${sectionIndex}][questions][${questionIndex}]`;
                    const question = {
                        questionText: formData[`${questionPrefix}[questionText]`] || '',
                        questionType: formData[`${questionPrefix}[questionType]`] || '',
                        required: formData[`${questionPrefix}[required]`] === 'true'
                    };
                    
                    // Handle different question types and their options
                    if (question.questionType === 'mcq' || question.questionType === 'dropdown' || 
                        question.questionType === 'rating' || question.questionType === 'yes_no') {
                        // Get options array
                        const optionsKey = `${questionPrefix}[options]`;
                        question.options = Array.isArray(formData[optionsKey]) ? 
                            formData[optionsKey] : 
                            (formData[optionsKey] ? [formData[optionsKey]] : []);
                    } else if (question.questionType === 'grid') {
                        // Handle grid questions with rows and columns
                        question.gridOptions = {
                            rows: [],
                            columns: []
                        };
                        
                        // Get rows
                        const rowsKey = `${questionPrefix}[gridOptions][rows]`;
                        if (formData[rowsKey]) {
                            question.gridOptions.rows = Array.isArray(formData[rowsKey]) ? 
                                formData[rowsKey] : [formData[rowsKey]];
                        }
                        
                        // Get columns
                        const columnsKey = `${questionPrefix}[gridOptions][columns]`;
                        if (formData[columnsKey]) {
                            question.gridOptions.columns = Array.isArray(formData[columnsKey]) ? 
                                formData[columnsKey] : [formData[columnsKey]];
                        }
                    }
                    
                    section.questions.push(question);
                });
                
                processedSections.push(section);
            });
        }
        
        // Update form data
        const updateData = {
            title: formData.title || existingForm.title,
            facultyAssigned: formData.facultyAssigned,
            subjects: formData.subjects || existingForm.subjects || [],
            sectionsAssigned: formData.sectionsAssigned,
            semesters: formData.semesters,
            deadline: formData.deadline || existingForm.deadline,
            formType: existingForm.formType, // Preserve the form type
            sections: processedSections.length > 0 ? processedSections : existingForm.sections,
            status: formData.status || existingForm.status,
            updatedAt: new Date()
        };
        
        // Update the form
        const updatedForm = await FeedbackForm.findByIdAndUpdate(
            formId,
            updateData,
            { new: true }
        );
        
        console.log("✅ Feedback form updated successfully");

        req.session.successMessage = `${existingForm.formType} feedback form updated successfully`;
        return res.redirect('/admin/Total-Forms');
    } catch (error) {
        console.error('❌ Error updating feedback form:', error);
        return res.redirect(`/forms/${req.params.id}/edit`);
    }
});

// GET route for editing a form
router.get('/forms/:id/edit', async (req, res) => {
    try {
        const formId = req.params.id;
        console.log(`\n🔹 Route hit: /forms/${formId}/edit`);

        // Fetch the form data
        const formData = await FeedbackForm.findById(formId);
        
        if (!formData) {
            console.error("❌ Form not found");
            // Instead of rendering an error page, redirect with a flash message
            req.session.errorMessage = 'Feedback form not found';
            return res.redirect('/admin'); // Redirect to admin dashboard or another existing page
        }
        
        // Rest of the code remains the same...
        const faculties = await Faculty.find({}, 'name _id department');
        const sectionCategories = ["CSE-A", "CSE-B", "IT-A", "IT-B", "ECE-A", "ECE-B"];
        const semesterCategories = [1,2,3,4,5,6,7,8];
        const subjects = ["Data Structures", "Database Management", "Computer Networks", 
                         "Operating Systems", "Machine Learning", "Web Development"];

        console.log("✅ Form data fetched successfully");
        
        res.render('EditForm', {
            title: 'Edit Feedback Form',
            formData,
            formType: formData.formType,
            faculties,
            sectionCategories,
            semesterCategories,
            subjects,
            currentPath: req.path,
            adminData: req.session.admin || {}
        });

    } catch (error) {
        console.error('❌ Error loading form edit page:', error);
        // Instead of rendering error page, redirect with a flash message
        req.session.errorMessage = 'Internal Server Error';
        return res.redirect('/admin'); // Redirect to admin dashboard or another existing page
    }
});
//home page form status toggle button route
router.patch('/forms/updateStatus/:formId', async (req, res) => {
    try {
        const { formId } = req.params;
        const { status } = req.body;

        const updatedForm = await FeedbackForm.findByIdAndUpdate(
            formId,
            { status: status },
            { new: true }
        );

        if (!updatedForm) {
            return res.status(404).json({ success: false, message: "Form not found" });
        }

        res.json({ success: true, message: "Status updated", form: updatedForm });

    } catch (error) {
        console.error("Error updating form status:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Route to export forms data to Excel
router.post('/forms/export-excel', async (req, res) => {
    try {
        const { forms, filters } = req.body;
        
        if (!forms || !Array.isArray(forms) || forms.length === 0) {
            return res.status(400).json({ success: false, message: 'No form data provided' });
        }
        
        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Forms Data');
        
        // Define column headers
        worksheet.columns = [
            { header: 'Form ID', key: 'id', width: 10 },
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Deadline', key: 'deadline', width: 15 },
            { header: 'Created By', key: 'createdBy', width: 20 },
            { header: 'Sections', key: 'sections', width: 10 },
            { header: 'Assigned Faculty', key: 'faculty', width: 40 },
            { header: 'Assigned Classes', key: 'classes', width: 40 }
        ];
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };
        
        // Add filter information at the top
        let filterText = `Forms Export - ${new Date().toLocaleDateString()}`;
        if (filters.search) {
            filterText += ` | Search: "${filters.search}"`;
        }
        if (filters.status) {
            filterText += ` | Status: ${filters.status}`;
        }
        
        worksheet.insertRow(1, [filterText]);
        worksheet.mergeCells('A1:I1');
        worksheet.getCell('A1').font = { bold: true, size: 14 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        
        // Add the data
        forms.forEach(form => {
            worksheet.addRow({
                id: form.id,
                title: form.title,
                type: form.type,
                status: form.status,
                deadline: form.deadline,
                createdBy: form.createdBy,
                sections: form.sections,
                faculty: form.faculty,
                classes: form.classes
            });
        });
        
        // Create directory for exports if doesn't exist
        const uploadsDir = path.join(__dirname, '../public/uploads/exports');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate a unique filename
        const timestamp = new Date().getTime();
        const fileName = `forms_export_${timestamp}.xlsx`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Write the file
        await workbook.xlsx.writeFile(filePath);
        
        // Return the file URL for download
        const fileUrl = `/uploads/exports/${fileName}`;
        
        res.json({
            success: true,
            fileUrl: fileUrl,
            fileName: fileName
        });
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating Excel file'
        });
    }
});
router.get("/download-feedback", validateAdmin, async (req, res) => {
    try {
      const formType = req.query.formType || "Academic";
      const facultyId = req.query.facultyId;
      
      // Build query
      const query = { formType };
      if (facultyId) {
        query.facultyID = facultyId;
      }
      
      // Fetch feedback responses
      const feedbackResponses = await FeedbackResponse.find(query)
        .populate('studentID', 'name regNumber')
        .populate('facultyID', 'name');
      
      // Create Excel workbook using exceljs
      const Excel = require('exceljs');
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet(`${formType} Feedback`);
      
      // Add headers
      worksheet.addRow([
        'Student ID', 'Student Name', 'Faculty', 'Section',
        'Semester', 'Overall Average', 'Submitted At'
      ]);
      
      // Add data
      feedbackResponses.forEach(response => {
        worksheet.addRow([
          response.studentID.regNumber,
          response.studentID.name,
          response.facultyID ? response.facultyID.name : 'N/A',
          response.section,
          response.semester,
          response.overallAverage,
          new Date(response.submittedAt).toLocaleString()
        ]);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Set filename
      const fileName = `${formType}_Feedback_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Set headers for download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // Write to response stream
      await workbook.xlsx.write(res);
      res.end();
      
    } catch (e) {
      console.error(e);
      res.status(500).send("Error generating Excel file");
    }
  });
module.exports = router;