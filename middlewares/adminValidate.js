const jwt = require('jsonwebtoken');
const { adminModel } = require('../models/adminSchema');
require('dotenv').config();

/**
 * Middleware to validate if the user is an authenticated admin
 * Checks both JWT token in cookies and session data
 */
const validateAdmin = async (req, res, next) => {
    try {
        // Check if admin session exists
        if (req.session && req.session.admin) {
            // Verify token from cookie
            const token = req.cookies.adminToken;
            
            if (!token) {
                req.flash('error', 'Authentication required. Please login.');
                return res.redirect('/adminLogin');
            }
            
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find admin by ID
            const admin = await adminModel.findById(decoded.id);
            
            if (!admin) {
                req.flash('error', 'Admin not found. Please login again.');
                return res.redirect('/adminLogin');
            }
            
            // Admin is authenticated, proceed to next middleware
            next();
        } else {
            // No admin session, redirect to login
            req.flash('error', 'Session expired. Please login again.');
            return res.redirect('/adminLogin');
        }
    } catch (error) {
        // JWT verification failed or other error
        console.error('Admin validation error:', error);
        req.flash('error', 'Authentication failed. Please login again.');
        return res.redirect('/adminLogin');
    }
};

module.exports = validateAdmin;