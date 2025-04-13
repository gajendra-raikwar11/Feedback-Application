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
const { FormTemplate, validateFormTemplate } = require('../models/FormTemplate');


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

//---------------------------------------------Admin Login/Logout/adminHome Realted all routes--------------------------------------------------------------------
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

          // ⏳ Set session expiry to 24 hours
          req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          req.flash('success', 'Login successful!');
          return res.redirect('/admin/adminHome');
      } else {
          // Increase failed attempts count
          validAdmin.failedAttempts = (validAdmin.failedAttempts || 0) + 1;

          if (validAdmin.failedAttempts >= MAX_ATTEMPTS) {
              validAdmin.lockUntil = Date.now() + LOCK_TIME;
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
  
//---------------------------------------------Admin Home Student Realted all routes--------------------------------------------------------------------
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
router.delete('/students/:studentIdToDelete',validateAdmin, async (req, res) => {
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
//---------------------------------------------Admin Home Form Realted all routes--------------------------------------------------------------------
//form related all routes
router.get('/adminHome/forms/create/:formType',validateAdmin, async (req, res) => {
  try {
    let { formType } = req.params;

    // Convert to Title Case
    formType = formType.charAt(0).toUpperCase() + formType.slice(1).toLowerCase();

    // Validate form type
    const validFormTypes = ["Academic", "Institutional", "Training"];
    if (!validFormTypes.includes(formType)) {
      return res.status(400).send("Invalid form type");
    }

    // Fetch faculty list
    const faculties = await Faculty.find({}, 'name _id department');

    // Static data
    const sectionCategories = ["CSE-A", "CSE-B", "IT-A", "IT-B", "ECE-A", "ECE-B"];
    const semesterCategories = [1, 2, 3, 4, 5, 6, 7, 8];
    const subjects = ["Data Structures", "Database Management", "Computer Networks",
      "Operating Systems", "Machine Learning", "Web Development"];

    // ✅ Use top-level FormTemplate import
    const templates = await FormTemplate.find({ formType });
    console.log(`✅ Fetched ${templates.length} templates for form type: ${formType}`);
    
    // Convert templates to plain objects to ensure proper serialization
    const plainTemplates = templates.map(template => template.toObject());

    res.render('CreateFeedbackForms', {
      formType,
      faculties,
      sectionCategories,
      semesterCategories,
      subjects,
      templates: plainTemplates, // Pass plain objects instead of Mongoose documents
      templatesJSON: JSON.stringify(plainTemplates), // Add this line to provide pre-stringified JSON
      currentPath: req.path,
      adminData: req.session.admin || {}
    });

  } catch (error) {
    console.error('Error loading form creation page:', error);
    res.status(500).send("Server error");
  }
});
// POST Route – Handle form submission
// router.post('/adminHome/forms/create/:formType', async (req, res) => {
//   try {
//     let { formType } = req.params;
//     console.log(`\n🔹 Route hit: /adminHome/forms/create/${formType}`);

//     // Convert formType to Title Case
//     formType = formType.charAt(0).toUpperCase() + formType.slice(1).toLowerCase();
//     console.log(`✅ Converted formType: ${formType}`);

//     const validFormTypes = ["Academic", "Institutional", "Training"];
//     if (!validFormTypes.includes(formType)) {
//       return res.status(400).json({ success: false, message: "Invalid form type" });
//     }

//     let formData = req.body;
//     console.log("📥 Raw formData received:", formData);

//     // ✅ Apply template if selected
//     if (formData.templateId) {
//       console.log(`🔍 Template ID provided: ${formData.templateId}. Applying template...`);
//       const template = await FormTemplate.findById(formData.templateId);
//       if (!template) {
//         throw new Error('Template not found');
//       }

//       formData.sections = JSON.parse(JSON.stringify(template.sections));

//       if (template.formType === "Academic" && template.academicType) {
//         formData.academicType = template.academicType;
//       }

//       console.log("✅ Template applied successfully");

//     } else {
//       console.log("📋 No template used. Processing form data manually...");

//       formData.facultyAssigned = Array.isArray(formData.facultyAssigned)
//         ? formData.facultyAssigned.map(String)
//         : [];

//       formData.sectionsAssigned = Array.isArray(formData.sectionsAssigned)
//         ? formData.sectionsAssigned.map(String)
//         : [];

//       if (!Array.isArray(formData.semesters) || formData.semesters.length === 0) {
//         return res.status(400).json({ success: false, message: "Semesters are required" });
//       }
//       formData.semesters = formData.semesters.map(Number);

//       if (!formData.createdBy && req.session.admin) {
//         formData.createdBy = req.session.admin.id;
//       }
//       if (!formData.createdBy) {
//         return res.status(400).json({ success: false, message: "createdBy is required" });
//       }
//       formData.createdBy = String(formData.createdBy);

//       const processedSections = [];

//       const sectionIndexes = new Set();
//       Object.keys(formData).forEach(key => {
//         const match = key.match(/^sections\[(\d+)\]/);
//         if (match) {
//           sectionIndexes.add(parseInt(match[1]));
//         }
//       });

//       Array.from(sectionIndexes).sort((a, b) => a - b).forEach(sectionIndex => {
//         const section = {
//           title: formData[`sections[${sectionIndex}][title]`] || '',
//           description: formData[`sections[${sectionIndex}][description]`] || '',
//           questions: []
//         };

//         const questionIndexes = new Set();
//         Object.keys(formData).forEach(key => {
//           const match = key.match(new RegExp(`^sections\\[${sectionIndex}\\]\\[questions\\]\\[(\\d+)\\]`));
//           if (match) {
//             questionIndexes.add(parseInt(match[1]));
//           }
//         });

//         Array.from(questionIndexes).sort((a, b) => a - b).forEach(questionIndex => {
//           const questionPrefix = `sections[${sectionIndex}][questions][${questionIndex}]`;
//           const question = {
//             questionText: formData[`${questionPrefix}[questionText]`] || '',
//             questionType: formData[`${questionPrefix}[questionType]`] || '',
//             required: formData[`${questionPrefix}[required]`] === 'true'
//           };

//           if (['mcq', 'dropdown', 'rating', 'yes_no'].includes(question.questionType)) {
//             const optionsKey = `${questionPrefix}[options]`;
//             question.options = Array.isArray(formData[optionsKey])
//               ? formData[optionsKey]
//               : (formData[optionsKey] ? [formData[optionsKey]] : []);
//           } else if (question.questionType === 'grid') {
//             question.gridOptions = {
//               rows: [],
//               columns: []
//             };

//             const rowsKey = `${questionPrefix}[gridOptions][rows]`;
//             if (formData[rowsKey]) {
//               question.gridOptions.rows = Array.isArray(formData[rowsKey])
//                 ? formData[rowsKey]
//                 : [formData[rowsKey]];
//             }

//             const columnsKey = `${questionPrefix}[gridOptions][columns]`;
//             if (formData[columnsKey]) {
//               question.gridOptions.columns = Array.isArray(formData[columnsKey])
//                 ? formData[columnsKey]
//                 : [formData[columnsKey]];
//             }
//           }

//           section.questions.push(question);
//         });

//         processedSections.push(section);
//       });

//       console.log("✅ Processed sections:", processedSections);
//       formData.sections = processedSections;
//     }

//     const newForm = new FeedbackForm({
//       title: formData.title,
//       formType,
//       createdFromTemplate: formData.templateId || null,
//       academicType: formData.academicType,
//       facultyAssigned: formData.facultyAssigned,
//       subjects: formData.subjects || [],
//       sectionsAssigned: formData.sectionsAssigned,
//       semesters: formData.semesters,
//       deadline: formData.deadline,
//       createdBy: formData.createdBy,
//       sections: formData.sections,
//       status: formData.status || 'active'
//     });

//     console.log("📋 Form data ready to save:", newForm);
//     await newForm.save();
//     console.log("✅ Feedback form saved successfully");

//     return res.status(201).json({
//       success: true,
//       message: `${formType} feedback form created successfully`,
//       redirect: '/admin/Total-Forms'
//     });

//   } catch (error) {
//     console.error('❌ Error creating feedback form:', error);
//     return res.status(500).json({ success: false, message: "Server error: " + error.message });
//   }
// });
router.post('/adminHome/forms/create/:formType',validateAdmin, async (req, res) => {
  try {
    let { formType } = req.params;
    console.log(`\n🔹 Route hit: /adminHome/forms/create/${formType}`);

    // Convert formType to Title Case
    formType = formType.charAt(0).toUpperCase() + formType.slice(1).toLowerCase();
    console.log(`✅ Converted formType: ${formType}`);

    const validFormTypes = ["Academic", "Institutional", "Training"];
    if (!validFormTypes.includes(formType)) {
      return res.status(400).json({ success: false, message: "Invalid form type" });
    }

    let formData = req.body;
    console.log("📥 Raw formData received:", formData);

    // ✅ Apply template if selected
    if (formData.templateId) {
      console.log(`🔍 Template ID provided: ${formData.templateId}. Applying template...`);
      const template = await FormTemplate.findById(formData.templateId);
      if (!template) throw new Error('Template not found');

      formData.sections = JSON.parse(JSON.stringify(template.sections));

      if (template.formType === "Academic" && template.academicType) {
        formData.academicType = template.academicType;
      }

      console.log("✅ Template applied successfully");

    } else {
      console.log("📋 No template used. Processing form data manually...");

      formData.facultyAssigned = Array.isArray(formData.facultyAssigned)
        ? formData.facultyAssigned.map(String)
        : [];

      formData.sectionsAssigned = Array.isArray(formData.sectionsAssigned)
        ? formData.sectionsAssigned.map(String)
        : [];

      if (!Array.isArray(formData.semesters) || formData.semesters.length === 0) {
        return res.status(400).json({ success: false, message: "Semesters are required" });
      }

      formData.semesters = formData.semesters.map(Number);

      if (!formData.createdBy && req.session.admin) {
        formData.createdBy = req.session.admin.id;
      }
      if (!formData.createdBy) {
        return res.status(400).json({ success: false, message: "createdBy is required" });
      }
      formData.createdBy = String(formData.createdBy);

      const processedSections = [];

      const sectionIndexes = new Set();
      Object.keys(formData).forEach(key => {
        const match = key.match(/^sections\[(\d+)\]/);
        if (match) sectionIndexes.add(parseInt(match[1]));
      });

      Array.from(sectionIndexes).sort((a, b) => a - b).forEach(sectionIndex => {
        const section = {
          title: formData[`sections[${sectionIndex}][title]`] || '',
          description: formData[`sections[${sectionIndex}][description]`] || '',
          questions: []
        };

        const questionIndexes = new Set();
        Object.keys(formData).forEach(key => {
          const match = key.match(new RegExp(`^sections\\[${sectionIndex}\\]\\[questions\\]\\[(\\d+)\\]`));
          if (match) questionIndexes.add(parseInt(match[1]));
        });

        Array.from(questionIndexes).sort((a, b) => a - b).forEach(questionIndex => {
          const questionPrefix = `sections[${sectionIndex}][questions][${questionIndex}]`;
          const question = {
            questionText: formData[`${questionPrefix}[questionText]`] || '',
            questionType: formData[`${questionPrefix}[questionType]`] || '',
            required: formData[`${questionPrefix}[required]`] === 'true'
          };

          if (['mcq', 'dropdown', 'rating', 'yes_no'].includes(question.questionType)) {
            const optionsKey = `${questionPrefix}[options]`;
            question.options = Array.isArray(formData[optionsKey])
              ? formData[optionsKey]
              : (formData[optionsKey] ? [formData[optionsKey]] : []);
          } else if (question.questionType === 'grid') {
            question.gridOptions = {
              rows: [],
              columns: []
            };

            const rowsKey = `${questionPrefix}[gridOptions][rows]`;
            if (formData[rowsKey]) {
              question.gridOptions.rows = Array.isArray(formData[rowsKey])
                ? formData[rowsKey]
                : [formData[rowsKey]];
            }

            const columnsKey = `${questionPrefix}[gridOptions][columns]`;
            if (formData[columnsKey]) {
              question.gridOptions.columns = Array.isArray(formData[columnsKey])
                ? formData[columnsKey]
                : [formData[columnsKey]];
            }
          }

          section.questions.push(question);
        });

        processedSections.push(section);
      });

      console.log("✅ Processed sections:", processedSections);
      formData.sections = processedSections;
    }

    // Create new feedback form
    const newForm = new FeedbackForm({
      title: formData.title,
      formType,
      createdFromTemplate: formData.templateId || null,
      academicType: formData.academicType,
      facultyAssigned: formData.facultyAssigned,
      subjects: formData.subjects || [],
      sectionsAssigned: formData.sectionsAssigned,
      semesters: formData.semesters,
      deadline: formData.deadline,
      createdBy: formData.createdBy,
      sections: formData.sections,
      status: formData.status || 'active'
    });

    console.log("📋 Form data ready to save:", newForm);
    await newForm.save();
    console.log("✅ Feedback form saved successfully");

    // ✅ Update Faculty models with this form ID
    if (Array.isArray(newForm.facultyAssigned) && newForm.facultyAssigned.length > 0) {
      await Promise.all(newForm.facultyAssigned.map(async (facultyId) => {
        try {
          const faculty = await Faculty.findById(facultyId);
          if (faculty && !faculty.feedbackForms.includes(newForm._id)) {
            faculty.feedbackForms.push(newForm._id);
            await faculty.save();
            console.log(`📌 Added form ${newForm._id} to faculty ${faculty.name}`);
          }
        } catch (err) {
          console.error(`❌ Error updating faculty ${facultyId}:`, err.message);
        }
      }));
    }

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
router.delete('/forms/:id',validateAdmin, async (req, res) => {
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
router.post('/forms/bulk-action',validateAdmin, async (req, res) => {
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
router.post('/forms/:id/update',validateAdmin , async (req, res) => {
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
router.get('/forms/:id/edit',validateAdmin , async (req, res) => {
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
router.patch('/forms/updateStatus/:formId',validateAdmin , async (req, res) => {
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
router.post('/forms/export-excel',validateAdmin , async (req, res) => {
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
//---------------------------------------------Admin Home Manage Template routes--------------------------------------------------------------------
// Template builder page
router.get('/template/template-builder',validateAdmin, (req, res) => {
  const adminId = req.session?.admin?.id;
  const adminData = req.session?.admin;

  console.log("[GET /template-builder] Admin ID:", adminId);

  res.render('template-builder', {
    userId: adminId,
    adminData,
    currentPath: '/admin/template'
  });
});
// Create new form template
router.post('/template/form-templates',validateAdmin , async (req, res) => {
  try {
    const { name, formType, createdBy, sections, academicType } = req.body;
    
    // Validate essential fields
    if (!name || !formType || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate academicType only for Academic form type
    if (formType === 'Academic' && !academicType) {
      return res.status(400).json({ error: 'Academic type is required for Academic forms' });
    }
    
    const processedSections = sections.map(section => ({
      title: section.title || 'Untitled Section',
      description: section.description || '',
      questions: (section.questions || []).map(q => {
        const question = {
          questionText: q.questionText || 'Untitled Question',
          questionType: q.questionType || 'text',
          required: q.required === true || q.required === 'true'
        };
        
        if (['mcq', 'rating', 'dropdown', 'yes_no'].includes(q.questionType)) {
          question.options = Array.isArray(q.options) ? q.options : [];
        }
        
        if (q.questionType === 'grid') {
          question.gridOptions = {
            rows: Array.isArray(q.gridOptions?.rows) ? q.gridOptions.rows : [],
            columns: Array.isArray(q.gridOptions?.columns) ? q.gridOptions.columns : []
          };
        }
        
        return question;
      })
    }));
    
    // Create template object with conditional academicType
    const templateData = {
      name,
      formType,
      createdBy,
      sections: processedSections
    };
    
    // Only add academicType if formType is Academic
    if (formType === 'Academic') {
      templateData.academicType = academicType;
    }
    
    const newTemplate = new FormTemplate(templateData);
    
    // Perform validation before saving
    const { error } = validateFormTemplate(templateData);
    if (error) {
      console.error("[POST /form-templates] Validation Error:", error.details);
      return res.status(400).json({ error: 'Validation Error', details: error.details });
    }
    
    await newTemplate.save();
    
    console.log("[POST /form-templates] Template saved:", newTemplate._id);
    res.status(201).json({ success: true, templateId: newTemplate._id });
  } catch (err) {
    console.error("[POST /form-templates] Error:", err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});
// List all templates
router.get('/template/form-templates',validateAdmin, async (req, res) => {
  try {
    const templates = await FormTemplate.find().sort({ createdAt: -1 });
    res.render('form-templates-list', {
      templates,
      adminData: req.session.admin,
      currentPath: '/admin/template'
    });
  } catch (err) {
    console.error("[GET /form-templates] Error:", err);
    res.status(500).send("Server Error");
  }
});
// View a single template
router.get('/template/form-templates/:id',validateAdmin , async (req, res) => {
  try {
    const template = await FormTemplate.findById(req.params.id);
    if (!template) {
      return res.redirect('/admin/template/form-templates?message=Template not found&status=error');
    }
    res.render('form-template-view', {
      template,
      adminData: req.session.admin,
      currentPath: '/admin/template'
    });
  } catch (err) {
    console.error("[GET /form-templates/:id] Error:", err);
    res.redirect('/admin/template/form-templates?message=Error loading template&status=error');
  }
});
// Edit a template
router.get('/template/form-templates/:id/edit',validateAdmin, async (req, res) => {
  try {
    const template = await FormTemplate.findById(req.params.id);
    if (!template) {
      return res.redirect('/admin/template/form-templates?message=Template not found&status=error');
    }
    
    // Safely prepare the template data for serialization
    const safeTemplate = JSON.parse(JSON.stringify(template));
    
    res.render('form-template-edit', {
      template: safeTemplate,
      adminData: req.session.admin,
      currentPath: '/admin/template'
    });
  } catch (err) {
    console.error("[GET /form-templates/:id/edit] Error:", err);
    res.redirect('/admin/template/form-templates?message=Error loading template&status=error');
  }
});
// Update template
router.post('/template/form-templates/:id',validateAdmin, async (req, res) => {
  try {
    const { name, formType, createdBy, sections, academicType } = req.body;

    console.log("Incoming Request Body:", req.body);

    if (!name || !formType || !Array.isArray(sections)) {
      console.warn("Missing fields - name:", name, "formType:", formType, "sections:", sections);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log("formType:", formType);
    console.log("academicType:", academicType); // log academicType separately

    const processedSections = sections.map((section, sectionIndex) => {
      console.log(`Processing Section ${sectionIndex + 1}:`, section);

      const processedQuestions = (section.questions || []).map((q, qIndex) => {
        console.log(`--> Processing Question ${qIndex + 1} in Section ${sectionIndex + 1}:`, q);

        const question = {
          questionText: q.questionText || 'Untitled Question',
          questionType: q.questionType || 'text',
          required: q.required === true || q.required === 'true'
        };

        if (['mcq', 'rating', 'dropdown', 'yes_no'].includes(q.questionType)) {
          question.options = Array.isArray(q.options) ? q.options : [];
        }

        if (q.questionType === 'grid') {
          question.gridOptions = {
            rows: Array.isArray(q.gridOptions?.rows) ? q.gridOptions.rows : [],
            columns: Array.isArray(q.gridOptions?.columns) ? q.gridOptions.columns : []
          };
        }

        return question;
      });

      return {
        title: section.title || 'Untitled Section',
        description: section.description || '',
        questions: processedQuestions
      };
    });

    console.log("Processed Sections:", processedSections);

    const updateData = {
      name,
      formType,
      createdBy,
      sections: processedSections
    };

    // Optional: add academicType only if provided
    if (academicType) {
      updateData.academicType = academicType;
      console.log("Adding academicType to update:", academicType);
    }

    const updatedTemplate = await FormTemplate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      console.warn("Template not found with ID:", req.params.id);
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log("Updated Template Successfully:", updatedTemplate._id);

    res.status(200).json({ success: true, templateId: updatedTemplate._id });

  } catch (err) {
    console.error("[POST /form-templates/:id] Error:", err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});
// Delete template
router.post('/template/form-templates/:id/delete',validateAdmin, async (req, res) => {
  try {
    const deleted = await FormTemplate.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.redirect('/admin/template/form-templates?message=Template not found&status=error');
    }
    res.redirect('/admin/template/form-templates?message=Template deleted successfully&status=success');
  } catch (err) {
    console.error("[POST /form-templates/:id/delete] Error:", err);
    res.redirect('/admin/template/form-templates?message=Failed to delete template&status=error');
  }
});
//---------------------------------------------Admin Home Manage Faculty Member routes--------------------------------------------------------------------
// Route to assign a form to a faculty member
router.post('/assign-form-to-faculty',validateAdmin, async (req, res) => {
  console.log('\n🔹 Route hit: /admin/assign-form-to-faculty');
  console.log('📌 Request body:', req.body);
  
  try {
      // Extract facultyId and formId from any potential source
      let facultyId = req.body.facultyId || (req.body.get && req.body.get('facultyId'));
      let formId = req.body.formId || (req.body.get && req.body.get('formId'));
      
      console.log(`📝 Extracted facultyId: ${facultyId}, formId: ${formId}`);
      
      // Validate input
      if (!facultyId || !formId) {
          console.log('❌ Validation failed: Missing facultyId or formId');
          return res.status(400).json({ 
              success: false, 
              message: 'Faculty ID and Form ID are required' 
          });
      }

      console.log(`🔍 Looking for faculty with ID: ${facultyId}`);
      // Find the faculty
      const faculty = await Faculty.findById(facultyId);
      if (!faculty) {
          console.log(`❌ Faculty with ID ${facultyId} not found`);
          return res.status(404).json({ 
              success: false, 
              message: 'Faculty not found' 
          });
      }
      console.log(`✅ Faculty found: ${faculty.name}`);

      console.log(`🔍 Looking for form with ID: ${formId}`);
      // Find the form
      const form = await FeedbackForm.findById(formId);
      if (!form) {
          console.log(`❌ Form with ID ${formId} not found`);
          return res.status(404).json({ 
              success: false, 
              message: 'Form not found' 
          });
      }
      console.log(`✅ Form found: ${form.title}`);

      // Initialize feedbackForms array if it doesn't exist
      if (!faculty.feedbackForms) {
          console.log('📝 Initializing feedbackForms array for faculty');
          faculty.feedbackForms = [];
      }

      // Check if form is already assigned
      const alreadyAssigned = faculty.feedbackForms.some(id => id.toString() === formId.toString());
      if (alreadyAssigned) {
          console.log(`❌ Form ${formId} is already assigned to faculty ${facultyId}`);
          return res.status(400).json({ 
              success: false, 
              message: 'Form is already assigned to this faculty' 
          });
      }

      // Add form to faculty
      console.log(`📝 Adding form ${formId} to faculty's feedbackForms array`);
      faculty.feedbackForms.push(formId);
      console.log('💾 Saving faculty document...');
      await faculty.save();
      console.log('✅ Faculty document saved successfully');

      // Add faculty to form.facultyAssigned if it's not already there
      if (!form.facultyAssigned) {
          console.log('📝 Initializing facultyAssigned array for form');
          form.facultyAssigned = [];
      }
      
      const facultyAlreadyInForm = form.facultyAssigned.some(id => id.toString() === facultyId.toString());
      if (!facultyAlreadyInForm) {
          console.log(`📝 Adding faculty ${facultyId} to form's facultyAssigned array`);
          form.facultyAssigned.push(facultyId);
          console.log('💾 Saving form document...');
          await form.save();
          console.log('✅ Form document saved successfully');
      } else {
          console.log(`ℹ️ Faculty ${facultyId} is already in form's facultyAssigned array`);
      }

      console.log(`✅ Form ${formId} assigned to faculty ${facultyId} successfully`);
      
      return res.json({ 
          success: true, 
          message: 'Form assigned to faculty successfully' 
      });
  } catch (error) {
      console.error('❌ Error assigning form to faculty:', error);
      return res.status(500).json({ 
          success: false, 
          message: 'Internal server error' 
      });
  }
});
// Route to remove a form from a faculty
router.post('/remove-form-from-faculty',validateAdmin, async (req, res) => {
  console.log('\n🔹 Route hit: /admin/remove-form-from-faculty');
  console.log('📌 Request body:', req.body);
  
  try {
      // Extract facultyId and formId from any potential source
      let facultyId = req.body.facultyId || (req.body.get && req.body.get('facultyId'));
      let formId = req.body.formId || (req.body.get && req.body.get('formId'));
      
      console.log(`📝 Extracted facultyId: ${facultyId}, formId: ${formId}`);
      
      // Validate input
      if (!facultyId || !formId) {
          console.log('❌ Validation failed: Missing facultyId or formId');
          return res.status(400).json({ 
              success: false, 
              message: 'Faculty ID and Form ID are required' 
          });
      }

      console.log(`🔍 Looking for faculty with ID: ${facultyId}`);
      // Find the faculty
      const faculty = await Faculty.findById(facultyId);
      if (!faculty) {
          console.log(`❌ Faculty with ID ${facultyId} not found`);
          return res.status(404).json({ 
              success: false, 
              message: 'Faculty not found' 
          });
      }
      console.log(`✅ Faculty found: ${faculty.name}`);

      // Check if faculty has the form
      console.log(`🔍 Checking if form ${formId} is assigned to faculty`);
      const hasForm = faculty.feedbackForms && 
                     faculty.feedbackForms.some(id => id.toString() === formId.toString());
      
      if (!hasForm) {
          console.log(`❌ Form ${formId} is not assigned to faculty ${facultyId}`);
          return res.status(400).json({ 
              success: false, 
              message: 'Form is not assigned to this faculty' 
          });
      }
      console.log(`✅ Form ${formId} is assigned to faculty, proceeding with removal`);

      // Remove form from faculty
      console.log(`📝 Removing form ${formId} from faculty's feedbackForms array`);
      faculty.feedbackForms = faculty.feedbackForms.filter(id => id.toString() !== formId.toString());
      console.log('💾 Saving faculty document...');
      await faculty.save();
      console.log('✅ Faculty document saved successfully');

      // Also remove faculty from form.facultyAssigned
      console.log(`🔍 Looking for form with ID: ${formId}`);
      const form = await FeedbackForm.findById(formId);
      if (form && form.facultyAssigned) {
          console.log(`📝 Removing faculty ${facultyId} from form's facultyAssigned array`);
          form.facultyAssigned = form.facultyAssigned.filter(id => id.toString() !== facultyId.toString());
          console.log('💾 Saving form document...');
          await form.save();
          console.log('✅ Form document saved successfully');
      } else {
          console.log(`ℹ️ Form ${formId} not found or has no facultyAssigned array`);
      }

      console.log(`✅ Form ${formId} removed from faculty ${facultyId} successfully`);
      
      return res.json({ 
          success: true, 
          message: 'Form removed from faculty successfully' 
      });
  } catch (error) {
      console.error('❌ Error removing form from faculty:', error);
      return res.status(500).json({ 
          success: false, 
          message: 'Internal server error' 
      });
  }
});
// Route for bulk assignment of forms to faculty members
router.post('/bulk-assign-forms',validateAdmin, async (req, res) => {
  console.log('\n🔹 Route hit: /admin/bulk-assign-forms');
  console.log('📌 Request body:', req.body);
  
  try {
      // Extract formId and facultyIds from any potential source
      let formId = req.body.formId || (req.body.get && req.body.get('formId'));
      let facultyIds = req.body.facultyIds || 
                      (req.body['facultyIds[]']) || 
                      (req.body.get && req.body.get('facultyIds[]'));
      
      // Ensure facultyIds is an array
      if (facultyIds && !Array.isArray(facultyIds)) {
          facultyIds = [facultyIds];
      }
      
      console.log(`📝 Extracted formId: ${formId}, facultyIds:`, facultyIds);
      
      // Validate input
      if (!formId || !facultyIds || !Array.isArray(facultyIds) || facultyIds.length === 0) {
          console.log('❌ Validation failed: Missing formId or facultyIds array');
          return res.status(400).json({ 
              success: false, 
              message: 'Form ID and at least one Faculty ID are required' 
          });
      }

      console.log(`🔍 Looking for form with ID: ${formId}`);
      // Find the form
      const form = await FeedbackForm.findById(formId);
      if (!form) {
          console.log(`❌ Form with ID ${formId} not found`);
          return res.status(404).json({ 
              success: false, 
              message: 'Form not found' 
          });
      }
      console.log(`✅ Form found: ${form.title}`);

      // Initialize facultyAssigned array if it doesn't exist
      if (!form.facultyAssigned) {
          console.log('📝 Initializing facultyAssigned array for form');
          form.facultyAssigned = [];
      }

      console.log(`🔄 Processing ${facultyIds.length} faculty members for bulk assignment`);
      // Process each faculty
      const results = {
          success: [],
          failed: []
      };

      for (const facultyId of facultyIds) {
          console.log(`\n🔍 Processing faculty ID: ${facultyId}`);
          try {
              // Find the faculty
              const faculty = await Faculty.findById(facultyId);
              if (!faculty) {
                  console.log(`❌ Faculty with ID ${facultyId} not found`);
                  results.failed.push({ facultyId, reason: 'Faculty not found' });
                  continue;
              }
              console.log(`✅ Faculty found: ${faculty.name}`);

              // Initialize feedbackForms array if it doesn't exist
              if (!faculty.feedbackForms) {
                  console.log('📝 Initializing feedbackForms array for faculty');
                  faculty.feedbackForms = [];
              }

              // Check if form is already assigned
              const alreadyAssigned = faculty.feedbackForms.some(id => id.toString() === formId.toString());
              if (alreadyAssigned) {
                  console.log(`❌ Form ${formId} is already assigned to faculty ${facultyId}`);
                  results.failed.push({ facultyId, reason: 'Form already assigned' });
                  continue;
              }

              // Add form to faculty
              console.log(`📝 Adding form ${formId} to faculty's feedbackForms array`);
              faculty.feedbackForms.push(formId);
              console.log('💾 Saving faculty document...');
              await faculty.save();
              console.log('✅ Faculty document saved successfully');

              // Add faculty to form if not already there
              const facultyAlreadyInForm = form.facultyAssigned.some(id => id.toString() === facultyId.toString());
              if (!facultyAlreadyInForm) {
                  console.log(`📝 Adding faculty ${facultyId} to form's facultyAssigned array`);
                  form.facultyAssigned.push(facultyId);
              } else {
                  console.log(`ℹ️ Faculty ${facultyId} is already in form's facultyAssigned array`);
              }

              results.success.push(facultyId);
              console.log(`✅ Successfully processed faculty ${facultyId}`);
          } catch (error) {
              console.error(`❌ Error processing faculty ${facultyId}:`, error);
              results.failed.push({ facultyId, reason: 'Processing error' });
          }
      }

      // Save the form after all faculty updates
      console.log('💾 Saving form document with all faculty assignments...');
      await form.save();
      console.log('✅ Form document saved successfully');

      console.log(`✅ Form ${formId} bulk assigned to ${results.success.length} faculties successfully`);
      console.log(`ℹ️ Assignment failed for ${results.failed.length} faculties`);
      
      return res.json({ 
          success: true, 
          message: `Form assigned to ${results.success.length} faculty members successfully`,
          results
      });
  } catch (error) {
      console.error('❌ Error in bulk form assignment:', error);
      return res.status(500).json({ 
          success: false, 
          message: 'Internal server error' 
      });
  }
});
// Route to get all available forms for assignment
router.get('/available-forms',validateAdmin, async (req, res) => {
  console.log('\n🔹 Route hit: /admin/available-forms');
  
  try {
      console.log('🔍 Finding all active forms');
      const forms = await FeedbackForm.find({ status: 'active' }, 'title formType');
      console.log(`✅ Found ${forms.length} active forms`);
      
      return res.json({
          success: true,
          forms
      });
  } catch (error) {
      console.error('❌ Error getting available forms:', error);
      return res.status(500).json({
          success: false,
          message: 'Internal server error'
      });
  }
});
// Route to get faculty details with assigned forms
router.get('/faculty/:id/details',validateAdmin, async (req, res) => {
  const facultyId = req.params.id;
  console.log(`\n🔹 Route hit: /admin/faculty/${facultyId}/details`);
  
  try {
      console.log(`🔍 Looking for faculty with ID: ${facultyId} and populating feedbackForms`);
      // Find faculty with populated forms
      const faculty = await Faculty.findById(facultyId).populate('feedbackForms');
      
      if (!faculty) {
          console.log(`❌ Faculty with ID ${facultyId} not found`);
          return res.status(404).json({
              success: false,
              message: 'Faculty not found'
          });
      }
      
      console.log(`✅ Faculty found: ${faculty.name}`);
      console.log(`ℹ️ Faculty has ${faculty.feedbackForms ? faculty.feedbackForms.length : 0} assigned forms`);
      
      return res.json({
          success: true,
          faculty
      });
  } catch (error) {
      console.error('❌ Error getting faculty details:', error);
      return res.status(500).json({
          success: false,
          message: 'Internal server error'
      });
  }
});
// Add this route to your Express router file
router.get('/export-faculty-data', async (req, res) => {
  try {
      // Get branch filter from query params if provided
      const branchFilter = req.query.branch;
      
      // Create query object
      const query = {};
      if (branchFilter && branchFilter !== 'all') {
          query.branch = branchFilter;
      }
      
      // Fetch all faculty members with populated feedback forms
      const faculties = await Faculty.find(query)
          .populate({
              path: 'feedbackForms',
              select: 'title status formType'
          });
      
      if (!faculties || faculties.length === 0) {
          return res.status(404).send('No faculty data found to export');
      }
      
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Faculty Data');
      
      // Add header row
      worksheet.columns = [
          { header: 'Name', key: 'name', width: 20 },
          { header: 'ID', key: 'id', width: 15 },
          { header: 'Branch', key: 'branch', width: 10 },
          { header: 'Sections', key: 'sections', width: 15 },
          { header: 'Assigned Form', key: 'form', width: 30 },
          { header: 'Form Status', key: 'status', width: 15 },
          { header: 'Date', key: 'date', width: 15 }
      ];
      
      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEEEEEE' }
      };
      
      // Get current date
      const currentDate = new Date().toLocaleDateString();
      
      // Add data rows
      faculties.forEach(faculty => {
          if (faculty.feedbackForms && faculty.feedbackForms.length > 0) {
              // Add a row for each form assigned to this faculty
              faculty.feedbackForms.forEach(form => {
                  worksheet.addRow({
                      name: faculty.name || 'N/A',
                      id: faculty.idNumber || 'N/A',
                      branch: faculty.branch || 'N/A',
                      sections: faculty.sections ? faculty.sections.join(', ') : 'N/A',
                      form: form.title || 'N/A',
                      status: form.status || 'N/A',
                      date: currentDate
                  });
              });
          } else {
              // Add a single row for faculty with no forms
              worksheet.addRow({
                  name: faculty.name || 'N/A',
                  id: faculty.idNumber || 'N/A',
                  branch: faculty.branch || 'N/A',
                  sections: faculty.sections ? faculty.sections.join(', ') : 'N/A',
                  form: 'No forms',
                  status: '-',
                  date: currentDate
              });
          }
      });
      
      // Generate filename
      const branchStr = branchFilter && branchFilter !== 'all' ? `-${branchFilter}` : '';
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Faculty-Data${branchStr}-${dateStr}.xlsx`;
      
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
      
      console.log(`Successfully exported faculty data for ${faculties.length} faculty members`);
      
  } catch (error) {
      console.error('Error exporting faculty data:', error);
      res.status(500).send('Failed to export faculty data');
  }
});
module.exports = router;