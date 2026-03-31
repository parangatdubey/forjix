const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  uid: String,
  isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", UserSchema);
