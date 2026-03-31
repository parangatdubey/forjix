const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  fatherName: String,
  rollNo: String,
  regNo: String,
  mobile: String,
  collegeEmail: String,
  dob: String,
  address: String
});

module.exports = mongoose.model("Profile", ProfileSchema);
