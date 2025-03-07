const jwt = require("jsonwebtoken");
const { adminModel } = require('../models/adminSchema');
async function validateAdmin(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token) return res.redirect('/admin');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await adminModel.findOne({ email: decoded.email });

        if (!admin) return res.redirect('/admin');

        res.locals.admin = admin;  // Set admin in res.locals for views
        next();
    } catch (error) {
        res.redirect('/admin');
    }
}

module.exports = validateAdmin;
