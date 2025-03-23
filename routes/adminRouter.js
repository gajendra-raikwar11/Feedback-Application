const express = require('express');
const router = express.Router();

const { adminModel } = require("../models/adminSchema");
const validateAdmin = require("../middlewares/adminValidate");
const sendOTPByEmail = require('../config/NodeMailer');
const flash = require("express-flash");
const { Faculty, validateFaculty, validateFacultyLogin } = require("../models/facultySchema");
const { Student, validateStudent } = require("../models/studentSchema");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const { FeedbackForm, validateFeedbackForm } = require('../models/feedbackForm');

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
            let token = jwt.sign({ email: email, id: validAdmin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
router.get("/adminHome", validateAdmin, async (req, res) => {
    try {
        const subjectFilter = req.query.subject; // Get subject from query params
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

        const adminData = req.session.admin;
        // Determine the current path dynamically
        const currentPath = req.path;

        res.render("adminHome", { 
            currentPath, 
            adminData, 
            uniqueSubjects, 
            faculties, 
            students, 
            uniqueSections,
            forms // Send forms data to the EJS template
        });
    } catch (e) {
        console.error(e);
        res.status(500).send("Server Error");
    }
});

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
        const sectionCategories = ["CSE-A", "CSE-B", "IT-A", "IT-B", "ECE-A", "ECE-B"];

        res.render('CreateFeedbackForms', {
            formType,
            faculties,
            sectionCategories,
            currentPath: req.path,
            adminData: req.session.admin || {} 
        });

    } catch (error) {
        console.error('Error loading form creation page:', error);
        res.status(500).send("Server error");
    }
});

// POST route for form creation - Fix for JSON handling
router.post('/adminHome/forms/create/:formType', async (req, res) => {
    try {
        let { formType } = req.params;

        // Convert formType to Title Case
        formType = formType.charAt(0).toUpperCase() + formType.slice(1).toLowerCase();

        // Validate form type
        const validFormTypes = ["Academic", "Institutional", "Training"];
        if (!validFormTypes.includes(formType)) {
            return res.status(400).json({ success: false, message: "Invalid form type" });
        }

        // Check content type and parse correctly
        let formData = req.body;
        
        // Log request content type and body for debugging
        console.log("Content-Type:", req.headers['content-type']);
        console.log("Request body type:", typeof req.body);
        
        // Handle JSON parsing from string if needed (add body-parser middleware properly)
        if (typeof req.body === 'string') {
            try {
                formData = JSON.parse(req.body);
            } catch (e) {
                console.error("JSON Parsing Error:", e);
                return res.status(400).json({ success: false, message: "Invalid JSON format" });
            }
        }

        // Ensure formType is properly set in the form data
        formData.formType = formType;

        // Create a new feedback form
        const newForm = new FeedbackForm({
            title: formData.title,
            formType,
            facultyAssigned: formData.facultyAssigned || [],
            sectionsAssigned: formData.sectionsAssigned || [],
            questions: formData.questions || [],
            deadline: formData.deadline,
            semester: formData.semester,
            createdBy: req.session.admin ? req.session.admin.id : null,
            status: formData.status || 'active'
        });

        // Save to database
        await newForm.save();

        // Return JSON response with correct status
        return res.status(201).json({ 
            success: true, 
            message: `${formType} feedback form created successfully`,
            redirect: '/admin/Total-Forms' // Provide correct redirect URL
        });

    } catch (error) {
        console.error('Error creating feedback form:', error);
        return res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
});

// Form listing route - shows all forms as cards
// router.get('/Total-Forms', validateAdmin, async (req, res) => {
//     try {
//         // Fetch forms from database
//         const forms = await FeedbackForm.find({}).lean();
        
//         // Format the forms for display
//         const formattedForms = forms.map(form => {
//           return {
//             _id: form._id,
//             title: form.title,
//             formType: form.formType,
//             startDate: form.deadline, // Using deadline as startDate
//             endDate: form.deadline,   // Using deadline as endDate
//             isActive: form.status === 'active',
//             department: 'Information Technology', // Default department
//             sections: [{ title: 'Section 1' }], // Assuming one section for each form
//             facultyAssignments: form.facultyAssigned.map(id => ({ 
//               facultyId: id, 
//               facultyName: `Faculty #${id.substring(0, 8)}` 
//             })),
//             classAssignments: [{
//               classes: form.sectionsAssigned || []
//             }],
//             submissionCount: Math.floor(Math.random() * 100) // Random submission count for demo
//           };
//         });
        
//         res.render('TotalForms', { 
//           forms: formattedForms,
//           adminData: req.session.admin,
//           currentPath:req.path
//         });
//       } catch (error) {
//         console.error('Error fetching forms:', error);
//         res.status(500).send('Error fetching forms');
//         res.redirect('/admin/adminHome');
//       }
// });

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

router.get('/forms/:id/edit', async (req, res) => {
    try {
        const formId = req.params.id;
        
        // Fetch the form data
        const form = await FeedbackForm.findById(formId);
        
        if (!form) {
            return res.status(404).render('error', {
                message: 'Form not found',
                error: { status: 404 }
            });
        }
        
        // Fetch faculty list for assignment
        const faculties = await Faculty.find({}).sort('name');
        
        // Get available section categories
        const sectionCategories = ["CSE-A", "CSE-B", "IT-A", "IT-B", "ECE-A", "ECE-B"];
        
        // Render the edit form view
        res.render('EditForm', {
            title: 'Edit Feedback Form',
            form,
            faculties,
            sectionCategories,
            adminData: req.session.admin,
            currentPath: req.path
        });
    } catch (error) {
        console.error('Error fetching form details:', error);
        res.status(500).render('error', {
            message: 'Internal Server Error',
            error: { status: 500 }
        });
    }
});

/**
 * Route for updating the form
 */
router.post('/forms/:id/update', async (req, res) => {
    try {
        const formId = req.params.id;
        const formData = req.body;
        
        // Process questions data
        const questions = [];
        
        if (formData.questions) {
            for (const key in formData.questions) {
                const question = formData.questions[key];
                
                // Create question object
                const questionObj = {
                    questionText: question.questionText,
                    questionType: question.questionType,
                    required: question.required === 'true'
                };
                
                // Process options for mcq, dropdown, rating
                if (['mcq', 'dropdown', 'rating'].includes(question.questionType) && question.optionsText) {
                    questionObj.options = question.optionsText.split(',').map(option => option.trim());
                }
                
                // Process grid options
                if (question.questionType === 'grid') {
                    questionObj.gridOptions = {
                        rows: question.gridRows ? question.gridRows.split(',').map(row => row.trim()) : [],
                        columns: question.gridColumns ? question.gridColumns.split(',').map(column => column.trim()) : []
                    };
                }
                
                questions.push(questionObj);
            }
        }
        
        // Update form data
        const updatedForm = await FeedbackForm.findByIdAndUpdate(
            formId,
            {
                title: formData.title,
                deadline: formData.deadline || null,
                semester: formData.semester,
                status: formData.status || 'closed',
                facultyAssigned: formData.facultyAssigned || [],
                sectionsAssigned: formData.sectionsAssigned || [],
                questions,
                updatedAt: new Date()
            },
            { new: true }
        );
        
        if (!updatedForm) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Form updated successfully',
            form: updatedForm
        });
    } catch (error) {
        console.error('Error updating form:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
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
module.exports = router;