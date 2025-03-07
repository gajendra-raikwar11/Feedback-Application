const jwt = require('jsonwebtoken');
function isLoggedIn(req, res, next) {
    try {
      if (!req.cookies.token || req.cookies.token === "") {
        console.log("token error", req.cookies.token);
        return res.redirect('/');
      } else {
        let data = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        req.user = data;
        req.session.studentId = data.studentId;  // Ensure studentId is set here
        next();
      }
    } catch (error) {
      console.log(error);
    }
  }
module.exports = isLoggedIn;  