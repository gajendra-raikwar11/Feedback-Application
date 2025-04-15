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
const authorizedStudentsPath = path.join(
  __dirname,
  "..",
  "authorized_students.json"
);
const authorizedStudents = JSON.parse(
  fs.readFileSync(authorizedStudentsPath, "utf-8")
);
const sendOTPByEmail = require("../config/NodeMailer");
const studentValidate = require("../middlewares/studentValidate");
const {
  FeedbackForm,
  validateFeedbackForm,
} = require("../models/feedbackForm");
const {
  Faculty,
  validateFaculty,
  validateFacultyLogin,
} = require("../models/facultySchema");
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const {
  FeedbackResponse,
  validateFeedbackResponse,
} = require("../models/feedbackResponse");

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
          semester: authorizedStudent.semester || 1, // ✅ Semester जोड़ना
          contact: authorizedStudent.contact || "", // ✅ Contact जोड़ना
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
      req.session.semester = student.semester; // ✅ Semester Session में
      req.session.contact = student.contact; // ✅ Contact Session में
      await req.session.save();

      // JWT Token में Semester और Contact शामिल करें (Optional)
      const token = jwt.sign(
        {
          _id: student._id,
          name: student.name,
          semester: student.semester,
          contact: student.contact,
        },
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
    res
      .status(401)
      .send("Invalid email or password. You are not an authorized student.");
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
      sectionsAssigned: { $in: [student.section] },
    }).lean();

    // Count stats
    let availableForms = 0;
    let pendingForms = 0;
    let completedForms = 0;

    // Process each form to determine its status for this student
    allForms.forEach((form) => {
      // Check if the student has already submitted this form
      const hasSubmitted =
        form.responses &&
        form.responses.some(
          (response) =>
            response.studentId && response.studentId.toString() === studentId
        );

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
        completedForms,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.redirect("/studentLogin");
  }
});
// API route for updating profile within dashboard
router.put("/update-profile", studentValidate, async (req, res) => {
  try {
    // Use req.session.studentId instead of req.user._id
    if (!req.session.studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again.",
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
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
});

router.get("/studentFormsPage", studentValidate, async (req, res) => {
  try {
    const student = req.student;
    const studentSection = student.section;
    const studentSemester = student.semester;
    
    // Fetch active feedback forms for the student's section
    // And populate the responses to access studentId
    const forms = await FeedbackForm.find({
      status: "active",
      sectionsAssigned: studentSection,
    }).populate('responses').lean();
    
    if (!forms.length) {
      return res.render("studentFormsPage", {
        student,
        forms: [],
        currentPage: req.path,
        facultyData: [],
      });
    }
    
    // Filter forms based on common semesters
    const filteredForms = forms.filter((form) => {
      return form.semesters.some((semester) => semester === studentSemester);
    });
    
    if (!filteredForms.length) {
      return res.render("studentFormsPage", {
        student,
        forms: [],
        currentPage: req.path,
        facultyData: [],
      });
    }
    
    // Extract unique faculty IDs from all filtered forms
    const facultyIds = [
      ...new Set(filteredForms.flatMap((form) => form.facultyAssigned)),
    ];
    
    // Fetch faculty details
    const facultyMembers = await Faculty.find({
      _id: { $in: facultyIds },
    }).lean();
    
    // Map faculty ID to their details
    const facultyMap = facultyMembers.reduce((map, faculty) => {
      map[faculty._id.toString()] = faculty;
      return map;
    }, {});
    
    // Enhance forms with relevant faculty
    const enhancedForms = filteredForms
      .map((form) => {
        const relevantFaculty = form.facultyAssigned
          .map((facultyId) => facultyMap[facultyId.toString()])
          .filter(
            (faculty) => faculty && faculty.sections?.includes(studentSection)
          );
        
        return {
          ...form,
          assignedFacultyForStudent: relevantFaculty[0] || null,
          assignedFacultyName: relevantFaculty[0]?.name || "Not Assigned",
          commonSection: relevantFaculty.length ? studentSection : null,
          commonSemester: form.semesters.filter(
            (semester) => semester === studentSemester
          ),
        };
      })
      .filter((form) => form.assignedFacultyForStudent !== null);
    
    // Check submission status - with populated responses
    const studentId = student._id.toString();
    enhancedForms.forEach((form) => {
      form.hasSubmitted = form.responses?.some(
        (response) => response.studentId?.toString() === studentId
      );
      form.canSubmit = new Date() <= new Date(form.deadline);
    });
    
    res.render("studentFormsPage", {
      student,
      forms: enhancedForms,
      currentPage: req.path,
      facultyData: facultyMembers,
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.redirect("/studentLogin");
  }
});

// --------------------------------feedback response
// Route to preview a form
router.get("/previewForm/:id", studentValidate, async (req, res) => {
  try {
    const formId = req.params.id;
    const studentId = req.student._id;
    const userSection = req.student.section;
    const studentSemester = req.student.semester; // छात्र का सेमेस्टर

    const successMessage = req.query.success;

    // Check if the student has already submitted this form
    const existingSubmission = await FeedbackResponse.findOne({
      formID: formId,
      studentID: studentId,
    }).lean();
    if (existingSubmission) {
      return res.redirect(
        `/student/studentFormsPage?resubmitAttempt=true&formId=${formId}`
      );
    }

    // Find the form
    const form = await FeedbackForm.findById(formId).lean();
    if (!form) {
      req.flash("error", "Form not found");
      return res.redirect("/student/studentFormsPage");
    }

    // Check if the user has access to this form based on their section
    let hasAccess = false;

    if (form.sectionsAssigned && form.sectionsAssigned.length > 0) {
      hasAccess = form.sectionsAssigned.includes(userSection);
    } else if (form.sections && form.sections.length > 0) {
      hasAccess = form.sections.some(
        (section) => section.title === userSection
      );
    } else if (form.commonSection) {
      hasAccess = form.commonSection === userSection;
    } else {
      hasAccess = true; // General form
    }

    if (!hasAccess) {
      req.flash("error", "You do not have access to this form");
      return res.redirect("/student/studentFormsPage");
    }

    // Check if the form is still open for submission
    const currentDate = new Date();
    if (currentDate > new Date(form.deadline)) {
      req.flash("error", "The deadline for this form has passed");
      return res.redirect("/student/studentFormsPage");
    }

    // Validate common semester
    const formSemesters = form.semesters || [];
    const commonSemester = formSemesters.find((sem) => sem === studentSemester);

    if (!commonSemester) {
      req.flash("error", "No common semester found for this form.");
      return res.redirect("/student/studentFormsPage");
    }

    // Find faculty for the student's section
    let facultyForSection = "No faculty assigned for your section";
    if (form.facultyAssigned && Array.isArray(form.facultyAssigned)) {
      const facultyIds = form.facultyAssigned;
      const facultyMembers = await Faculty.find({
        _id: { $in: facultyIds },
      }).lean();

      const matchingFaculty = facultyMembers.find(
        (faculty) => faculty.sections && faculty.sections.includes(userSection)
      );

      if (matchingFaculty) {
        facultyForSection = matchingFaculty.name || matchingFaculty.fullName;
      } else if (
        form.sectionsAssigned &&
        Array.isArray(form.sectionsAssigned)
      ) {
        for (let i = 0; i < form.sectionsAssigned.length; i++) {
          if (
            form.sectionsAssigned[i] === userSection &&
            i < facultyIds.length
          ) {
            const facultyId = facultyIds[i];
            const faculty = facultyMembers.find(
              (f) => f._id.toString() === facultyId.toString()
            );
            if (faculty) {
              facultyForSection = faculty.name || faculty.fullName;
              break;
            }
          }
        }
      }

      if (
        facultyForSection === "No faculty assigned for your section" &&
        form.commonSection === userSection
      ) {
        const facultyForCommonSection = facultyMembers.find(
          (faculty) =>
            faculty.sections && faculty.sections.includes(form.commonSection)
        );
        if (facultyForCommonSection) {
          facultyForSection =
            facultyForCommonSection.name || facultyForCommonSection.fullName;
        }
      }
    }

    form.facultyForCurrentStudent = facultyForSection;
    form.commonSemester = commonSemester; // ✅ Common semester को भेजा गया

    res.render("previewForm", {
      title: "Preview Form",
      form: form,
      user: req.student,
      isPreviewOnly: true,
      currentPage: "/student/studentFormsPage",
      commonSemester: commonSemester, // ✅ भेजा गया
    });
  } catch (error) {
    console.error("Error in form preview:", error);
    req.flash(
      "error",
      "An error occurred while retrieving the form: " + error.message
    );
    res.redirect("/student/studentFormsPage");
  }
});
function formatQuestion(question) {
  return {
    _id: question._id || mongoose.Types.ObjectId(),
    text: question.questionText || question.text || "",
    type: question.questionType || question.type || "text",
    description: question.description || "",
    required: question.required !== undefined ? question.required : true,
    options: Array.isArray(question.options) ? question.options : [],
    gridOptions: question.gridOptions || {
      rows: [],
      columns: [],
    },
    dateFormat: question.dateFormat || "YYYY-MM-DD",
    yesNoLabels: question.yesNoLabels || { yes: "Yes", no: "No" },
    section: question.sectionTitle || question.section || "General"
  };
}
// Enhanced GET route to match new form structure with sections
router.get("/submitForm/:id", studentValidate, async (req, res) => {
  try {
    const formId = req.params.id;
    const studentId = req.student._id;
    const userSection = req.student.section;
    const studentSemester = req.student.semester;
    const successMessage = req.query.success;

    // Check if student already submitted this form
    const existingSubmission = await FeedbackResponse.findOne({
      formID: formId,
      studentID: studentId,
    }).lean();

    if (existingSubmission) {
      return res.redirect(
        `/student/studentFormsPage?resubmitAttempt=true&formId=${formId}`
      );
    }

    const form = await FeedbackForm.findById(formId).lean();

    if (!form) {
      req.flash("error", "Form not found");
      return res.redirect("/student/studentFormsPage");
    }

    // Check if student has access to this form
    let hasAccess = false;
    if (form.sectionsAssigned && form.sectionsAssigned.length > 0) {
      hasAccess = form.sectionsAssigned.includes(userSection);
    } else if (form.sections && Array.isArray(form.sections)) {
      // In this case, sections are form structure elements, not class sections
      hasAccess = true;
    } else if (form.commonSection) {
      hasAccess = form.commonSection === userSection;
    } else {
      hasAccess = true;
    }

    if (!hasAccess) {
      req.flash("error", "You do not have access to this form");
      return res.redirect("/student/studentFormsPage");
    }

    // Check deadline
    const currentDate = new Date();
    if (form.deadline && currentDate > new Date(form.deadline)) {
      req.flash("error", "The deadline for this form has passed");
      return res.redirect("/student/studentFormsPage");
    }

    // Find faculty information
    let facultyName = "No faculty assigned for your section";
    let facultyID = null;

    if (
      form.facultyAssigned &&
      Array.isArray(form.facultyAssigned) &&
      form.facultyAssigned.length > 0
    ) {
      const facultyMembers = await Faculty.find({
        _id: { $in: form.facultyAssigned },
      }).lean();

      const matchingFaculty = facultyMembers.find(
        (faculty) => faculty.sections && faculty.sections.includes(userSection)
      );

      if (matchingFaculty) {
        facultyName = matchingFaculty.name || matchingFaculty.fullName;
        facultyID = matchingFaculty._id;
      } else if (
        form.sectionsAssigned &&
        Array.isArray(form.sectionsAssigned)
      ) {
        for (let i = 0; i < form.sectionsAssigned.length; i++) {
          if (
            form.sectionsAssigned[i] === userSection &&
            i < form.facultyAssigned.length
          ) {
            const fId = form.facultyAssigned[i];
            const faculty = facultyMembers.find(
              (f) => f._id.toString() === fId.toString()
            );

            if (faculty) {
              facultyName = faculty.name || faculty.fullName;
              facultyID = faculty._id;
              break;
            }
          }
        }
      }

      if (!facultyID && form.commonSection === userSection) {
        const facultyForCommonSection = facultyMembers.find(
          (faculty) =>
            faculty.sections && faculty.sections.includes(form.commonSection)
        );

        if (facultyForCommonSection) {
          facultyName =
            facultyForCommonSection.name || facultyForCommonSection.fullName;
          facultyID = facultyForCommonSection._id;
        }
      }
    }

    // Find common semester
    const formSemesters = form.semesters || [];
    const commonSemester = formSemesters.find(
      (semester) => semester === studentSemester
    ) || form.commonSemester || studentSemester;

    // Process sections and questions to match the form structure in the HTML
    let processedSections = [];
    if (
      form.sections &&
      Array.isArray(form.sections) &&
      form.sections.length > 0
    ) {
      processedSections = form.sections.map((section) => ({
        _id: section._id || mongoose.Types.ObjectId(),
        title: section.title || "Feedback Section",
        description: section.description || "",
        questions: Array.isArray(section.questions) 
          ? section.questions.map((q) => formatQuestion(q))
          : [],
      }));
    } else {
      processedSections = [
        {
          _id: "default-section",
          title: "Feedback Questions",
          description: "",
          questions: Array.isArray(form.questions) 
            ? form.questions.map((q) => formatQuestion(q))
            : [],
        },
      ];
    }

    const formData = {
      _id: form._id,
      title: form.title || "Feedback Form",
      formType: form.formType || "Course",
      deadline: form.deadline,
      commonSemester: commonSemester,
      sections: processedSections,
    };

    console.log("Rendering submitForm with values:", {
      studentId,
      userSection,
      studentSemester,
      commonSemester,
      facultyID,
    });

    res.render("submitForm", {
      title: "Submit Feedback Form",
      form: formData,
      facultyName: facultyName,
      facultyID: facultyID,
      currentPage: "/student/studentFormsPage",
      successMessage: successMessage,
      messages: req.flash(),
      commonSemester: commonSemester,
      studentID: studentId,
      section: userSection,
      semester: studentSemester,
    });
  } catch (error) {
    console.error("Error displaying submission form:", error);
    req.flash(
      "error",
      "An error occurred while retrieving the form: " + error.message
    );
    res.redirect("/student/studentFormsPage");
  }
});
// Enhanced helper function to convert text responses to numeric values
function convertResponseToNumeric(responseText, questionType) {
  // Skip processing if response is empty
  if (!responseText && responseText !== 0) {
    return null;
  }
  
  // If responseText is already a number, return it directly
  if (!isNaN(responseText) && responseText !== '') {
    return Number(responseText);
  }
  
  // For scale: Poor, Average, Good, Very Good, Excellent, No Opinion
  const ratingMap = {
    "Poor": 1,
    "Average": 2,
    "Good": 3,
    "Very Good": 4,
    "Excellent": 5,
    "No Opinion": null
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
    "No Opinion": null
  };

  // For satisfaction scale: Very Good, Good, Fair, Satisfactory, Unsatisfied
  const satisfactionMap = {
    "Very Good": 5,
    "Good": 4,
    "Fair": 3,
    "Satisfactory": 2,
    "Unsatisfied": 1,
    "No Opinion": null
  };
  
  // For agreement scale: Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree
  const agreementMap = {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neutral": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "No Opinion": null
  };
  
  // For frequency scale: Always, Frequently, Sometimes, Rarely, Never
  const frequencyMap = {
    "Always": 5,
    "Frequently": 4,
    "Sometimes": 3,
    "Rarely": 2,
    "Never": 1,
    "No Opinion": null
  };

  // Handle different question types
  switch (questionType) {
    case "rating":
      return ratingMap[responseText] !== undefined ? ratingMap[responseText] : Number(responseText) || null;
      
    case "yes_no":
      return yesNoMap[responseText] !== undefined ? yesNoMap[responseText] : null;
      
    case "mcq":
    case "radio":
    case "dropdown":
      // Try to match with any of the scales
      const allMaps = [
        ratingMap, 
        yesNoMap, 
        weightMap, 
        satisfactionMap, 
        agreementMap, 
        frequencyMap
      ];
      
      for (const map of allMaps) {
        if (map[responseText] !== undefined) {
          return map[responseText];
        }
      }
      break;
      
    case "grid":
      // Try to extract numeric value from grid response
      if (typeof responseText === 'string') {
        try {
          // Try to parse grid data as JSON if it's stored as a JSON string
          const gridData = JSON.parse(responseText);
          // Calculate average of all values in grid if they're numeric
          if (Object.keys(gridData).length > 0) {
            let sum = 0;
            let count = 0;
            
            for (const row in gridData) {
              const cellValue = gridData[row];
              // Check if cell value matches any of our scales
              for (const map of [ratingMap, satisfactionMap, agreementMap, frequencyMap]) {
                if (map[cellValue] !== undefined) {
                  sum += map[cellValue] || 0;
                  count++;
                  break;
                }
              }
            }
            
            if (count > 0) {
              return parseFloat((sum / count).toFixed(2));
            }
          }
        } catch (e) {
          // If not a valid JSON string, continue with text processing
        }
        
        // Try to match with keyword patterns if JSON parsing failed
        const lowerText = responseText.toLowerCase();
        
        if (lowerText.includes('excellent') || lowerText.includes('strongly agree') || 
            lowerText.includes('very good') || lowerText.includes('always')) {
          return 5;
        } else if (lowerText.includes('good') || lowerText.includes('agree') && 
                  !lowerText.includes('disagree') && !lowerText.includes('strongly')) {
          return 4;
        } else if (lowerText.includes('neutral') || lowerText.includes('fair') || 
                  lowerText.includes('sometimes')) {
          return 3;
        } else if (lowerText.includes('poor') || lowerText.includes('disagree') && 
                  !lowerText.includes('strongly') || lowerText.includes('rarely')) {
          return 2;
        } else if (lowerText.includes('very poor') || lowerText.includes('strongly disagree') || 
                  lowerText.includes('unsatisfied') || lowerText.includes('never')) {
          return 1;
        }
      }
      break;
  }

  return null; // Default if no match found
}
// Enhanced function to calculate section averages and overall average
function calculateAverages(answers) {
  const sectionMap = {};
  let overallTotalScore = 0;
  let overallTotalQuestions = 0;

  // Process each answer
  answers.forEach((answer) => {
    // Skip answers with null numeric values or text/date based questions
    if (answer.responseNumericValue === null || 
        answer.questionType === "text" || 
        answer.questionType === "textarea" || 
        answer.questionType === "date" ||
        answer.questionType === "checkbox") {
      return;
    }
    
    const sectionTitle = answer.sectionTitle || "General";
    
    // Initialize section if it doesn't exist
    if (!sectionMap[sectionTitle]) {
      sectionMap[sectionTitle] = {
        totalScore: 0,
        count: 0,
        questions: []
      };
    }

    // Add to section totals
    sectionMap[sectionTitle].totalScore += answer.responseNumericValue;
    sectionMap[sectionTitle].count++;
    sectionMap[sectionTitle].questions.push({
      id: answer.questionID,
      text: answer.questionText,
      value: answer.responseNumericValue
    });

    // Add to overall totals
    overallTotalScore += answer.responseNumericValue;
    overallTotalQuestions++;
  });

  // Calculate section averages
  const sectionAverages = Object.keys(sectionMap).map((section) => {
    const sectionData = sectionMap[section];
    const avg = sectionData.count > 0 ? 
      sectionData.totalScore / sectionData.count : 0;
      
    return {
      sectionTitle: section,
      averageScore: parseFloat(avg.toFixed(2)),
      questionCount: sectionData.count,
      totalScore: sectionData.totalScore
    };
  });

  // Calculate overall average
  let overallAverage = 0;
  if (overallTotalQuestions > 0) {
    overallAverage = parseFloat((overallTotalScore / overallTotalQuestions).toFixed(2));
  }

  return { 
    sectionAverages, 
    overallAverage,
    totalResponses: overallTotalQuestions 
  };
}
// Helper to determine the current session
function determineCurrentSession() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
  const currentYear = currentDate.getFullYear();
  
  // January (0) to June (5)
  if (currentMonth >= 0 && currentMonth <= 5) {
    return {
      session: `${currentYear}`,
      semesterType: "Even",
      sessionLabel: `${currentYear} (Jan - June)`
    };
  } 
  // September (8) to December (11)
  else if (currentMonth >= 8 && currentMonth <= 11) {
    return {
      session: `${currentYear}`,
      semesterType: "Odd",
      sessionLabel: `${currentYear} (Sep - Dec)`
    };
  }
  // July (6) to August (7)
  else {
    return {
      session: `${currentYear}`,
      semesterType: "Summer",
      sessionLabel: `${currentYear} (Jul - Aug)`
    };
  }
}
// Enhanced POST route to submit form responses - aligned with HTML form structure
router.post("/submitFormResponse/:id", studentValidate, async (req, res) => {
  try {
    const formId = req.params.id;
    const studentId = req.student._id;
    const { 
      answers, 
      formTitle, 
      formType, 
      facultyID, 
      section,
      semester,
      subject,
      commonSemester,
      commonSection,
      sectionCount
    } = req.body;

    console.log("Form submission data:", {
      formId,
      studentId,
      answersCount: answers ? answers.length : 0,
      facultyID,
      section,
      semester,
      commonSemester
    });

    // Verify the form exists
    const form = await FeedbackForm.findById(formId);
    if (!form) {
      req.flash("error", "Form not found");
      return res.redirect("/student/studentFormsPage");
    }

    // Get student information
    const student = await Student.findById(studentId);
    if (!student) {
      req.flash("error", "Student information not found");
      return res.redirect("/student/studentFormsPage");
    }

    // Check the deadline
    const currentDate = new Date();
    if (form.deadline && new Date(form.deadline) < currentDate) {
      req.flash("error", "The deadline for this form has passed");
      return res.redirect("/student/studentFormsPage");
    }

    // Check if already submitted
    const existingSubmission = await FeedbackResponse.findOne({
      formID: formId,
      studentID: studentId,
      facultyID: facultyID || null
    });

    if (existingSubmission) {
      req.flash("error", "You have already submitted this form");
      return res.redirect("/student/studentFormsPage");
    }

    // Get session information
    const sessionInfo = determineCurrentSession();

    // Process answers to add numeric values
    const processedAnswers = [];
    
    // Process each answer - handling all the various input types from the form
    if (Array.isArray(answers)) {
      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        
        // Skip empty answers (no response for non-required questions)
        if (!answer) continue;
        
        // Clone the answer to avoid modifying the original
        const processedAnswer = { ...answer };
        
        // Handle different response types
        if (answer.questionType === "grid" && answer.gridResponses) {
          // Handle grid responses specially
          const gridData = answer.gridResponses || {};
          processedAnswer.responseOriginalText = JSON.stringify(gridData);
          processedAnswer.responseText = JSON.stringify(gridData);
          processedAnswer.responseNumericValue = convertResponseToNumeric(processedAnswer.responseText, "grid");
        } else if (answer.responseText) {
          // Text, textarea, date inputs
          processedAnswer.responseOriginalText = answer.responseText;
          processedAnswer.responseNumericValue = convertResponseToNumeric(answer.responseText, answer.questionType);
        } else if (answer.responseRating !== undefined && answer.responseRating !== null) {
          // Rating inputs
          processedAnswer.responseOriginalText = answer.responseRating.toString();
          processedAnswer.responseText = answer.responseRating.toString();
          processedAnswer.responseNumericValue = Number(answer.responseRating);
        } else if (answer.responseOptions) {
          // Radio, checkbox, dropdown inputs
          const optionValues = Array.isArray(answer.responseOptions) 
            ? answer.responseOptions 
            : [answer.responseOptions];
            
          processedAnswer.responseOriginalText = optionValues.join(", ");
          processedAnswer.responseText = optionValues.join(", ");
          
          if (answer.questionType === "yes_no" || answer.questionType === "radio" || 
              answer.questionType === "mcq" || answer.questionType === "dropdown") {
            // For single-select inputs, use the first/only option
            processedAnswer.responseNumericValue = convertResponseToNumeric(
              optionValues[0],
              answer.questionType
            );
          } else {
            // For multi-select inputs, can't easily assign a numeric value
            processedAnswer.responseNumericValue = null;
          }
        } else if (answer.responseDate) {
          // Date input (separate field)
          processedAnswer.responseOriginalText = answer.responseDate;
          processedAnswer.responseText = answer.responseDate;
          processedAnswer.responseNumericValue = null; // Date doesn't have a numeric equivalent
        } else {
          // Handle other cases or empty responses
          processedAnswer.responseOriginalText = "";
          processedAnswer.responseText = "";
          processedAnswer.responseNumericValue = null;
        }
        
        // Add the processed answer to our array
        processedAnswers.push(processedAnswer);
      }
    }

    // Calculate section averages and overall average
    const { sectionAverages, overallAverage, totalResponses } = calculateAverages(processedAnswers);

    // Create a new response
    const newResponse = new FeedbackResponse({
      formID: formId,
      formTitle: formTitle || form.title,
      formType: formType || form.formType,
      academicType: form.academicType || null,
      
      // Session information
      session: form.session || sessionInfo.session,
      semesterType: form.semesterType || sessionInfo.semesterType,
      sessionLabel: form.sessionLabel || sessionInfo.sessionLabel,
      
      // Student and faculty information
      studentID: studentId,
      studentName: student.name || student.fullName,
      studentEmail: student.email,
      facultyID: facultyID || null,
      
      // Section and semester information
      section: section || student.section || form.sectionsAssigned?.[0] || "N/A",
      semester: semester || student.semester || "N/A",
      subject: subject || form.subjects?.[0] || null,
      commonSemester: commonSemester || form.commonSemester || null,
      commonSection: commonSection || form.commonSection || null,
      
      // Response data
      answers: processedAnswers,
      sectionAverages: sectionAverages,
      overallAverage: overallAverage,
      status: "submitted",
      submittedAt: new Date()
    });

    // Save the response
    const savedResponse = await newResponse.save();

    // Update form with the response reference
    form.responses = [...(form.responses || []), savedResponse._id];
    form.submissionCount = (form.submissionCount || 0) + 1;
    await form.save();

    // Redirect with success message
    req.flash("success", "Your feedback has been submitted successfully");
    return res.redirect("/student/studentFormsPage?success=true");
  } catch (error) {
    console.error("Error submitting form response:", error);
    req.flash("error", "An error occurred while submitting your response: " + error.message);
    return res.redirect("/student/studentFormsPage");
  }
});

router.get("/logout", async (req, res) => {
  try {
    if (req.session.studentId) {
      await Student.findByIdAndUpdate(req.session.studentId, {
        isLoggedIn: false,
      }); // 🔥 Mark as logged out
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
