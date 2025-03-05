const express=require("express");
const app=express();
const path=require("path");
const router = express.Router();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


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

// Login route
router.post("/studentLogin", async (req, res) => {
    const { email, password } = req.body;
  
    // Find an authorized student that matches the email and password
    const authorizedStudent = authorizedStudents.find(
      (student) => student.Email === email && student.Password === password
)});

module.exports = router;