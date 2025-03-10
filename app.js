const express=require("express");
const app=express();
const path=require("path");
const cookieParser = require('cookie-parser');
const indexRouter=require("./routes/indexRouter")
const adminDashboard=require("./routes/adminRouter")
const flash = require('connect-flash');
const facultyRouter=require("./routes/facultyRouter")

require("dotenv").config();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const session = require("express-session");
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

app.use("/" ,indexRouter);
app.use("/admin", adminDashboard);
app.use("/faculty",facultyRouter);



app.listen("3000",()=>{
    console.log("server is runnig on port 3000.....");
    
})