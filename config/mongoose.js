require('dotenv').config();
const mongoose = require('mongoose');

const dbgr = require('debug')('development:mongoose');

mongoose.connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    dbgr("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    console.log(err);
    
    dbgr(err);
  });

  let db = mongoose.connection;
  module.exports = db;  