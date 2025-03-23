const express = require("express");
const path = require("path");
const router = express.Router();
require("../config/mongoose");
const mongoose = require("mongoose");
const session = require("express-session");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Student, validateStudent } = require("../models/studentSchema");
const MongoStore = require("connect-mongo");
const authorizedStudentsPath = path.join(__dirname, "..", "authorized_students.json");
const authorizedStudents = JSON.parse(fs.readFileSync(authorizedStudentsPath, "utf-8"));
const sendOTPByEmail = require("../config/NodeMailer");
const studentValidate = require("../middlewares/studentValidate");
const { FeedbackForm, validateFeedbackForm } = require('../models/feedbackForm');
const { Faculty, validateFaculty, validateFacultyLogin } = require("../models/facultySchema");
const { isLoggedIn }=require("../middlewares/isLoggedIn")
const { FeedbackResponse, validateFeedbackResponse }=require("../models/feedbackResponse");

router.use(
    session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL }),
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);
// Student Login (without studentValidate, because user is logging in)
router.post("/studentLogin", async (req, res) => {
    const { email, password } = req.body;

    const authorizedStudent = authorizedStudents.find(
        (student) => student.email === email && student.password === password
    );

    if (authorizedStudent) {
        try {
            let student = await Student.findOne({ email });

            if (!student) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                const studentData = {
                    ...authorizedStudent,
                    password: hashedPassword,
                };

                const { error } = validateStudent(studentData);
                if (error) return res.status(400).send(error.details[0].message);

                student = new Student(studentData);
                await student.save();

                console.log(`User account created for ${student.name}`);
            } else {
                console.log(`User ${student.name} logged in now.`);
            }

            req.session.studentId = student._id.toString();
            await req.session.save();

            const token = jwt.sign(
                { _id: student._id, name: student.name },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 1000,
            });

            res.redirect("/student/studentHomepage");
        } catch (error) {
            console.error("Error processing login:", error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.status(401).send("Invalid email or password. You are not an authorized student.");
    }
});
// Student Homepage (Protected Route)
router.get("/studentHomepage", studentValidate, async (req, res) => {
  try {
      const student = req.student;
      const studentId = student._id.toString();
      
      // Find all active feedback forms assigned to the student's section
      const allForms = await FeedbackForm.find({
          status: "active",
          sectionsAssigned: { $in: [student.section] }
      }).lean();
      
      // Count stats
      let availableForms = 0;
      let pendingForms = 0;
      let completedForms = 0;
      
      // Process each form to determine its status for this student
      allForms.forEach(form => {
          // Check if the student has already submitted this form
          const hasSubmitted = form.responses && 
                             form.responses.some(response => 
                               response.studentId && response.studentId.toString() === studentId);
          
          // Check if the form is still active (deadline hasn't passed)
          const isActive = new Date() <= new Date(form.deadline);
          
          if (isActive) {
              availableForms++;
              
              if (hasSubmitted) {
                  completedForms++;
              } else {
                  pendingForms++;
              }
          } else if (hasSubmitted) {
              // Count completed forms even if they're no longer active
              completedForms++;
          }
      });
      
      res.render("studentHomepage", { 
          student: req.student, 
          currentPage: req.path,
          formStats: {
              availableForms,
              pendingForms,
              completedForms
          }
      });
  } catch (error) {
      console.error("Error fetching student:", error);
      res.redirect("/studentLogin");
  }
});
// API route for updating profile within dashboard
router.put('/update-profile', studentValidate, async (req, res) => {
  try {
    // Use req.session.studentId instead of req.user._id
    if (!req.session.studentId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login again.'
      });
    }
    
    const { name, email, ContactNumber, Address } = req.body;
    
    // Find and update the student document
    const updatedStudent = await Student.findByIdAndUpdate(
      req.session.studentId,
      { name, email, ContactNumber, Address },
      { new: true, runValidators: true }
    );
    
    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      student: updatedStudent
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});
// Student Forms Page (Protected Route)
router.get("/studentFormsPage", studentValidate, async (req, res) => {
    try {
      // Get the current student from the middleware
      const student = req.student;
      
      // Find all active feedback forms where at least one assignedSection matches the student's section
      const forms = await FeedbackForm.find({
        status: "active",
        sectionsAssigned: { $in: [student.section] }
      }).lean();
      
      // If no forms are found, render the page with empty forms array
      if (!forms || forms.length === 0) {
        return res.render("studentFormsPage", {
          student: student,
          forms: [],
          currentPage: req.path
        });
      }
      
      // Get all faculty IDs from forms
      const facultyIds = forms.reduce((ids, form) => {
        return ids.concat(form.facultyAssigned);
      }, []);
      
      // Fetch all relevant faculty members in one query
      const facultyMembers = await Faculty.find({
        _id: { $in: facultyIds }
      }).lean();
      
      // Create a map of faculty IDs to faculty objects for quick lookup
      const facultyMap = {};
      facultyMembers.forEach(faculty => {
        facultyMap[faculty._id.toString()] = faculty;
      });
      
      // Enhance each form with the appropriate faculty for this student
      const enhancedForms = forms.map(form => {
        // Find faculty members assigned to this form who teach the student's section
        const relevantFaculty = [];
        
        for (const facultyId of form.facultyAssigned) {
          const faculty = facultyMap[facultyId.toString()];
          if (!faculty) {
            continue;
          }
          
          // Ensure sections exists
          if (!faculty.sections) {
            continue;
          }
          
          // Check if faculty teaches student's section
          const teachesStudentSection = faculty.sections.includes(student.section);
          if (teachesStudentSection) {
            relevantFaculty.push(faculty);
          }
        }
        
        // Find the common section between student, form, and faculty
        let commonSection = null;
        if (relevantFaculty.length > 0) {
          const faculty = relevantFaculty[0];
          // Find intersection between form sections and faculty sections
          const formSections = form.sectionsAssigned || [];
          const facultySections = faculty.sections || [];
          
          // Find common sections
          const commonSections = formSections.filter(section => 
            facultySections.includes(section) && section === student.section
          );
          
          if (commonSections.length > 0) {
            commonSection = commonSections[0];
          }
        }
        
        // Add the relevant faculty to the form
        return {
          ...form,
          assignedFacultyForStudent: relevantFaculty.length > 0 ? relevantFaculty[0] : null,
          assignedFacultyName: relevantFaculty.length > 0 ? relevantFaculty[0].name : "Not Assigned",
          commonSection: commonSection || student.section // Default to student section if no common section found
        };
      });
      
      // Filter out forms that don't have a faculty teaching the student's section
      const filteredForms = enhancedForms.filter(form => form.assignedFacultyForStudent !== null);
      
      // Check submission status
      const studentId = student._id.toString();
      filteredForms.forEach(form => {
        const hasSubmitted = form.responses && 
                           form.responses.some(response => 
                             response.studentId && response.studentId.toString() === studentId);
        form.hasSubmitted = hasSubmitted;
        form.canSubmit = new Date() <= new Date(form.deadline);
        
        // if (form.assignedFacultyForStudent) {
        //   console.log(`Faculty assigned: ${form.assignedFacultyName}`);
        //   console.log(`Common section: ${form.commonSection}`);
        // }
      });
      
      // Render the page with the enhanced forms
      res.render("studentFormsPage", {
        student: student,
        forms: filteredForms,
        currentPage: req.path
      });
      
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.redirect("/studentLogin");
    }
  });
// Route to preview a form
router.get('/previewForm/:id', studentValidate, async (req, res) => {
  try {
    const formId = req.params.id;
    
    // Use req.student instead of req.user
    const studentId = req.student._id;
    const userSection = req.student.section;

    // FIRST CHECK: Check if the student has already submitted this form
    const existingSubmission = await FeedbackResponse.findOne({
      formID: formId,
      studentID: studentId
    }).lean();
    if (existingSubmission) {
      // If already submitted, redirect with query parameters to show resubmission attempt message
      return res.redirect(`/student/studentFormsPage?resubmitAttempt=true&formId=${formId}`);
    }
    
    // Find the form without populate
    const form = await FeedbackForm.findById(formId);
    
    if (!form) {
      req.flash('error', 'Form not found');
      return res.redirect('/student/studentFormsPage');
    }
    
    // Check if the user has access to this form based on their section
    let hasAccess = false;
    
    // If form has sections specified, check if user's section is included
    if (form.sections && form.sections.length > 0) {
      hasAccess = form.sections.includes(userSection);
    } 
    // If form has a commonSection, check if it matches user's section
    else if (form.commonSection) {
      hasAccess = form.commonSection === userSection;
    }
    // If form has sectionsAssigned, check if user's section is included
    else if (form.sectionsAssigned && form.sectionsAssigned.length > 0) {
      hasAccess = form.sectionsAssigned.includes(userSection);
    }
    // If no sections are specified, allow access (general form)
    else {
      hasAccess = true;
    }

    if (!hasAccess) {
      req.flash('error', 'You do not have access to this form');
      return res.redirect('/student/studentFormsPage');
    }
    
    // Set values for form submission status
    form.hasSubmitted = false;
    
    // Check if the form is still open for submission based on deadline
    const currentDate = new Date();
    form.canSubmit = currentDate <= new Date(form.deadline);
    
    // NEW APPROACH: Find faculty who teach the student's section
    let facultyForSection = "No faculty assigned for your section";
    
    if (form.facultyAssigned && Array.isArray(form.facultyAssigned)) {
      // Get all faculty info at once
      const facultyIds = form.facultyAssigned;
      
      const facultyMembers = await Faculty.find({ _id: { $in: facultyIds } });
      
      // Log faculty section assignments for debugging
      // facultyMembers.forEach(faculty => {
      //   console.log(`Faculty ${faculty._id} teaches sections:`, faculty.sections);
      // });
      
      // First try: Use direct faculty-section mapping from Faculty model
      // Find a faculty who teaches the student's section
      const matchingFaculty = facultyMembers.find(faculty => 
        faculty.sections && faculty.sections.includes(userSection)
      );
      
      if (matchingFaculty) {
        facultyForSection = matchingFaculty.name || matchingFaculty.fullName;
      } 
      // Second try: Use the sectionsAssigned parallel array
      else if (form.sectionsAssigned && Array.isArray(form.sectionsAssigned)) {
        // Check if faculty is assigned to the student's section via the parallel arrays
        for (let i = 0; i < form.sectionsAssigned.length; i++) {
          if (form.sectionsAssigned[i] === userSection && i < facultyIds.length) {
            const facultyId = facultyIds[i];
            const faculty = facultyMembers.find(f => f._id.toString() === facultyId.toString());
            
            if (faculty) {
              facultyForSection = faculty.name || faculty.fullName;
              break;
            }
          }
        }
      }
      
      // Third try: If there's a commonSection, find any faculty assigned to it
      if (facultyForSection === "No faculty assigned for your section" && form.commonSection === userSection) {
        const facultyForCommonSection = facultyMembers.find(faculty => 
          faculty.sections && faculty.sections.includes(form.commonSection)
        );
        
        if (facultyForCommonSection) {
          facultyForSection = facultyForCommonSection.name || facultyForCommonSection.fullName;
        }
      }
    }
    // Add the faculty name to the form object for the template to use
    form.facultyForCurrentStudent = facultyForSection;
    
    res.render('previewForm', { 
      title: 'Preview Form',
      form: form,
      user: req.student,
      isPreviewOnly: true,
      currentPage: '/student/studentFormsPage'
    });
    
  } catch (error) {
    console.error('Error in form preview:', error);
    req.flash('error', 'An error occurred while retrieving the form: ' + error.message);
    res.redirect('/student/studentFormsPage');
  }
});
// GET/POST route to display the form for submission
router.get('/submitForm/:id', studentValidate, async (req, res) => {
  try {
    const formId = req.params.id;
    const studentId = req.student._id;
    const userSection = req.student.section;
    
    // Check for success message in query params (for redirection after successful submission)
    const successMessage = req.query.success;
    
    // FIRST CHECK: Check if the student has already submitted this form
    const existingSubmission = await FeedbackResponse.findOne({
      formID: formId,
      studentID: studentId
    }).lean();
    
    if (existingSubmission) {
      // If already submitted, redirect with query parameters to show resubmission attempt message
      return res.redirect(`/student/studentFormsPage?resubmitAttempt=true&formId=${formId}`);
    }
    
    // Find the form with complete information, using lean() for better performance
    const form = await FeedbackForm.findById(formId).lean();
    
    if (!form) {
      req.flash('error', 'Form not found');
      return res.redirect('/student/studentFormsPage');
    }
    
    // Check if the user has access to this form based on their section
    let hasAccess = false;
    
    if (form.sectionsAssigned && form.sectionsAssigned.length > 0) {
      // Primary check - use sectionsAssigned array
      hasAccess = form.sectionsAssigned.includes(userSection);
    } else if (form.sections && form.sections.length > 0) {
      // Secondary check - use sections array if available
      hasAccess = form.sections.includes(userSection);
    } else if (form.commonSection) {
      // Tertiary check - use commonSection if specified
      hasAccess = form.commonSection === userSection;
    } else {
      // If no sections are specified, allow access (general form)
      hasAccess = true;
    }
    
    if (!hasAccess) {
      req.flash('error', 'You do not have access to this form');
      return res.redirect('/student/studentFormsPage');
    }
    
    // Check if the form is still open for submission
    const currentDate = new Date();
    if (currentDate > new Date(form.deadline)) {
      req.flash('error', 'The deadline for this form has passed');
      return res.redirect('/student/studentFormsPage');
    }
    
    // Find faculty for student's section
    let facultyForSection = "No faculty assigned for your section";
    let facultyId = null;
    
    if (form.facultyAssigned && Array.isArray(form.facultyAssigned) && form.facultyAssigned.length > 0) {
      // Get all faculty info in a single query for efficiency
      const facultyMembers = await Faculty.find({ 
        _id: { $in: form.facultyAssigned } 
      }).lean();
      
      // Method 1: Direct faculty-section mapping from Faculty model
      const matchingFaculty = facultyMembers.find(faculty => 
        faculty.sections && faculty.sections.includes(userSection)
      );
      
      if (matchingFaculty) {
        facultyForSection = matchingFaculty.name || matchingFaculty.fullName;
        facultyId = matchingFaculty._id;
      } 
      // Method 2: Use parallel arrays of sectionsAssigned and facultyAssigned
      else if (form.sectionsAssigned && Array.isArray(form.sectionsAssigned)) {
        for (let i = 0; i < form.sectionsAssigned.length; i++) {
          if (form.sectionsAssigned[i] === userSection && i < form.facultyAssigned.length) {
            const fId = form.facultyAssigned[i];
            const faculty = facultyMembers.find(f => f._id.toString() === fId.toString());
            
            if (faculty) {
              facultyForSection = faculty.name || faculty.fullName;
              facultyId = faculty._id;
              break;
            }
          }
        }
      }
      // Method 3: For common section forms
      if (!facultyId && form.commonSection === userSection) {
        const facultyForCommonSection = facultyMembers.find(faculty => 
          faculty.sections && faculty.sections.includes(form.commonSection)
        );
        
        if (facultyForCommonSection) {
          facultyForSection = facultyForCommonSection.name || facultyForCommonSection.fullName;
          facultyId = facultyForCommonSection._id;
        }
      }
    }
    
    if (!facultyId) {
      req.flash('error', 'No faculty found assigned to your section');
      return res.redirect('/student/studentFormsPage');
    }
    
    // Process questions to ensure they have consistent structure
    const processedQuestions = (form.questions || []).map(question => {
      return {
        _id: question._id,
        text: question.questionText || question.text || "",
        type: question.questionType || question.type || "text",
        description: question.description || "",
        required: question.required || false,
        options: Array.isArray(question.options) ? question.options : [],
        // Handle grid type questions if they exist
        gridOptions: question.gridOptions || {
          rows: [],
          columns: []
        },
        // Include date format for date type questions
        dateFormat: question.dateFormat || "YYYY-MM-DD",
        // Support for yes_no type questions
        yesNoLabels: question.yesNoLabels || { yes: "Yes", no: "No" }
      };
    });
    
    // Create a clean form object for the template
    const formData = {
      _id: form._id,
      title: form.title || "Feedback Form",
      formType: form.formType,
      deadline: form.deadline,
      semester: form.semester,
      questions: processedQuestions,
      facultyForCurrentStudent: facultyForSection
    };
    
    res.render('submitForm', { 
      title: 'Submit Feedback Form',
      form: formData,
      user: req.student,
      facultyId: facultyId,
      currentPage: '/student/studentFormsPage',
      successMessage: successMessage // Pass success message to template
    });
    
  } catch (error) {
    console.error('Error displaying submission form:', error);
    req.flash('error', 'An error occurred while retrieving the form: ' + error.message);
    res.redirect('/student/studentFormsPage');
  }
});
// router.post('/submitFormResponse/:id', studentValidate, async (req, res) => {
//   try {
//     const formId = req.params.id;
//     const studentId = req.student._id;
//     const facultyId = req.body.facultyId;
//     const studentSection = req.student.section;

    
//     // Find the form to get its questions
//     const form = await FeedbackForm.findById(formId);
    
//     if (!form) {
//       req.flash('error', 'Form not found');
//       return res.redirect('/student/studentFormsPage');
//     }
    
//     // Check if deadline has passed
//     const currentDate = new Date();
//     if (currentDate > new Date(form.deadline)) {
//       req.flash('error', 'The deadline for this form has passed');
//       return res.redirect('/student/studentFormsPage');
//     }
    
//     // Check if student has already submitted this form
//     const existingSubmission = await FeedbackResponse.findOne({
//       formID: formId,
//       studentID: studentId
//     });
    
//     if (existingSubmission) {
//       req.flash('error', 'You have already submitted this form');
//       return res.redirect('/student/studentFormsPage');
//     }
    
//     // Process form responses
//     const answers = [];
//     const responses = req.body.responses || {};
    
//     // Process each question from the form
//     for (const question of form.questions) {
//       const questionId = question._id.toString();
//       const questionType = question.questionType || question.type || 'text';
//       const response = responses[questionId];
      
//       const answer = {
//         questionID: questionId,
//         questionText: question.questionText || question.text || '',
//         responseText: null,
//         responseOptions: [],
//         responseRating: null,
//         responseDate: null,
//         responseGrid: {}
//       };
      
//       // Process the answer based on question type
//       switch(questionType) {
//         case 'text':
//         case 'paragraph':
//           answer.responseText = response || '';
//           break;
          
//         case 'rating':
//           if (response) {
//             answer.responseRating = parseInt(response, 10);
//           }
//           break;
          
//         case 'yes_no':
//           if (response) {
//             answer.responseOptions = [response]; // "yes" or "no"
//           }
//           break;
          
//         case 'mcq':
//         case 'radio':
//           if (response) {
//             answer.responseOptions = [response];
//           }
//           break;
          
//         case 'checkbox':
//           if (Array.isArray(response)) {
//             answer.responseOptions = response;
//           } else if (response) {
//             answer.responseOptions = [response];
//           }
//           break;
          
//         case 'dropdown':
//         case 'select':
//           if (response) {
//             answer.responseOptions = [response];
//           }
//           break;
          
//         case 'date':
//           if (response) {
//             answer.responseDate = new Date(response);
//           }
//           break;
          
//         case 'grid':
//           // Grid responses are usually submitted as an object with row IDs as keys
//           if (response && typeof response === 'object') {
//             answer.responseGrid = response;
//           }
//           break;
//       }
      
//       // Validate required fields
//       if (question.required) {
//         let hasAnswer = false;
        
//         if (answer.responseText && answer.responseText.trim() !== '') hasAnswer = true;
//         if (answer.responseOptions && answer.responseOptions.length > 0) hasAnswer = true;
//         if (answer.responseRating !== null) hasAnswer = true;
//         if (answer.responseDate !== null) hasAnswer = true;
//         if (Object.keys(answer.responseGrid).length > 0) hasAnswer = true;
        
//         if (!hasAnswer) {
//           req.flash('error', `Please answer all required questions: "${answer.questionText}"`);
//           return res.redirect(`/student/submitForm/${formId}`);
//         }
//       }
      
//       answers.push(answer);
//     }
    
//     // Create new feedback response according to the schema
//     const feedbackResponse = new FeedbackResponse({
//       formID: formId,
//       studentID: studentId,
//       facultyID: facultyId,
//       section: studentSection,
//       answers: answers,
//       timestamp: new Date()
//     });
    
//     // Save the response
//     await feedbackResponse.save();

//     // Update the form's responses array to include this submission ID (if needed)
//     await FeedbackForm.findByIdAndUpdate(formId, {
//       $push: { responses: feedbackResponse._id }
//     });
    
//     req.flash('success', 'Your feedback has been submitted successfully');
//     res.redirect('/student/studentFormsPage');
    
//   } catch (error) {
//     console.error('Error submitting feedback form:', error);
//     req.flash('error', 'An error occurred while submitting your feedback: ' + error.message);
//     res.redirect('/student/studentFormsPage');
//   }
// });
// Logout Route

router.post('/submitFormResponse/:id', studentValidate, async (req, res) => {
  try {
    const formId = req.params.id;
    const studentId = req.student._id;
    const facultyId = req.body.facultyId;
    const studentSection = req.student.section;
    const studentSemester = req.student.semester; // Semester include kiya

    // Find the form to get its questions
    const form = await FeedbackForm.findById(formId);
    
    if (!form) {
      req.flash('error', 'Form not found');
      return res.redirect('/student/studentFormsPage');
    }
    
    // Check if deadline has passed
    const currentDate = new Date();
    if (currentDate > new Date(form.deadline)) {
      req.flash('error', 'The deadline for this form has passed');
      return res.redirect('/student/studentFormsPage');
    }
    
    // Check if student has already submitted this form
    const existingSubmission = await FeedbackResponse.findOne({
      formID: formId,
      studentID: studentId
    });
    
    if (existingSubmission) {
      req.flash('error', 'You have already submitted this form');
      return res.redirect('/student/studentFormsPage');
    }
    
    // Process form responses
    const answers = [];
    const responses = req.body.responses || {};
    
    for (const question of form.questions) {
      const questionId = question._id.toString();
      const questionType = question.questionType || 'text';
      const response = responses[questionId];
      
      const answer = {
        questionID: questionId,
        responseText: null,
        responseOptions: [],
        responseRating: null
      };
      
      // Process the answer based on question type
      switch (questionType) {
        case 'text':
          answer.responseText = response || '';
          break;
          
        case 'rating':
          if (response) {
            answer.responseRating = parseInt(response, 10);
          }
          break;
          
        case 'yes_no':
        case 'mcq':
        case 'radio':
        case 'dropdown':
          if (response) {
            answer.responseOptions = [response];
          }
          break;
          
        case 'checkbox':
          if (Array.isArray(response)) {
            answer.responseOptions = response;
          } else if (response) {
            answer.responseOptions = [response];
          }
          break;
      }
      
      // Validate required fields
      if (question.required) {
        let hasAnswer = answer.responseText?.trim() !== '' || 
                        answer.responseOptions.length > 0 || 
                        answer.responseRating !== null;
        
        if (!hasAnswer) {
          req.flash('error', `Please answer all required questions: "${question.questionText}"`);
          return res.redirect(`/student/submitForm/${formId}`);
        }
      }
      
      answers.push(answer);
    }
    
    // Create new feedback response
    const feedbackResponse = new FeedbackResponse({
      formID: formId,
      studentID: studentId,
      facultyID: facultyId,
      section: studentSection,
      semester: studentSemester, // Semester added
      answers: answers
    });
    
    // Save the response
    await feedbackResponse.save();

    // Update the form's responses array
    await FeedbackForm.findByIdAndUpdate(formId, {
      $push: { responses: feedbackResponse._id }
    });
    
    req.flash('success', 'Your feedback has been submitted successfully');
    res.redirect('/student/studentFormsPage');
    
  } catch (error) {
    console.error('Error submitting feedback form:', error);
    req.flash('error', 'An error occurred while submitting your feedback: ' + error.message);
    res.redirect('/student/studentFormsPage');
  }
});

router.get("/logout", async (req, res) => {
    try {
        if (req.session.studentId) {
            await Student.findByIdAndUpdate(req.session.studentId, { isLoggedIn: false }); // 🔥 Mark as logged out
        }

        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).send("Error logging out");
            }
            res.clearCookie("token");
            res.redirect("/studentLogin");
        });
    } catch (error) {
        console.error("Error logging out:", error);
        res.redirect("/studentLogin");
    }
});

module.exports = router;