const express=require("express");
const path=require("path");
const router = express.Router();
require("../config/mongoose");
const mongoose=require("mongoose");
const session=require("express-session");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Student, validateStudent } = require("../models/studentSchema");
const MongoStore = require("connect-mongo"); //store the session even after server is restarted

const sendOTPByEmail = require("../config/NodeMailer");

router.get("/", (req, res) => {
    res.render("index");
});

//student login page
router.get("/studentLogin", (req, res) => {
    res.render("studentLogin");
});

//admin login page
router.get("/adminLogin", (req, res) => {
    res.render("adminLogin");
});

//faculty login page
router.get("/faculty/login", (req, res) => {
    res.render("facultyLogin");
});

router.post("/redirect", (req, res) => {
    const { role } = req.body;
  
    if (role === "student") {
      return res.redirect("/studentLogin"); // Redirect to student route
    } else if (role === "admin") {
      return res.redirect("/adminLogin"); // Redirect to admin route
    }else if (role === "faculty") {
    return res.redirect("/faculty/login"); // Redirect to admin route
    }
  
    // If no valid role is selected
    res.redirect("/index");
});

//password update setup
function updateStudentPassword(email, newPassword) {
    // Read the JSON file into authorizedStudents
    const authorizedStudents = JSON.parse(
      fs.readFileSync(authorizedStudentsPath, "utf-8")
    );
  
    // Find the student by email
    const student = authorizedStudents.find((stud) => stud.Email === email);
  
    // If the student is found, update the password
    if (student) {
      student.Password = newPassword;
      console.log(`Password updated for ${student.StudentName}`);
  
      // Write the updated array back to the JSON file
      fs.writeFileSync(
        authorizedStudentsPath,
        JSON.stringify(authorizedStudents, null, 2),
        "utf-8"
      );
      console.log("File successfully updated with new password.");
    } else {
      console.log("Student not found.");
    }
    console.log(student ? student : null);
}

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Change Password Section
router.get("/student/changepassword", (req, res) => {
  res.render("changePassword");
});

// send otp page
router.post("/sendotp", async (req, res) => {
    const { email } = req.body;
  
    const authorizedStudent = await Student.findOne({ email: email });
  
    if (!authorizedStudent) return res.send("You are not authorized user");
  
    const otp = generateOTP();
  
    try {
      req.session.uid = authorizedStudent._id;
      req.session.generatedOTP = otp;
      req.session.otpExpirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes
      req.session.studentEmail = authorizedStudent.Email;
      console.log(req.session.studentEmail);
      await sendOTPByEmail(email, otp);
      res.render("otp");
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

// Check OTP
router.post("/checkotp", async (req, res) => {
    const { otp } = req.body;
    if (req.session.generatedOTP && Date.now() < req.session.otpExpirationTime) {
      if (parseInt(otp) === parseInt(req.session.generatedOTP))
        res.render("reset-password");
      else res.send(`wrong OTP ${otp} ${req.session.generatedOTP}`);
    }
});

//reset password route
router.post("/reset-password", async (req, res) => {
    const { password, confirmPassword } = req.body;
    console.log(password,confirmPassword);
    // if(!studentId) return res.send("user not found");
  
    // if(!password || !confirmpassword) return res.send("password should not be empty");
  
    if (password !== confirmPassword)
      return res.send(`password did not match ${password} ${confirmPassword}`);
  
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
  
    const student1 = await Student.findOneAndUpdate(
      { Email: req.session.studentEmail },
      { Password: hashedPassword },
      { new: true }
    );
    student1.save();
    // res.send(hashedPassword === student1.Password);
    // updateStudentPassword(req.session.studentEmail, password);
    req.session.destroy();
    const match = await bcrypt.compare(password, hashedPassword);
    console.log(match);
    res.send("password updated successfully");
    res.clearCookie("token");
    res.redirect("/");
  });

module.exports = router;