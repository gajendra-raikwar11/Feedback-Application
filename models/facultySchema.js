const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

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
    required: true
  },
  sections: {
    type: [String],
    required: true
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

const Faculty = mongoose.model("Faculty", facultySchema);

// Joi Validation Schema
const validateFaculty = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "any.required": "Name is required",
    }),
    idNumber: Joi.string().required().messages({
      "any.required": "Faculty ID is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    branch: Joi.string().required().messages({
      "any.required": "Branch is required",
    }),
    subjects: Joi.array().items(Joi.string()).required().messages({
      "any.required": "Subjects are required",
    }),
    sections: Joi.array().items(Joi.string()).required().messages({
      "any.required": "Sections are required",
    }),
    feedbackForms: Joi.array().items(Joi.string()),
    role: Joi.string(),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data);
};

module.exports = { Faculty, validateFaculty };
