// const jwt = require('jsonwebtoken');
// const { adminModel } = require('../models/adminSchema');
// require('dotenv').config();

// const validateAdmin = async (req, res, next) => {
//     try {
//         // Check if admin session exists
//         if (req.session && req.session.admin) {
//             // Verify token from cookie
//             const token = req.cookies.adminToken;
            
//             if (!token) {
//                 req.flash('error', 'Authentication required. Please login.');
//                 return res.redirect('/adminLogin');
//             }
            
//             // Verify JWT token
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
//             // Find admin by ID
//             const admin = await adminModel.findById(decoded.id);
            
//             if (!admin) {
//                 req.flash('error', 'Admin not found. Please login again.');
//                 return res.redirect('/adminLogin');
//             }
            
//             // Admin is authenticated, proceed to next middleware
//             next();
//         } else {
//             // No admin session, redirect to login
//             req.flash('error', 'Session expired. Please login again.');
//             return res.redirect('/adminLogin');
//         }
//     } catch (error) {
//         // JWT verification failed or other error
//         console.error('Admin validation error:', error);
//         req.flash('error', 'Authentication failed. Please login again.');
//         return res.redirect('/adminLogin');
//     }
// };

// module.exports = validateAdmin;


// const jwt = require('jsonwebtoken');
// const { adminModel } = require('../models/adminSchema');
// require('dotenv').config();

// const validateAdmin = async (req, res, next) => {
//     try {
//         // Check JWT token first (more secure than just session)
//         const token = req.cookies.adminToken;
        
//         if (!token) {
//             // Clear any potentially invalid session
//             req.session.destroy((err) => {
//                 if (err) console.error('Session destruction error:', err);
//                 req.flash('error', 'Authentication required. Please login.');
//                 return res.redirect('/adminLogin');
//             });
//             return;
//         }
        
//         // Verify JWT token with explicit algorithm
//         let decoded;
//         try {
//             decoded = jwt.verify(token, process.env.JWT_SECRET, {
//                 algorithms: ['HS256'] // Explicitly specify the algorithm
//             });
//         } catch (jwtError) {
//             if (jwtError.name === 'TokenExpiredError') {
//                 req.flash('error', 'Session expired. Please login again.');
//             } else {
//                 req.flash('error', 'Invalid authentication. Please login again.');
//             }
            
//             // Clear session and cookies on token failure
//             req.session.destroy((err) => {
//                 if (err) console.error('Session destruction error:', err);
//                 res.clearCookie('adminToken');
//                 return res.redirect('/adminLogin');
//             });
//             return;
//         }
        
//         // Find admin by ID with minimal projection (security best practice)
//         const admin = await adminModel.findById(decoded.id)
//             .select('_id name email department active')
//             .lean(); // Use lean for better performance
        
//         if (!admin) {
//             req.session.destroy((err) => {
//                 if (err) console.error('Session destruction error:', err);
//                 res.clearCookie('adminToken');
//                 req.flash('error', 'Admin not found. Please login again.');
//                 return res.redirect('/adminLogin');
//             });
//             return;
//         }
        
//         // Check if admin is still active (optional field in your schema)
//         if (admin.active === false) {
//             req.session.destroy((err) => {
//                 if (err) console.error('Session destruction error:', err);
//                 res.clearCookie('adminToken');
//                 req.flash('error', 'Account has been deactivated. Please contact system administrator.');
//                 return res.redirect('/adminLogin');
//             });
//             return;
//         }
        
//         // Validate session data matches token data (prevent session fixation)
//         if (!req.session.admin || req.session.admin.id !== admin._id.toString()) {
//             // Session doesn't match token - refresh session with current data
//             req.session.admin = {
//                 id: admin._id,
//                 name: admin.name,
//                 email: admin.email,
//                 department: admin.department
//             };
            
//             // Save the session explicitly
//             req.session.save((err) => {
//                 if (err) {
//                     console.error('Session save error:', err);
//                     req.flash('error', 'Session error. Please login again.');
//                     return res.redirect('/adminLogin');
//                 }
                
//                 // Admin is authenticated, proceed to next middleware
//                 next();
//             });
//         } else {
//             // Admin is authenticated and session is valid, proceed to next middleware
//             next();
//         }
//     } catch (error) {
//         // Unexpected error - log and redirect
//         console.error('Admin validation error:', error);
        
//         // Clean up on error
//         req.session.destroy((err) => {
//             if (err) console.error('Session destruction error:', err);
//             res.clearCookie('adminToken');
//             req.flash('error', 'Authentication failed. Please login again.');
//             return res.redirect('/adminLogin');
//         });
//     }
// };

// module.exports = validateAdmin;


const jwt = require('jsonwebtoken');
const { adminModel } = require('../models/adminSchema');
require('dotenv').config();

const validateAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.adminToken;

        if (!token) {
            req.flash('error', 'Authentication required. Please login.');
            return res.redirect('/adminLogin');
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                req.flash('error', 'Session expired. Please login again.');
            } else {
                req.flash('error', 'Invalid authentication. Please login again.');
            }
            res.clearCookie('adminToken');
            return res.redirect('/adminLogin');
        }

        const admin = await adminModel.findById(decoded.id)
            .select('_id name email department active')
            .lean();

        if (!admin) {
            res.clearCookie('adminToken');
            req.flash('error', 'Admin not found. Please login again.');
            return res.redirect('/adminLogin');
        }

        if (admin.active === false) {
            res.clearCookie('adminToken');
            req.flash('error', 'Account has been deactivated. Please contact system administrator.');
            return res.redirect('/adminLogin');
        }

        if (!req.session.admin || req.session.admin.id !== admin._id.toString()) {
            req.session.admin = {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                department: admin.department
            };

            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    req.flash('error', 'Session error. Please login again.');
                    res.clearCookie('adminToken');
                    return res.redirect('/adminLogin');
                }
                next();
            });
        } else {
            next();
        }

    } catch (error) {
        console.error('Admin validation error:', error);
        res.clearCookie('adminToken');
        req.flash('error', 'Authentication failed. Please login again.');
        return res.redirect('/adminLogin');
    }
};

module.exports = validateAdmin;
