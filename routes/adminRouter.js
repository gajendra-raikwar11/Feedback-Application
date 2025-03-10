const express = require('express');
const router = express.Router();
const { adminModel } = require("../models/adminSchema"); // Ensure the correct import
const validateAdmin = require("../middlewares/adminValidate");
const sendOTPByEmail = require('../config/NodeMailer');
const session = require('express-session');
const flash = require("express-flash");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Session configuration
router.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key', // Use an env variable
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

if (typeof process.env.NODE_ENV !== "undefined" && process.env.NODE_ENV === "development") {
    router.get("/create", async (req, res) => {
        try {
            // Define the admin details
            const admins = [
                {
                    name: "Dhruv",
                    email: "dhruvmaheswari23@gmail.com",
                    mobile: "9876543210",
                    department: "CSE",
                    password: "admin123",
                    image: "https://media.istockphoto.com/id/116192438/photo/one-indian-it-software-engineer-white-collar-worker-computer-people.webp?a=1&b=1&s=612x612&w=0&k=20&c=yCT6pKSUFtfymcCnUzx6SeSqS8yrWLDeVYZH8mOcJ3c=",
                },
                {
                    name: "Gajendra",
                    email: "gajendra.raikwar.11@gmail.com",
                    mobile: "8319573364",
                    department: "CSE",
                    password: "g",  // Ensure strong password in production
                    image: "https://media.istockphoto.com/id/1180298940/photo/portrait-of-a-medical-director-at-the-hospital.webp?a=1&b=1&s=612x612&w=0&k=20&c=AlcItcOsUzlhnQqY-qMXSco1r5eS3o_BlTR5M4KT3LU=",
                },
            ];

            const results = [];
            for (const adminData of admins) {
                // Check if the admin already exists
                const existingAdmin = await adminModel.findOne({ email: adminData.email });
                if (existingAdmin) {
                    results.push({ email: adminData.email, status: "Already exists" });
                    continue;
                }

                // Hash the password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(adminData.password, salt);

                // Create and save the admin
                const newAdmin = new adminModel({
                    name: adminData.name,
                    email: adminData.email,
                    mobile: adminData.mobile,
                    department: adminData.department,
                    password: hashedPassword,
                    image: adminData.image,  // Added image field
                });

                await newAdmin.save();
                console.log(newAdmin);

                results.push({ email: adminData.email, status: "Created successfully" });
            }

            // Return a response for the batch creation of admins
            res.status(200).send({ message: "Admins processed", results });
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    });
}

// Define lockout parameters
const MAX_ATTEMPTS = 3; // Maximum login attempts
const LOCK_TIME = 5 * 60 * 1000; // Lock duration in milliseconds (5 min)

// Render login page
router.get('/', (req, res) => {
    res.render("adminLogin",{ messages: req.flash() });
});

router.get(["/adminHome", "/dashboard"], (req, res) => {
    const adminData = {
        name: "Gajendra",
        image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/..."
    };

    // Determine the current path dynamically
    const currentPath = req.path; 

    // Render the same view (adminHome) for both routes
    res.render("adminHome", { currentPath, adminData });
});

router.get("/adminFaculty",(req,res)=>{
    const adminData = {
        name: "Gajendra",
        image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/..."
    };

    // Determine the current path dynamically
    const currentPath = req.path; 

    // Render the same view (adminHome) for both routes
    res.render("facultyManagement", { currentPath, adminData });
})


// Admin login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find admin by email
        let validAdmin = await adminModel.findOne({ email: email });

        if (!validAdmin) {
            req.flash('error', 'Admin not found');
            return res.redirect('/adminLogin');
        }

        // Check if account is locked
        if (validAdmin.lockUntil && validAdmin.lockUntil > Date.now()) {
            let remainingTime = Math.ceil((validAdmin.lockUntil - Date.now()) / 60000);
            req.flash('error', `Account locked. Try again in ${remainingTime} minute(s).`);
            return res.redirect('/adminLogin');
        }

        // Validate password
        let valid = await bcrypt.compare(password, validAdmin.password);

        if (valid) {
            // Reset failed attempts and unlock account
            validAdmin.failedAttempts = 0;
            validAdmin.lockUntil = null;
            await validAdmin.save();

            // Generate JWT token
            let token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.cookie("token", token, { httpOnly: true });

            // Store admin ID in session
            req.session.adminId = validAdmin._id;

            req.flash('success', 'Login successful!');
            return res.redirect('/admin/adminHome');
        } else {
            // Increase failed attempts count
            validAdmin.failedAttempts = (validAdmin.failedAttempts || 0) + 1;

            if (validAdmin.failedAttempts >= MAX_ATTEMPTS) {
                validAdmin.lockUntil = Date.now() + LOCK_TIME; // Lock the account
                await validAdmin.save();
                req.flash('error', 'Account locked. Try again in 5 minutes.');
                return res.redirect('/adminLogin');
            }

            await validAdmin.save();
            req.flash('error', `Login failed. ${MAX_ATTEMPTS - validAdmin.failedAttempts} attempts left.`);
            return res.redirect('/adminLogin');
        }
    } catch (error) {
        console.error("Login error:", error);
        req.flash('error', 'Internal Server Error. Please try again.');
        return res.redirect('/adminLogin');
    }
});

module.exports = router;
