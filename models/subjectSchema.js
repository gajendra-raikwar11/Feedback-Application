// Subject Schema
const mongoose = require('mongoose');
const Joi = require('joi');

// Mongoose Schema for Subject
const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 10,
    trim: true
  },
  subjectName: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
    trim: true
  },
  type: {
    type: [String],  // Changed to array of strings to support multiple types
    required: true,
    validate: {
      validator: function(v) {
        // Must have at least one valid type
        return v && v.length > 0 && v.every(type => ['Theory', 'Practical'].includes(type));
      },
      message: 'Type must include either Theory, Practical, or both'
    }
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  department: {
    type: String,
    minlength: 2,
    maxlength: 50,
    trim: true
  }
});

// Create the model
const Subject = mongoose.model('Subject', subjectSchema);

// Joi validation schema
const subjectJoiSchema = Joi.object({
  subjectCode: Joi.string()
    .alphanum()
    .min(5)
    .max(10)
    .required()
    .messages({
      'string.base': 'Subject code must be a string',
      'string.empty': 'Subject code cannot be empty',
      'string.min': 'Subject code must be at least 5 characters long',
      'string.max': 'Subject code cannot exceed 10 characters',
      'string.alphanum': 'Subject code must only contain alphanumeric characters',
      'any.required': 'Subject code is required'
    }),

  subjectName: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.base': 'Subject name must be a string',
      'string.empty': 'Subject name cannot be empty',
      'string.min': 'Subject name must be at least 3 characters long',
      'string.max': 'Subject name cannot exceed 100 characters',
      'any.required': 'Subject name is required'
    }),

  // Changed to support array of types
  type: Joi.alternatives().try(
    Joi.array().items(Joi.string().valid('Theory', 'Practical')).min(1).required(),
    Joi.string().valid('Theory', 'Practical').required()
  ).messages({
    'array.min': 'At least one type must be selected',
    'any.required': 'Type is required',
    'alternatives.match': 'Type must be either "Theory", "Practical", or both'
  }),

  semester: Joi.number()
    .integer()
    .min(1)
    .max(8)
    .required()
    .messages({
      'number.base': 'Semester must be a number',
      'number.integer': 'Semester must be an integer',
      'number.min': 'Semester must be at least 1',
      'number.max': 'Semester cannot exceed 8',
      'any.required': 'Semester is required'
    }),
  department: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.base': 'Department must be a string',
      'string.min': 'Department must be at least 2 characters long',
      'string.max': 'Department cannot exceed 50 characters'
    })
});

// Function to validate subject data
function validateSubject(subject) {
  // If type is coming as a single string, convert it to an array
  if (subject.type && !Array.isArray(subject.type)) {
    subject.type = [subject.type];
  }
  return subjectJoiSchema.validate(subject, { abortEarly: false });
}

// Function to initialize sample subjects
async function initializeSubjects() {
  try {
    // Check if subjects already exist
    const count = await Subject.countDocuments();
    if (count === 0) {
      // If no subjects exist, add the initial ones
      await Subject.insertMany(initialSubjects);
      console.log('Sample subjects initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing subjects:', error);
  }
}

module.exports = {
  Subject,
  validateSubject,
  initializeSubjects
};