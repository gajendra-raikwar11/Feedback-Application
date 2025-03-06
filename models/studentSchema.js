const mongoose = require('mongoose');
const Joi = require('joi');

// Mongoose Schema
const studentSchema = new mongoose.Schema({
    SNo: {
        type: Number,
        required: true,
        min: 1
    },
    StudentName: {
        type: String,
        required: true,
        trim: true
    },
    Email: {
        type: String,
        trim: true,
        default: "",
        validate: {
            validator: function (v) {
                // Regular expression for email validation
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    Section: {
        type: String,
        required: true,
        enum: ["A", "B", "C", "D"] // assuming sections are limited to A, B, C, D
    },
    Year: {
        type: Number,
        required: true,
        min: 1,
        max: 4 // assuming a 4-year course
    },
    Password: {
        type: String,
        required: true
    },
    Enroll: {
        type: String,
        required: true,
        unique: true,
        match: /^[0-9]{4}[A-Z]{2}[0-9]{6}$/ // Customize this regex to match your enrollment pattern
    }
});

// Joi Validation Function
function validateStudent(data) {
    const schema = Joi.object({
        SNo: Joi.number().integer().min(1).required(),
        StudentName: Joi.string().trim().required(),
        Email: Joi.string().email().allow('').optional(), // Optional, can be an empty string
        Section: Joi.string().valid("A", "B", "C", "D").required(), // Update based on allowed sections
        Year: Joi.number().integer().min(1).max(4).required(),
        Password: Joi.string().required(),
        Enroll: Joi.string()
            .pattern(new RegExp('^[0-9]{4}[A-Z]{2}[0-9]{6}$'))
            .required()
    });
    return schema.validate(data);
}

// Mongoose Model
const Student = mongoose.model('Student', studentSchema);

module.exports = { Student, validateStudent };