const express=require("express");
const path=require("path");
const router = express.Router();
require("../config/mongoose");
const mongoose=require("mongoose");
const session=require("express-session");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Student, validateStudent } = require("../models/studentSchema");
const MongoStore = require("connect-mongo"); //store the session even after server is restarted
const authorizedStudentsPath = path.join(__dirname,"..","authorized_students.json");
const authorizedStudents = JSON.parse(fs.readFileSync(authorizedStudentsPath, "utf-8"));
const sendOTPByEmail = require("../config/NodeMailer");

router.use(
    session({
      secret: process.env.JWT_SECRET,
      resave: true,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
      }),
      cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

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
router.get("/facultyLogin", (req, res) => {
    res.render("facultyLogin");
});
router.post("/redirect", (req, res) => {
    const { role } = req.body;
  
    if (role === "student") {
      return res.redirect("/studentLogin"); // Redirect to student route
    } else if (role === "admin") {
      return res.redirect("/adminLogin"); // Redirect to admin route
    }else if (role === "faculty") {
    return res.redirect("/facultyLogin"); // Redirect to admin route
    }
  
    // If no valid role is selected
    res.redirect("/index");
});


router.post("/studentLogin", async (req, res) => {
    const { email, password } = req.body;
    // Find an authorized student that matches the email and password
    const authorizedStudent = authorizedStudents.find(
      (student) => student.Email === email && student.Password === password
  );
  if (authorizedStudent) {
      try {
        // Check if the student already exists in MongoDB
        let student = await Student.findOne({ Email: email });
  
        if (!student) {
          // Hash the password before saving
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
  
          // Prepare student data
          const studentData = {
            ...authorizedStudent,
            Password: hashedPassword,
          };
  
          const { error } = validateStudent(studentData);
          if (error) return res.status(400).send(error.details[0].message);
  
          // Create and save the student in MongoDB
          student = new Student(studentData);
          await student.save();
  
          console.log(`User account created for ${student.StudentName}`);
          req.session.std = student;
          req.session.studentId = student._id;
        } else {
          console.log(`User ${student.StudentName} logged in now.`);
          req.session.std = student;
          req.session.studentId = student._id;
        }
  
        // Generate a JWT token
        const token = jwt.sign(
          { _id: student._id, StudentName: student.StudentName },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
  
        // Set token as an HTTP-only cookie
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 1000,
        });
  
        // Render homepage with student data from MongoDB
        req.session.std = student;
        req.session.studentId = student._id;
        // console.log(req.session.std,req.session.studentId);
        res.redirect("/studentHomepage");
      } catch (error) {
        console.error("Error processing login:", error);
        res.status(500).send("Internal Server Error");
      }
    } else {
      // Unauthorized access
      res
        .status(401)
        .send("Invalid email or password. You are not an authorized student.");
    }
  });
  
//student login page
router.get("/studentHomepage", (req, res) => {
    res.render("studentHomepage");
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
  
    const authorizedStudent = await Student.findOne({ Email: email });
  
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
    const { password, confirmpassword } = req.body;
  
    // if(!studentId) return res.send("user not found");
  
    // if(!password || !confirmpassword) return res.send("password should not be empty");
  
    if (password !== confirmpassword)
      return res.send(`password did not match ${password} ${confirmpassword}`);
  
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
  
    const student1 = await Student.findOneAndUpdate(
      { Email: req.session.studentEmail },
      { Password: hashedPassword },
      { new: true }
    );
    // res.send(hashedPassword === student1.Password);
    updateStudentPassword(req.session.studentEmail, password);
    req.session.destroy();
    const match = await bcrypt.compare(password, hashedPassword);
    console.log(match);
    res.send("password updated successfully");
    res.clearCookie("token");
    res.redirect("/");
  });

module.exports = router;