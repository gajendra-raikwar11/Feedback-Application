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
          console.log(`User ${student.StudentName} already exists in MongoDB.`);
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
module.exports = router;