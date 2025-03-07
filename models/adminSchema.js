const Joi = require("joi"); 
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String, // Changed to string to support country codes
        required: true
    },
    department: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8 
    },
    image: {
        type: String,
        default: 'https://media.istockphoto.com/id/1180298940/photo/portrait-of-a-medical-director-at-the-hospital.webp?a=1&b=1&s=612x612&w=0&k=20&c=AlcItcOsUzlhnQqY-qMXSco1r5eS3o_BlTR5M4KT3LU=' 
    },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },  
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

const validateAdmin = (data) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(), 
        mobile: Joi.string().pattern(/^[0-9]{10}$/).required(), // Ensures a 10-digit mobile number
        department: Joi.string().required(),
        password: Joi.string().min(8).required(),
        image: Joi.string().uri().optional(), 
    });

    return schema.validate(data);
};

module.exports = { 
    adminModel: mongoose.model("Admin", adminSchema), 
    validateAdmin 
};
