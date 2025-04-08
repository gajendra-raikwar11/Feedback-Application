const express = require("express");
const path = require("path");
const router = express.Router();
require("../config/mongoose");
const mongoose = require("mongoose");
const session = require("express-session");
const fs = require("fs");
const bcrypt = require("bcryptjs");
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
                  semester: authorizedStudent.semester || 1,  // ✅ Semester जोड़ना
                  contact: authorizedStudent.contact || ""    // ✅ Contact जोड़ना
              };

              const { error } = validateStudent(studentData);
              if (error) return res.status(400).send(error.details[0].message);

              student = new Student(studentData);
              await student.save();

              console.log(`User account created for ${student.name}`);
          } else {
              console.log(`User ${student.name} logged in now.`);
          }

          // Session में student ID, semester और contact स्टोर करें
          req.session.studentId = student._id.toString();
          req.session.semester = student.semester;   // ✅ Semester Session में
          req.session.contact = student.contact;     // ✅ Contact Session में
          await req.session.save();

          // JWT Token में Semester और Contact शामिल करें (Optional)
          const token = jwt.sign(
              { _id: student._id, name: student.name, semester: student.semester, contact: student.contact }, 
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
    
    const { name, email, contact } = req.body;
    
    // Find and update the student document
    const updatedStudent = await Student.findByIdAndUpdate(
      req.session.studentId,
      { name, email, contact },
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
      const student = req.student;
      const studentSection = student.section;      // ✅ Student का Section
      const studentSemester = student.semester;    // ✅ Student का Semester

      // Fetch active feedback forms for the student's section
      const forms = await FeedbackForm.find({
          status: "active",
          sectionsAssigned: studentSection // ✅ Section Matching
      }).lean();

      if (!forms.length) {
          return res.render("studentFormsPage", { student, forms: [], currentPage: req.path });
      }

      // Filter forms based on common semesters
      const filteredForms = forms.filter(form => {
          // ✅ Check if there's any common semester between student and form
          return form.semesters.some(semester => semester === studentSemester);
      });

      if (!filteredForms.length) {
          return res.render("studentFormsPage", { student, forms: [], currentPage: req.path });
      }

      // Extract unique faculty IDs from all filtered forms
      const facultyIds = [...new Set(filteredForms.flatMap(form => form.facultyAssigned))];

      // Fetch faculty details
      const facultyMembers = await Faculty.find({ _id: { $in: facultyIds } }).lean();

      // Map faculty ID to their details
      const facultyMap = facultyMembers.reduce((map, faculty) => {
          map[faculty._id.toString()] = faculty;
          return map;
      }, {});

      // Enhance forms with relevant faculty
      const enhancedForms = filteredForms.map(form => {
          const relevantFaculty = form.facultyAssigned
              .map(facultyId => facultyMap[facultyId.toString()])
              .filter(faculty => faculty && faculty.sections?.includes(studentSection));

          return {
              ...form,
              assignedFacultyForStudent: relevantFaculty[0] || null,
              assignedFacultyName: relevantFaculty[0]?.name || "Not Assigned",
              commonSection: relevantFaculty.length ? studentSection : null,
              commonSemester: form.semesters.filter(semester => semester === studentSemester) // ✅ Common Semester दिखाएं
          };
      }).filter(form => form.assignedFacultyForStudent !== null);

      // Check submission status
      const studentId = student._id.toString();
      enhancedForms.forEach(form => {
          form.hasSubmitted = form.responses?.some(response => response.studentId?.toString() === studentId);
          form.canSubmit = new Date() <= new Date(form.deadline);
      });

      res.render("studentFormsPage", { student, forms: enhancedForms, currentPage: req.path });

  } catch (error) {
      console.error("Error fetching forms:", error);
      res.redirect("/studentLogin");
  }
});


// --------------------------------feedback response
// Route to preview a form
router.get('/previewForm/:id', studentValidate, async (req, res) => {
  try {
    const formId = req.params.id;
    const studentId = req.student._id;
    const userSection = req.student.section;
    const studentSemester = req.student.semester; // छात्र का सेमेस्टर

    const successMessage = req.query.success;

    // Check if the student has already submitted this form
    const existingSubmission = await FeedbackResponse.findOne({
      formID: formId,
      studentID: studentId
    }).lean();
    if (existingSubmission) {
      return res.redirect(`/student/studentFormsPage?resubmitAttempt=true&formId=${formId}`);
    }

    // Find the form
    const form = await FeedbackForm.findById(formId).lean();
    if (!form) {
      req.flash('error', 'Form not found');
      return res.redirect('/student/studentFormsPage');
    }

    // Check if the user has access to this form based on their section
    let hasAccess = false;

    if (form.sectionsAssigned && form.sectionsAssigned.length > 0) {
      hasAccess = form.sectionsAssigned.includes(userSection);
    } else if (form.sections && form.sections.length > 0) {
      hasAccess = form.sections.some(section => section.title === userSection);
    } else if (form.commonSection) {
      hasAccess = form.commonSection === userSection;
    } else {
      hasAccess = true; // General form
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

    // Validate common semester
    const formSemesters = form.semesters || [];
    const commonSemester = formSemesters.find(sem => sem === studentSemester);

    if (!commonSemester) {
      req.flash('error', 'No common semester found for this form.');
      return res.redirect('/student/studentFormsPage');
    }

    // Find faculty for the student's section
    let facultyForSection = "No faculty assigned for your section";
    if (form.facultyAssigned && Array.isArray(form.facultyAssigned)) {
      const facultyIds = form.facultyAssigned;
      const facultyMembers = await Faculty.find({ _id: { $in: facultyIds } }).lean();

      const matchingFaculty = facultyMembers.find(faculty =>
        faculty.sections && faculty.sections.includes(userSection)
      );

      if (matchingFaculty) {
        facultyForSection = matchingFaculty.name || matchingFaculty.fullName;
      } else if (form.sectionsAssigned && Array.isArray(form.sectionsAssigned)) {
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

      if (facultyForSection === "No faculty assigned for your section" && form.commonSection === userSection) {
        const facultyForCommonSection = facultyMembers.find(faculty =>
          faculty.sections && faculty.sections.includes(form.commonSection)
        );
        if (facultyForCommonSection) {
          facultyForSection = facultyForCommonSection.name || facultyForCommonSection.fullName;
        }
      }
    }

    form.facultyForCurrentStudent = facultyForSection;
    form.commonSemester = commonSemester; // ✅ Common semester को भेजा गया

    res.render('previewForm', {
      title: 'Preview Form',
      form: form,
      user: req.student,
      isPreviewOnly: true,
      currentPage: '/student/studentFormsPage',
      commonSemester: commonSemester // ✅ भेजा गया
    });

  } catch (error) {
    console.error('Error in form preview:', error);
    req.flash('error', 'An error occurred while retrieving the form: ' + error.message);
    res.redirect('/student/studentFormsPage');
  }
});

// router.get('/submitForm/:id', studentValidate, async (req, res) => {
//   try {
//     const formId = req.params.id;
//     const studentId = req.student._id;
//     const userSection = req.student.section;

//     const successMessage = req.query.success;

//     // Check if the student has already submitted this form
//     const existingSubmission = await FeedbackResponse.findOne({
//       formID: formId,
//       studentID: studentId
//     }).lean();

//     if (existingSubmission) {
//       return res.redirect(`/student/studentFormsPage?resubmitAttempt=true&formId=${formId}`);
//     }

//     // Find the form with complete information
//     const form = await FeedbackForm.findById(formId).lean();

//     if (!form) {
//       req.flash('error', 'Form not found');
//       return res.redirect('/student/studentFormsPage');
//     }

//     // Check if the user has access to this form based on their section
//     let hasAccess = false;
//     if (form.sectionsAssigned && form.sectionsAssigned.length > 0) {
//       hasAccess = form.sectionsAssigned.includes(userSection);
//     } else if (form.sections && form.sections.length > 0) {
//       hasAccess = form.sections.includes(userSection);
//     } else if (form.commonSection) {
//       hasAccess = form.commonSection === userSection;
//     } else {
//       hasAccess = true;
//     }

//     if (!hasAccess) {
//       req.flash('error', 'You do not have access to this form');
//       return res.redirect('/student/studentFormsPage');
//     }

//     // Check if the form is still open for submission
//     const currentDate = new Date();
//     if (currentDate > new Date(form.deadline)) {
//       req.flash('error', 'The deadline for this form has passed');
//       return res.redirect('/student/studentFormsPage');
//     }

//     // Find faculty for student's section
//     let facultyName = "No faculty assigned for your section";
//     let facultyId = null;

//     if (form.facultyAssigned && Array.isArray(form.facultyAssigned) && form.facultyAssigned.length > 0) {
//       const facultyMembers = await Faculty.find({ _id: { $in: form.facultyAssigned } }).lean();

//       const matchingFaculty = facultyMembers.find(faculty =>
//         faculty.sections && faculty.sections.includes(userSection)
//       );

//       if (matchingFaculty) {
//         facultyName = matchingFaculty.name || matchingFaculty.fullName;
//         facultyId = matchingFaculty._id;
//       } else if (form.sectionsAssigned && Array.isArray(form.sectionsAssigned)) {
//         for (let i = 0; i < form.sectionsAssigned.length; i++) {
//           if (form.sectionsAssigned[i] === userSection && i < form.facultyAssigned.length) {
//             const fId = form.facultyAssigned[i];
//             const faculty = facultyMembers.find(f => f._id.toString() === fId.toString());

//             if (faculty) {
//               facultyName = faculty.name || faculty.fullName;
//               facultyId = faculty._id;
//               break;
//             }
//           }
//         }
//       }

//       if (!facultyId && form.commonSection === userSection) {
//         const facultyForCommonSection = facultyMembers.find(faculty =>
//           faculty.sections && faculty.sections.includes(form.commonSection)
//         );

//         if (facultyForCommonSection) {
//           facultyName = facultyForCommonSection.name || facultyForCommonSection.fullName;
//           facultyId = facultyForCommonSection._id;
//         }
//       }
//     }

//     // Semester validation
//     const studentSemester = req.student.semester;
//     const formSemesters = form.semesters || [];

//     // Filter semesters that are common
//     const commonSemester = formSemesters.find(semester => semester === studentSemester);

//     if (!commonSemester) {
//       req.flash('error', 'No common semester found for this form.');
//       return res.redirect('/student/studentFormsPage');
//     }
//     // Process sections and questions for proper rendering
//     let processedSections = [];
//     if (form.sections && Array.isArray(form.sections) && form.sections.length > 0) {
//       processedSections = form.sections.map(section => ({
//         _id: section._id,
//         title: section.title,
//         description: section.description || "",
//         questions: (section.questions || []).map(q => formatQuestion(q))
//       }));
//     } else {
//       processedSections = [{
//         _id: "default-section",
//         title: "Feedback Questions",
//         description: "",
//         questions: (form.questions || []).map(q => formatQuestion(q))
//       }];
//     }

//     const formData = {
//       _id: form._id,
//       title: form.title || "Feedback Form",
//       formType: form.formType || "Course",
//       deadline: form.deadline,
//       semesters: commonSemester || "Current Semester",
//       sections: processedSections
//     };

//     res.render('submitForm', {
//       title: 'Submit Feedback Form',
//       form: formData,
//       facultyName: facultyName,
//       facultyId: facultyId,
//       currentPage: '/student/studentFormsPage',
//       successMessage: successMessage,
//       messages: req.flash(),
//       commonSemester: commonSemester // ✅ भेजा गया
//     });

//   } catch (error) {
//     console.error('Error displaying submission form:', error);
//     req.flash('error', 'An error occurred while retrieving the form: ' + error.message);
//     res.redirect('/student/studentFormsPage');
//   }
// });
// // Helper function to format questions consistently
// function formatQuestion(question) {
//   return {
//     _id: question._id,
//     text: question.questionText || question.text || "",
//     type: question.questionType || question.type || "text",
//     description: question.description || "",
//     required: question.required || false,
//     options: Array.isArray(question.options) ? question.options : [],
//     gridOptions: question.gridOptions || {
//       rows: [],
//       columns: []
//     },
//     dateFormat: question.dateFormat || "YYYY-MM-DD",
//     yesNoLabels: question.yesNoLabels || { yes: "Yes", no: "No" }
//   };
// }
// // POST route to submit form responses
// router.post('/submitFormResponse/:id', studentValidate, async (req, res) => {
//   try {
//     const formId = req.params.id;
//     const studentId = req.student._id;
//     const { answers, formTitle, formType, commonSemester } = req.body;
    
//     // Verify the form exists
//     const form = await FeedbackForm.findById(formId);
//     if (!form) {
//       return res.status(404).json({ message: 'Form not found' });
//     }
    
//     // Get student information
//     const student = await Student.findById(studentId);
//     if (!student) {
//       return res.status(404).json({ message: 'Student information not found' });
//     }
    
//     // Check the deadline
//     const currentDate = new Date();
//     if (form.deadline && new Date(form.deadline) < currentDate) {
//       return res.status(400).json({ message: 'The deadline for this form has passed' });
//     }
    
//     // Check if already submitted
//     const existingSubmission = await FeedbackResponse.findOne({
//       formID: formId,
//       studentID: studentId
//     });
    
//     if (existingSubmission) {
//       return res.status(400).json({ message: 'You have already submitted this form' });
//     }
    
//     // Create a new response
//     const newResponse = new FeedbackResponse({
//       formID: formId,
//       formTitle: formTitle || form.title,
//       formType: formType || form.formType,
//       studentID: studentId,
//       section: student.section || form.sectionsAssigned[0] || 'N/A',
//       semester: commonSemester || form.commonSemester || student.semester,
//       answers: answers, // Already formatted on the client side
//       submittedAt: new Date()
//     });
    
//     await newResponse.save();
    
//     // Update form submission count
//     form.submissionCount = (form.submissionCount || 0) + 1;
//     await form.save();
    
//     return res.status(200).json({ message: 'Your feedback has been submitted successfully' });
//   } catch (error) {
//     console.error('Error submitting form response:', error);
//     return res.status(500).json({ message: 'An error occurred while submitting your response: ' + error.message });
//   }
// });


// Modified GET route for form submission
// Modified GET route for form submission



// 
router.get('/submitForm/:id', studentValidate, async (req, res) => {
  try {
    const formId = req.params.id;
    const studentId = req.student._id;
    const userSection = req.student.section;
    const studentSemester = req.student.semester;
    const successMessage = req.query.success;

    const existingSubmission = await FeedbackResponse.findOne({
      formID: formId,
      studentID: studentId
    }).lean();

    if (existingSubmission) {
      return res.redirect(`/student/studentFormsPage?resubmitAttempt=true&formId=${formId}`);
    }

    const form = await FeedbackForm.findById(formId).lean();

    if (!form) {
      req.flash('error', 'Form not found');
      return res.redirect('/student/studentFormsPage');
    }

    let hasAccess = false;
    if (form.sectionsAssigned && form.sectionsAssigned.length > 0) {
      hasAccess = form.sectionsAssigned.includes(userSection);
    } else if (form.sections && form.sections.length > 0) {
      hasAccess = form.sections.includes(userSection);
    } else if (form.commonSection) {
      hasAccess = form.commonSection === userSection;
    } else {
      hasAccess = true;
    }

    if (!hasAccess) {
      req.flash('error', 'You do not have access to this form');
      return res.redirect('/student/studentFormsPage');
    }

    const currentDate = new Date();
    if (currentDate > new Date(form.deadline)) {
      req.flash('error', 'The deadline for this form has passed');
      return res.redirect('/student/studentFormsPage');
    }

    let facultyName = "No faculty assigned for your section";
    let facultyId = null;

    if (form.facultyAssigned && Array.isArray(form.facultyAssigned) && form.facultyAssigned.length > 0) {
      const facultyMembers = await Faculty.find({ _id: { $in: form.facultyAssigned } }).lean();

      const matchingFaculty = facultyMembers.find(faculty =>
        faculty.sections && faculty.sections.includes(userSection)
      );

      if (matchingFaculty) {
        facultyName = matchingFaculty.name || matchingFaculty.fullName;
        facultyId = matchingFaculty._id;
      } else if (form.sectionsAssigned && Array.isArray(form.sectionsAssigned)) {
        for (let i = 0; i < form.sectionsAssigned.length; i++) {
          if (form.sectionsAssigned[i] === userSection && i < form.facultyAssigned.length) {
            const fId = form.facultyAssigned[i];
            const faculty = facultyMembers.find(f => f._id.toString() === fId.toString());

            if (faculty) {
              facultyName = faculty.name || faculty.fullName;
              facultyId = faculty._id;
              break;
            }
          }
        }
      }

      if (!facultyId && form.commonSection === userSection) {
        const facultyForCommonSection = facultyMembers.find(faculty =>
          faculty.sections && faculty.sections.includes(form.commonSection)
        );

        if (facultyForCommonSection) {
          facultyName = facultyForCommonSection.name || facultyForCommonSection.fullName;
          facultyId = facultyForCommonSection._id;
        }
      }
    }

    const formSemesters = form.semesters || [];
    const commonSemester = formSemesters.find(semester => semester === studentSemester);

    if (!commonSemester) {
      req.flash('error', 'No common semester found for this form.');
      return res.redirect('/student/studentFormsPage');
    }

    let processedSections = [];
    if (form.sections && Array.isArray(form.sections) && form.sections.length > 0) {
      processedSections = form.sections.map(section => ({
        _id: section._id,
        title: section.title,
        description: section.description || "",
        questions: (section.questions || []).map(q => formatQuestion(q))
      }));
    } else {
      processedSections = [{
        _id: "default-section",
        title: "Feedback Questions",
        description: "",
        questions: (form.questions || []).map(q => formatQuestion(q))
      }];
    }

    const formData = {
      _id: form._id,
      title: form.title || "Feedback Form",
      formType: form.formType || "Course",
      deadline: form.deadline,
      semesters: commonSemester || "Current Semester",
      sections: processedSections
    };

    console.log('Rendering submitForm with values:', {
      studentId,
      userSection,
      studentSemester,
      commonSemester,
      facultyId
    });

    res.render('submitForm', {
      title: 'Submit Feedback Form',
      form: formData,
      facultyName: facultyName,
      facultyId: facultyId,
      currentPage: '/student/studentFormsPage',
      successMessage: successMessage,
      messages: req.flash(),
      commonSemester: commonSemester,
      studentID: studentId,
      section: userSection,
      semester: studentSemester
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
//     const {
//       answers,
//       formTitle,
//       formType,
//       facultyID,
//       commonSemester,
//       section,
//       semester
//     } = req.body;

//     console.log('Received form submission:', {
//       studentId,
//       formId,
//       section,
//       semester,
//       commonSemester
//     });

//     const form = await FeedbackForm.findById(formId);
//     if (!form) {
//       return res.status(404).json({ message: 'Form not found' });
//     }

//     const student = await Student.findById(studentId);
//     if (!student) {
//       return res.status(404).json({ message: 'Student information not found' });
//     }

//     const currentDate = new Date();
//     if (form.deadline && new Date(form.deadline) < currentDate) {
//       return res.status(400).json({ message: 'The deadline for this form has passed' });
//     }

//     const existingSubmission = await FeedbackResponse.findOne({
//       formID: formId,
//       studentID: studentId
//     });

//     if (existingSubmission) {
//       return res.status(400).json({ message: 'You have already submitted this form' });
//     }

//     const processedAnswers = answers.map(answer => {
//       const processedAnswer = { ...answer };

//       if (answer.responseOptions && answer.responseOptions.length > 0) {
//         processedAnswer.responseOriginalText = answer.responseOptions.join(', ');
//         const responseText = answer.responseOptions[0];
//         processedAnswer.responseNumericValue = convertResponseToNumeric(responseText, answer.questionType);
//       } else if (answer.questionType === "rating" && answer.responseRating !== null) {
//         processedAnswer.responseNumericValue = answer.responseRating;
//       }

//       return processedAnswer;
//     });

//     // Get section averages and ensure no NaN values
//     let { sectionAverages, overallAverage } = calculateAverages(processedAnswers);
    
//     // Fix NaN values in section averages
//     sectionAverages = sectionAverages.map(section => ({
//       ...section,
//       averageScore: isNaN(section.averageScore) ? 0 : Number(section.averageScore)
//     }));
    
//     // Fix NaN value in overall average
//     overallAverage = isNaN(overallAverage) ? 0 : Number(overallAverage);
    
//     // Log the values before saving to verify
//     console.log('Section averages after fixing NaN:', sectionAverages);
//     console.log('Overall average after fixing NaN:', overallAverage);

//     const newResponse = new FeedbackResponse({
//       formID: formId,
//       formTitle: formTitle || form.title,
//       formType: formType || form.formType,
//       studentID: studentId,
//       facultyID: facultyID || null,
//       section: section || student.section || form.sectionsAssigned?.[0] || 'N/A',
//       semester: semester || student.semester || 'N/A',
//       commonSemester: commonSemester || form.commonSemester || null,
//       answers: processedAnswers,
//       sectionAverages: sectionAverages,
//       overallAverage: overallAverage,
//       status: "submitted",
//       submittedAt: new Date()
//     });

//     console.log('Saving response with:', {
//       section: newResponse.section,
//       semester: newResponse.semester,
//       commonSemester: newResponse.commonSemester
//     });

//     await newResponse.save();

//     form.submissionCount = (form.submissionCount || 0) + 1;
//     await form.save();

//     return res.status(200).json({
//       message: 'Your feedback has been submitted successfully',
//       responseId: newResponse._id,
//       overallAverage: overallAverage,
//       sectionsCount: sectionAverages.length
//     });
//   } catch (error) {
//     console.warn('Error submitting form response:', error);
//     return res.status(500).json({ message: 'An error occurred while submitting your response: ' + error.message });
//   }
// });
// Helper function to format questions consistently

// router.post('/submitFormResponse/:id', studentValidate, async (req, res) => {
//   try {
//     const formId = req.params.id;
//     const studentId = req.student._id;
//     const {
//       answers,
//       formTitle,
//       formType,
//       facultyID,
//       commonSemester,
//       section,
//       semester
//     } = req.body;

//     console.log('Received form submission:', {
//       studentId,
//       formId,
//       section,
//       semester,
//       commonSemester
//     });

//     const form = await FeedbackForm.findById(formId);
//     if (!form) {
//       return res.status(404).json({ message: 'Form not found' });
//     }

//     const student = await Student.findById(studentId);
//     if (!student) {
//       return res.status(404).json({ message: 'Student information not found' });
//     }

//     const currentDate = new Date();
//     if (form.deadline && new Date(form.deadline) < currentDate) {
//       return res.status(400).json({ message: 'The deadline for this form has passed' });
//     }

//     const existingSubmission = await FeedbackResponse.findOne({
//       formID: formId,
//       studentID: studentId
//     });

//     if (existingSubmission) {
//       return res.status(400).json({ message: 'You have already submitted this form' });
//     }

//     // Log the raw answers to see their structure
//     console.log('Raw answers:', JSON.stringify(answers.slice(0, 1)));

//     const processedAnswers = answers.map(answer => {
//       const processedAnswer = { ...answer };

//       // Check if responseOptions exists and is an array before using join()
//       if (answer.responseOptions && Array.isArray(answer.responseOptions) && answer.responseOptions.length > 0) {
//         processedAnswer.responseOriginalText = answer.responseOptions.join(', ');
//         const responseText = answer.responseOptions[0];
//         processedAnswer.responseNumericValue = convertResponseToNumeric(responseText, answer.questionType);
//       } else if (answer.responseOptions && !Array.isArray(answer.responseOptions)) {
//         // Handle case where responseOptions is not an array (could be a string or object)
//         processedAnswer.responseOriginalText = String(answer.responseOptions);
//         processedAnswer.responseNumericValue = convertResponseToNumeric(processedAnswer.responseOriginalText, answer.questionType);
//       } else if (answer.questionType === "rating" && answer.responseRating !== null) {
//         processedAnswer.responseNumericValue = answer.responseRating;
//       }

//       return processedAnswer;
//     });

//     // Get section averages and ensure no NaN values
//     let { sectionAverages, overallAverage } = calculateAverages(processedAnswers);
    
//     // Fix NaN values in section averages
//     sectionAverages = sectionAverages.map(section => ({
//       ...section,
//       averageScore: isNaN(section.averageScore) ? 0 : Number(section.averageScore)
//     }));
    
//     // Fix NaN value in overall average
//     overallAverage = isNaN(overallAverage) ? 0 : Number(overallAverage);
    
//     // Log the values before saving to verify
//     console.log('Section averages after fixing NaN:', sectionAverages);
//     console.log('Overall average after fixing NaN:', overallAverage);

//     const newResponse = new FeedbackResponse({
//       formID: formId,
//       formTitle: formTitle || form.title,
//       formType: formType || form.formType,
//       studentID: studentId,
//       facultyID: facultyID || null,
//       section: section || student.section || form.sectionsAssigned?.[0] || 'N/A',
//       semester: semester || student.semester || 'N/A',
//       commonSemester: commonSemester || form.commonSemester || null,
//       answers: processedAnswers,
//       sectionAverages: sectionAverages,
//       overallAverage: overallAverage,
//       status: "submitted",
//       submittedAt: new Date()
//     });

//     console.log('Saving response with:', {
//       section: newResponse.section,
//       semester: newResponse.semester,
//       commonSemester: newResponse.commonSemester
//     });

//     await newResponse.save();

//     form.submissionCount = (form.submissionCount || 0) + 1;
//     await form.save();

//     return res.status(200).json({
//       message: 'Your feedback has been submitted successfully',
//       responseId: newResponse._id,
//       overallAverage: overallAverage,
//       sectionsCount: sectionAverages.length
//     });
//   } catch (error) {
//     console.warn('Error submitting form response:', error);
//     return res.status(500).json({ message: 'An error occurred while submitting your response: ' + error.message });
//   }
// });

// function formatQuestion(question) {
//   return {
//     _id: question._id,
//     text: question.questionText || question.text || "",
//     type: question.questionType || question.type || "text",
//     description: question.description || "",
//     required: question.required || false,
//     options: Array.isArray(question.options) ? question.options : [],
//     gridOptions: question.gridOptions || {
//       rows: [],
//       columns: []
//     },
//     dateFormat: question.dateFormat || "YYYY-MM-DD",
//     yesNoLabels: question.yesNoLabels || { yes: "Yes", no: "No" }
//   };
// }
// // Helper function to convert text responses to numeric values
// function convertResponseToNumeric(responseText, questionType) {
//   // For scale: Poor, Average, Good, Very Good, Excellent, No Opinion
//   const scaleMap1 = {
//     "Poor": 1,
//     "Average": 2,
//     "Good": 3,
//     "Very Good": 4,
//     "Excellent": 5,
//     "No Opinion": 0
//   };
  
//   // For Yes/No: No, Yes, No Opinion
//   const yesNoMap = {
//     "No": 0,
//     "Yes": 1,
//     "No Opinion": null
//   };
  
//   // For weight scale: Just right, Too light, Too Heavy, No Opinion
//   const weightMap = {
//     "Just right": 2,
//     "Too light": 1,
//     "Too Heavy": 3,
//     "No Opinion": 0
//   };
  
//   // For satisfaction scale: Very Good, Good, Fair, Satisfactory, Unsatisfied
//   const satisfactionMap = {
//     "Very Good": 5,
//     "Good": 4,
//     "Fair": 3,
//     "Satisfactory": 2,
//     "Unsatisfied": 1
//   };
  
//   if (questionType === "rating") {
//     // Rating is already numeric (1-5)
//     return responseText ? Number(responseText) : null;
//   } else if (questionType === "yes_no") {
//     return yesNoMap[responseText] ?? null;
//   } else if (questionType === "mcq" || questionType === "radio") {
//     // Try to match with any of the scales
//     if (scaleMap1[responseText] !== undefined) {
//       return scaleMap1[responseText];
//     } else if (yesNoMap[responseText] !== undefined) {
//       return yesNoMap[responseText];
//     } else if (weightMap[responseText] !== undefined) {
//       return weightMap[responseText];
//     } else if (satisfactionMap[responseText] !== undefined) {
//       return satisfactionMap[responseText];
//     }
//   }
  
//   return null; // Default if no match found
// }
// // Function to calculate section averages and overall average
// function calculateAverages(answers) {
//   // Group answers by their section
//   const sectionGroups = {};
//   answers.forEach(answer => {
//     if (!answer.section) return; // Skip answers without sections
    
//     if (!sectionGroups[answer.section]) {
//       sectionGroups[answer.section] = [];
//     }
//     sectionGroups[answer.section].push(answer);
//   });
  
//   // Calculate average for each section
//   const sectionAverages = Object.keys(sectionGroups).map(sectionName => {
//     const sectionAnswers = sectionGroups[sectionName];
//     const validNumericAnswers = sectionAnswers.filter(answer => 
//       !isNaN(answer.responseNumericValue) && answer.responseNumericValue !== null
//     );
    
//     // Avoid division by zero
//     const count = validNumericAnswers.length;
//     let averageScore = 0;
    
//     if (count > 0) {
//       const sum = validNumericAnswers.reduce((total, answer) => 
//         total + Number(answer.responseNumericValue), 0);
//       averageScore = sum / count;
//     }
    
//     return {
//       sectionName,
//       averageScore,
//       questionCount: sectionAnswers.length
//     };
//   });
  
//   // Calculate overall average
//   const allValidScores = answers
//     .filter(answer => !isNaN(answer.responseNumericValue) && answer.responseNumericValue !== null)
//     .map(answer => Number(answer.responseNumericValue));
  
//   let overallAverage = 0;
//   if (allValidScores.length > 0) {
//     const sum = allValidScores.reduce((total, score) => total + score, 0);
//     overallAverage = sum / allValidScores.length;
//   }
  
//   return { sectionAverages, overallAverage };
// }
// Helper function to format questions consistently


function formatQuestion(question) {
  return {
    _id: question._id,
    text: question.questionText || question.text || "",
    type: question.questionType || question.type || "text",
    description: question.description || "",
    required: question.required || false,
    options: Array.isArray(question.options) ? question.options : [],
    gridOptions: question.gridOptions || {
      rows: [],
      columns: []
    },
    dateFormat: question.dateFormat || "YYYY-MM-DD",
    yesNoLabels: question.yesNoLabels || { yes: "Yes", no: "No" }
  };
}
// Helper function to convert text responses to numeric values
function convertResponseToNumeric(responseText, questionType) {
  // For scale: Poor, Average, Good, Very Good, Excellent, No Opinion
  const scaleMap1 = {
    "Poor": 1,
    "Average": 2,
    "Good": 3,
    "Very Good": 4,
    "Excellent": 5,
    "No Opinion": 0
  };
  
  // For Yes/No: No, Yes, No Opinion
  const yesNoMap = {
    "No": 0,
    "Yes": 1,
    "No Opinion": null
  };
  
  // For weight scale: Just right, Too light, Too Heavy, No Opinion
  const weightMap = {
    "Just right": 2,
    "Too light": 1,
    "Too Heavy": 3,
    "No Opinion": 0
  };
  
  // For satisfaction scale: Very Good, Good, Fair, Satisfactory, Unsatisfied
  const satisfactionMap = {
    "Very Good": 5,
    "Good": 4,
    "Fair": 3,
    "Satisfactory": 2,
    "Unsatisfied": 1
  };
  
  if (questionType === "rating") {
    // Rating is already numeric (1-5)
    return responseText ? Number(responseText) : null;
  } else if (questionType === "yes_no") {
    return yesNoMap[responseText] ?? null;
  } else if (questionType === "mcq" || questionType === "radio") {
    // Try to match with any of the scales
    if (scaleMap1[responseText] !== undefined) {
      return scaleMap1[responseText];
    } else if (yesNoMap[responseText] !== undefined) {
      return yesNoMap[responseText];
    } else if (weightMap[responseText] !== undefined) {
      return weightMap[responseText];
    } else if (satisfactionMap[responseText] !== undefined) {
      return satisfactionMap[responseText];
    }
  }
  
  return null; // Default if no match found
}
// Function to calculate section averages and overall average
function calculateAverages(answers) {
  const sectionMap = {};
  let totalScore = 0;
  let totalQuestions = 0;
  
  // Group answers by section and calculate section averages
  answers.forEach(answer => {
    if (answer.responseNumericValue !== null) {
      if (!sectionMap[answer.sectionTitle]) {
        sectionMap[answer.sectionTitle] = {
          totalScore: 0,
          count: 0
        };
      }
      
      sectionMap[answer.sectionTitle].totalScore += answer.responseNumericValue;
      sectionMap[answer.sectionTitle].count++;
      
      totalScore += answer.responseNumericValue;
      totalQuestions++;
    }
  });
  
  // Calculate section averages
  const sectionAverages = Object.keys(sectionMap).map(section => {
    const avg = sectionMap[section].totalScore / sectionMap[section].count;
    return {
      sectionTitle: section,
      averageScore: parseFloat(avg.toFixed(2))
    };
  });
  
  // Calculate overall average
  let overallAverage = 0;
  if (totalQuestions > 0) {
    overallAverage = parseFloat((totalScore / totalQuestions).toFixed(2));
  }
  
  return { sectionAverages, overallAverage };
}
// Modified POST route to submit form responses
router.post('/submitFormResponse/:id', studentValidate, async (req, res) => {
  try {
    const formId = req.params.id;
    const studentId = req.student._id;
    const { 
      answers, 
      formTitle, 
      formType, 
      facultyID, 
      commonSemester 
    } = req.body;
    
    // Verify the form exists
    const form = await FeedbackForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Get student information
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student information not found' });
    }
    
    // Check the deadline
    const currentDate = new Date();
    if (form.deadline && new Date(form.deadline) < currentDate) {
      return res.status(400).json({ message: 'The deadline for this form has passed' });
    }
    
    // Check if already submitted
    const existingSubmission = await FeedbackResponse.findOne({
      formID: formId,
      studentID: studentId
    });
    
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this form' });
    }
    
    // Process answers to add numeric values
    const processedAnswers = answers.map(answer => {
      // Clone the answer to avoid modifying the original
      const processedAnswer = { ...answer };
      
      // Store original text response if present
      if (answer.responseOptions && answer.responseOptions.length > 0) {
        processedAnswer.responseOriginalText = answer.responseOptions.join(', ');
        // Convert to numeric value
        const responseText = answer.responseOptions[0]; // Assuming single selection
        processedAnswer.responseNumericValue = convertResponseToNumeric(responseText, answer.questionType);
      } else if (answer.questionType === "rating" && answer.responseRating !== null) {
        processedAnswer.responseNumericValue = answer.responseRating;
      }
      
      return processedAnswer;
    });
    
    // Calculate section averages and overall average
    const { sectionAverages, overallAverage } = calculateAverages(processedAnswers);
    
    // Create a new response
    const newResponse = new FeedbackResponse({
      formID: formId,
      formTitle: formTitle || form.title,
      formType: formType || form.formType,
      studentID: studentId,
      facultyID: facultyID || null,
      section: student.section || form.sectionsAssigned?.[0] || 'N/A',
      semester: student.semester || 'N/A',
      commonSemester: commonSemester || form.commonSemester || null,
      answers: processedAnswers,
      sectionAverages: sectionAverages,
      overallAverage: overallAverage,
      status: "submitted",
      submittedAt: new Date()
    });
    
    await newResponse.save();
    
    // Update form submission count
    form.submissionCount = (form.submissionCount || 0) + 1;
    await form.save();
    
    return res.status(200).json({ 
      message: 'Your feedback has been submitted successfully',
      responseId: newResponse._id,
      overallAverage: overallAverage,
      sectionsCount: sectionAverages.length
    });
  } catch (error) {
    console.error('Error submitting form response:', error);
    return res.status(500).json({ message: 'An error occurred while submitting your response: ' + error.message });
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