const express=require("express");
const app=express();
const path=require("path");

const indexRouter=require("./routes/indexRouter")
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.use("/" ,indexRouter);


app.listen("3000",()=>{
    console.log("server is runnig on port 3000.....");
    
})
