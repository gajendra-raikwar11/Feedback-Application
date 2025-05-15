const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

// Define a sub-schema for teaching assignments
const teachingAssignmentSchema = new mongoose.Schema({
  semester: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["Theory", "Practical", "Tutorial"],
    required: true
  }
}, { _id: false });

// Faculty Schema
const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  branch: {
    type: String,
    required: true
  },
  subjects: {
    type: [String],
    required: false
  },
  sections: {
    type: [String],
    required: false
  },
  semesters: {
    type: [String],
    required: false
  },
  teachingAssignments: {
    type: [teachingAssignmentSchema],
    required: false,
    default: []
  },
  feedbackForms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedbackForm'
  }],
  role: {
    type: String,
    default: "faculty"
  },
  password: {
    type: String,
    required: true
  }
});

// Hash password before saving
facultySchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to verify password
facultySchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Helper method to check if faculty teaches a specific subject in a specific semester and section
facultySchema.methods.teachesSubject = function (semester, section, subject) {
  return this.teachingAssignments.some(
    assignment =>
      assignment.semester === semester &&
      assignment.section === section &&
      assignment.subject === subject
  );
};

// Helper method to get all teaching assignments for a specific semester
facultySchema.methods.getAssignmentsForSemester = function (semester) {
  return this.teachingAssignments.filter(
    assignment => assignment.semester === semester
  );
};

// Helper method to get all teaching assignments for a specific section
facultySchema.methods.getAssignmentsForSection = function (section) {
  return this.teachingAssignments.filter(
    assignment => assignment.section === section
  );
};

// Helper method to get all teaching assignments for a specific subject
facultySchema.methods.getAssignmentsForSubject = function (subject) {
  return this.teachingAssignments.filter(
    assignment => assignment.subject === subject
  );
};

const Faculty = mongoose.model("Faculty", facultySchema);

// Joi validation for teaching assignment
const teachingAssignmentValidationSchema = Joi.object({
  semester: Joi.string().required().messages({
    "any.required": "Semester is required for teaching assignment",
    "string.empty": "Semester cannot be empty"
  }),
  section: Joi.string().required().messages({
    "any.required": "Section is required for teaching assignment",
    "string.empty": "Section cannot be empty"
  }),
  subject: Joi.string().required().messages({
    "any.required": "Subject is required for teaching assignment",
    "string.empty": "Subject cannot be empty"
  }),
  type: Joi.string().valid("Theory", "Practical", "Tutorial").required().messages({
    "any.required": "Type is required for teaching assignment",
    "any.only": "Type must be one of: theory, lab, tutorial",
    "string.empty": "Type cannot be empty"
  })
});

// Complete Joi Validation Schema
const validateFaculty = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().trim().messages({
      "any.required": "Name is required",
      "string.empty": "Name cannot be empty"
    }),
    idNumber: Joi.string().required().trim().messages({
      "any.required": "Faculty ID is required",
      "string.empty": "Faculty ID cannot be empty"
    }),
    email: Joi.string().email().required().trim().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty"
    }),
    branch: Joi.string().required().trim().messages({
      "any.required": "Branch is required",
      "string.empty": "Branch cannot be empty"
    }),
    subjects: Joi.array().items(Joi.string().trim()),
    sections: Joi.array().items(Joi.string().trim()),
    semesters: Joi.array().items(Joi.string().trim()),
    teachingAssignments: Joi.array().items(teachingAssignmentValidationSchema),
    feedbackForms: Joi.array().items(Joi.string()),
    role: Joi.string().valid("faculty", "admin", "hod").default("faculty"),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty"
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

// Joi schema for updates (password optional)
const validateFacultyUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim(),
    email: Joi.string().email().trim().messages({
      "string.email": "Invalid email format" 
    }),
    branch: Joi.string().trim(),
    subjects: Joi.array().items(Joi.string().trim()),
    sections: Joi.array().items(Joi.string().trim()),
    semesters: Joi.array().items(Joi.string().trim()),
    teachingAssignments: Joi.array().items(teachingAssignmentValidationSchema),
    role: Joi.string().valid("faculty", "admin", "hod"),
    password: Joi.string().min(6).messages({
      "string.min": "Password must be at least 6 characters long"
    })
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  Faculty,
  validateFaculty,
  validateFacultyUpdate
};