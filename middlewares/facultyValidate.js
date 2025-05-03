const { Faculty } = require("../models/facultySchema");

const facultyValidate = async (req, res, next) => {
  // Check if session and faculty email or idNumber exist
  if (
    !req.session.faculty ||
    (!req.session.faculty.email && !req.session.faculty.idNumber)
  ) {
    console.error("Unauthorized access attempt. Redirecting to login.");
    return res.redirect("/faculty/login");
  }

  try {
    // Fetch faculty data using either email or idNumber
    const faculty = await Faculty.findOne({
      $or: [
        { email: req.session.faculty.email },
        { idNumber: req.session.faculty.idNumber },
      ],
    });

    if (!faculty) {
      console.error("Invalid session. Redirecting to login.");
      req.session.destroy(() => res.redirect("/faculty/login"));
      return;
    }

    // Attach faculty to the request and continue
    req.faculty = faculty;
    next();
  } catch (error) {
    console.error("Error in faculty validation:", error);
    res.redirect("/faculty/login");
  }
};

module.exports = facultyValidate;