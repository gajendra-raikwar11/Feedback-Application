const mongoose = require('mongoose');
const Joi = require('joi');

// Mongoose Schema
const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    enrollmentNumber: {
        type: String,
        required: true,
        unique: true,
        match: /^[0-9]{4}[A-Z]{2}[0-9]{6}$/ // Customize this regex to match your enrollment pattern
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    branch: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8 // Assuming 8 semesters for a 4-year course
    },
    contact: { type: String, required: true } ,
    feedbackGiven: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeedbackForm'
    }],
    role: {
        type: String,
        default: "student"
    },
    password: {
        type: String,
        required: true
    },
    isLoggedIn: { 
        type: Boolean, default: false 
    }
});

// Joi Validation Function
function validateStudent(data) {
    const schema = Joi.object({
        name: Joi.string().trim().required().messages({
            "any.required": "Student name is required"
        }),
        enrollmentNumber: Joi.string()
            .pattern(new RegExp('^[0-9]{4}[A-Z]{2}[0-9]{6}$'))
            .required()
            .messages({
                "any.required": "Enrollment number is required",
                "string.pattern.base": "Invalid enrollment number format"
            }),
        email: Joi.string().email().required().messages({
            "string.email": "Invalid email format",
            "any.required": "Email is required"
        }),
        branch: Joi.string().required().messages({
            "any.required": "Branch is required" 
        }),
        section: Joi.string().required().messages({
            "any.required": "Section is required"
        }),
        semester: Joi.number().integer().min(1).max(8).required().messages({
            "any.required": "Semester is required",
            "number.min": "Semester must be at least 1",
            "number.max": "Semester cannot exceed 8"
        }),
        contact: Joi.alternatives()
      .try(
        Joi.string().pattern(/^[0-9]{10}$/),
        Joi.number().integer().min(1000000000).max(9999999999)
      )
      .required()
      .messages({
        "alternatives.types": "Contact must be a valid 10-digit phone number",
        }),
        feedbackGiven: Joi.array().items(Joi.string()).optional(),
        role: Joi.string().valid("student").default("student"),
        password: Joi.string().required().messages({
            "any.required": "Password is required"
        }),
        isLoggedIn: Joi.boolean().default(false)
    });
    return schema.validate(data);
}

// Mongoose Model
const Student = mongoose.model('Student', studentSchema);

module.exports = { Student, validateStudent };