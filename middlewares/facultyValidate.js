const { Faculty } = require("../models/facultySchema");

const facultyValidate = async (req, res, next) => {
  try {
    const sessionFaculty = req.session?.faculty;

    // Check if session exists and has identifying info
    if (!sessionFaculty || !(sessionFaculty.email || sessionFaculty.idNumber)) {
      console.warn("Unauthorized access: Missing faculty session data.");
      return res.redirect("/faculty/login");
    }

    // Attempt to find faculty in DB
    const faculty = await Faculty.findOne({
      $or: [
        { email: sessionFaculty.email },
        { idNumber: sessionFaculty.idNumber },
      ],
    });

    if (!faculty) {
      console.warn("Invalid session: Faculty not found. Destroying session.");
      req.session.destroy(err => {
        if (err) console.error("Error destroying session:", err);
        return res.redirect("/faculty/login");
      });
      return;
    }

    // Attach faculty to the request object
    req.faculty = faculty;
    next();
  } catch (error) {
    console.error("Error during faculty validation:", error);
    return res.redirect("/faculty/login");
  }
};

module.exports = facultyValidate;
