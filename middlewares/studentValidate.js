const { Student } = require("../models/studentSchema");

const studentValidate = async (req, res, next) => {
    // Agar session mein studentId nahi hai, toh login page pe redirect karein
    if (!req.session.studentId) {
        console.error("Unauthorized access attempt. Redirecting to login.");
        return res.redirect("/studentLogin");
    }

    try {
        // Student ka data database se fetch karein
        const student = await Student.findById(req.session.studentId);

        // Agar student nahi mila toh session clear karke login page pe redirect karein
        if (!student) {
            console.error("Invalid session. Redirecting to login.");
            req.session.destroy(() => res.redirect("/studentLogin"));
            return;
        }

        // Agar sab kuch theek hai toh request object mein student add karen
        req.student = student;
        next();
    } catch (error) {
        console.error("Error in student validation:", error);
        res.redirect("/studentLogin");
    }
};

module.exports = studentValidate;