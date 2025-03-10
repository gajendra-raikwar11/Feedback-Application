const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

// Faculty Schema
const facultySchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  subjects: {
    type: [String],
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

// Hash password before saving
facultySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Faculty = mongoose.model("Faculty", facultySchema);

// Joi Validation Schema
const validateFaculty = (data) => {
  const schema = Joi.object({
    empId: Joi.string().required().messages({
      "any.required": "Employee ID is required",
    }),
    name: Joi.string().required().messages({
      "any.required": "Name is required",
    }),
    department: Joi.string().required().messages({
      "any.required": "Department is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    phone: Joi.string().required().messages({
      "any.required": "Phone number is required",
    }),
    subjects: Joi.array().items(Joi.string()).required().messages({
      "any.required": "Subjects are required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data);
};

// Joi Validation for Login
const validateFacultyLogin = (data) => {
  const schema = Joi.object({
    login: Joi.string().required().messages({
      "any.required": "Email or Employee ID is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data);
};

module.exports = { Faculty, validateFaculty, validateFacultyLogin };